import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { statsApi } from "../api";
import { useAsync } from "../hooks/use-async";
import { EventsContext, useEvents } from "../hooks/use-events";
import { buildTickerText, tickerFallback } from "../lib/events";
import { usePlatformConfig } from "../hooks/use-platform-config";
import { usd } from "../utils/money";
import Sidebar from "./sidebar";
import Ticker from "./ticker";
import Topbar from "./topbar";

/** The authenticated app frame: sidebar · topbar · activity strip · scrollable view. */
export default function AppShell() {
	const platform = usePlatformConfig();
	const events = useEvents();
	const { pathname } = useLocation();

	// The buyer's lifetime savings. Sharing subscriptions to save money is the
	// whole product, so the figure is worn by the chrome (topbar + sidebar),
	// not buried on the wallet page. Fetched once here, shown twice.
	const savingsQ = useAsync(() => statsApi.savings(), []);
	const savings =
		savingsQ.data && usd(savingsQ.data.totalSavedUsd) > 0 ? savingsQ.data : undefined;

	/**
	 * Below 1128px the sidebar is a drawer toggled from the topbar's hamburger.
	 *
	 * The state is *the route the drawer was opened on*, not a boolean, so a
	 * navigation closes it for free — the drawer is open only while the route it
	 * was opened on is still the current one. The nav rows call `onNavigate`
	 * anyway, but a back gesture, a redirect or a link somewhere else inside the
	 * drawer would otherwise leave it sitting over the page you just reached.
	 * Deriving it this way is also the only way to do it without a setState in
	 * an effect, which is a cascading render React rightly complains about.
	 */
	const [openedOn, setOpenedOn] = useState<string | null>(null);
	const navOpen = openedOn === pathname;
	const closeNav = () => setOpenedOn(null);

	// Escape closes it, like any other overlay.
	useEffect(() => {
		if (!navOpen) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpenedOn(null);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [navOpen]);

	// The page scrolls in this inner container, not the window, so React
	// Router's own restoration never sees it: scrolling the grid and opening a
	// listing would otherwise land mid-page. Fresh route, top of the page.
	const scrollerRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		scrollerRef.current?.scrollTo(0, 0);
	}, [pathname]);

	// Keyboard journey of the drawer: focus moves into it on open and back to
	// the hamburger on close. Only below the desktop breakpoint, where the
	// sidebar actually overlays the page — on desktop it is plain page chrome.
	const wasOpen = useRef(false);
	useEffect(() => {
		const isDrawer = window.matchMedia("(max-width: 1127.98px)").matches;
		if (isDrawer && navOpen) {
			document.querySelector<HTMLElement>(".app-sidebar")?.focus();
		} else if (isDrawer && !navOpen && wasOpen.current) {
			document.querySelector<HTMLElement>(".menu-btn")?.focus();
		}
		wasOpen.current = navOpen;
	}, [navOpen]);

	return (
		<EventsContext.Provider value={events}>
			<div className="app-frame">
				<Sidebar
					unreadCount={events.unreadCount}
					savings={savings}
					open={navOpen}
					onNavigate={closeNav}
				/>
				<div
					className={`nav-backdrop${navOpen ? " show" : ""}`}
					onClick={closeNav}
					aria-hidden="true"
				/>
				<main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
					<Topbar
						menuOpen={navOpen}
						savings={savings}
						onMenu={() => setOpenedOn(navOpen ? null : pathname)}
					/>
					<Ticker text={events.loading ? tickerFallback(platform) : buildTickerText(events.events, platform)} />
					<div ref={scrollerRef} style={{ flex: 1, overflowY: "auto" }}>
						<Outlet />
					</div>
				</main>
			</div>
		</EventsContext.Provider>
	);
}
