import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AsyncPanel from "../components/async-panel";
import Page from "../components/page";
import { useSharedEvents } from "../hooks/use-events";
import { getLastSeen } from "../lib/events";
import { formatRelative } from "../utils/format";

const mono: React.CSSProperties = { fontFamily: "var(--font-mono)" };

export default function Notifications() {
	const navigate = useNavigate();
	const { events, loading, error, unreadCount, markAllRead, reload } = useSharedEvents();

	// Freshen the shared feed when the inbox opens.
	useEffect(() => {
		reload();
	}, [reload]);

	const seen = getLastSeen();

	return (
		<Page idx="04" title="Inbox" sub={`${unreadCount} unread · derived from your orders, disputes and payouts`}>
			<div style={{ display: "flex", alignItems: "center" }}>
				<span className="text-muted" style={{ ...mono, fontSize: 11, letterSpacing: "0.1em" }}>
					{unreadCount} UNREAD
				</span>
				<button className="btn btn-ghost" style={{ marginLeft: "auto" }} onClick={markAllRead}>
					Mark all as read
				</button>
			</div>

			<AsyncPanel
				loading={loading}
				error={error}
				isEmpty={events.length === 0}
				emptyMessage="Nothing yet — activity on your orders lands here"
			>
				<div style={{ borderTop: "2px solid var(--color-divider)" }}>
					{events.map((event, index) => {
						const unread = event.time > seen;
						return (
							<div
								key={event.id}
								className="row-click"
								onClick={() => navigate(event.href)}
								style={{
									display: "flex",
									flexDirection: "column",
									gap: 4,
									padding: "14px 16px",
									borderLeft: `3px solid ${unread ? "var(--color-accent)" : "transparent"}`,
									background: unread ? "var(--color-neutral-100)" : "transparent",
									borderBottom: "1px solid var(--color-divider)",
									animation: `fadeUp .4s ease ${(Math.min(index, 12) * 0.05).toFixed(2)}s both`,
								}}
							>
								<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
									<span style={{ fontSize: 14, fontWeight: 700 }}>{event.title}</span>
									<span className="tag tag-neutral" style={{ ...mono, fontSize: 10 }}>
										{event.tag}
									</span>
									<span className="text-muted" style={{ marginLeft: "auto", ...mono, fontSize: 11 }}>
										{formatRelative(event.time)}
									</span>
								</div>
								<div className="text-muted" style={{ fontSize: 13, maxWidth: "80ch" }}>
									{event.body}
								</div>
							</div>
						);
					})}
				</div>
			</AsyncPanel>
		</Page>
	);
}
