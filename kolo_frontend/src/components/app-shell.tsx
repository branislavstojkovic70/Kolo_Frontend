import { Outlet } from "react-router-dom";
import { useEvents } from "../hooks/use-events";
import { buildTickerText, TICKER_FALLBACK } from "../lib/events";
import Sidebar from "./sidebar";
import Ticker from "./ticker";
import Topbar from "./topbar";

/** The authenticated app frame: sidebar · topbar · live ticker · scrollable view. */
export default function AppShell() {
	const { events, loading, unreadCount } = useEvents();

	return (
		<div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
			<Sidebar unreadCount={unreadCount} />
			<main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
				<Topbar />
				<Ticker text={loading ? TICKER_FALLBACK : buildTickerText(events)} />
				<div style={{ flex: 1, overflowY: "auto" }}>
					<Outlet />
				</div>
			</main>
		</div>
	);
}
