import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { EventsContext, useEvents } from "../hooks/use-events";
import { buildTickerText, tickerFallback } from "../lib/events";
import { usePlatformConfig } from "../hooks/use-platform-config";
import Sidebar from "./sidebar";
import Ticker from "./ticker";
import Topbar from "./topbar";

/** The authenticated app frame: sidebar · topbar · activity strip · scrollable view. */
export default function AppShell() {
	const platform = usePlatformConfig();
	const events = useEvents();
	const { pathname } = useLocation();

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

	return (
		<EventsContext.Provider value={events}>
			<div className="app-frame">
				<Sidebar unreadCount={events.unreadCount} open={navOpen} onNavigate={closeNav} />
				<div
					className={`nav-backdrop${navOpen ? " show" : ""}`}
					onClick={closeNav}
					aria-hidden="true"
				/>
				<main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
					<Topbar onMenu={() => setOpenedOn(navOpen ? null : pathname)} />
					<Ticker text={events.loading ? tickerFallback(platform) : buildTickerText(events.events, platform)} />
					<div style={{ flex: 1, overflowY: "auto" }}>
						<Outlet />
					</div>
				</main>
			</div>
		</EventsContext.Provider>
	);
}
