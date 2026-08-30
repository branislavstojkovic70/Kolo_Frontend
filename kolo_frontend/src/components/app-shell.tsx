import { Outlet } from "react-router-dom";
import { EventsContext, useEvents } from "../hooks/use-events";
import { buildTickerText, TICKER_FALLBACK } from "../lib/events";
import Sidebar from "./sidebar";
import Ticker from "./ticker";
import Topbar from "./topbar";

/** The authenticated app frame: sidebar · topbar · live ticker · scrollable view. */
export default function AppShell() {
	const events = useEvents();

	return (
		<EventsContext.Provider value={events}>
			<div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
				<Sidebar unreadCount={events.unreadCount} />
				<main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
					<Topbar />
					<Ticker text={events.loading ? TICKER_FALLBACK : buildTickerText(events.events)} />
					<div style={{ flex: 1, overflowY: "auto" }}>
						<Outlet />
					</div>
				</main>
			</div>
		</EventsContext.Provider>
	);
}
