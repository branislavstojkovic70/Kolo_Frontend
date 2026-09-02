import { useState } from "react";
import { Outlet } from "react-router-dom";
import { EventsContext, useEvents } from "../hooks/use-events";
import { buildTickerText, tickerFallback } from "../lib/events";
import { usePlatformConfig } from "../hooks/use-platform-config";
import Sidebar from "./sidebar";
import Ticker from "./ticker";
import Topbar from "./topbar";

/** The authenticated app frame: sidebar · topbar · live ticker · scrollable view. */
export default function AppShell() {
	const platform = usePlatformConfig();
	const events = useEvents();
	// Below tablet width the sidebar becomes a drawer toggled from the topbar.
	const [navOpen, setNavOpen] = useState(false);

	return (
		<EventsContext.Provider value={events}>
			<div className="app-frame">
				<Sidebar
					unreadCount={events.unreadCount}
					open={navOpen}
					onNavigate={() => setNavOpen(false)}
				/>
				<div className={`nav-backdrop${navOpen ? " show" : ""}`} onClick={() => setNavOpen(false)} />
				<main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
					<Topbar onMenu={() => setNavOpen((v) => !v)} />
					<Ticker text={events.loading ? tickerFallback(platform) : buildTickerText(events.events, platform)} />
					<div style={{ flex: 1, overflowY: "auto" }}>
						<Outlet />
					</div>
				</main>
			</div>
		</EventsContext.Provider>
	);
}
