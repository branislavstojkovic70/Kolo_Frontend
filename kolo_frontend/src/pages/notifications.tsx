import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AsyncPanel from "../components/async-panel";
import Page from "../components/page";
import Pagination from "../components/pagination";
import { useSharedEvents } from "../hooks/use-events";
import { useListControls } from "../hooks/use-list-controls";
import { getLastSeen } from "../lib/events";
import { formatRelative } from "../utils/format";

const mono: React.CSSProperties = { fontFamily: "var(--font-mono)" };

/**
 * The inbox has no backend table — events are derived client-side — so its
 * search, filter and pagination all run over the in-memory feed. The `tag` is
 * the closest thing an event has to a status.
 */
const TAGS = ["Order", "Sale", "Payment", "Escrow", "Vesting", "Dispute", "Payout"] as const;

type EventTag = (typeof TAGS)[number];

export default function Notifications() {
	const navigate = useNavigate();
	const { events, loading, error, unreadCount, markAllRead, reload } = useSharedEvents();
	const controls = useListControls<EventTag>(20);
	const { search, status, page, limit } = controls;

	// Freshen the shared feed when the inbox opens.
	useEffect(() => {
		reload();
	}, [reload]);

	const seen = getLastSeen();

	const filtered = useMemo(() => {
		const needle = search.toLowerCase();
		return events.filter(
			(event) =>
				(!status || event.tag === status) &&
				// Titles repeat across events ("Order placed"), so the body — which
				// carries the service name — is searched too.
				(!needle ||
					event.title.toLowerCase().includes(needle) ||
					event.body.toLowerCase().includes(needle))
		);
	}, [events, search, status]);

	const pages = Math.max(1, Math.ceil(filtered.length / limit));
	const visible = useMemo(
		() => filtered.slice((page - 1) * limit, page * limit),
		[filtered, page, limit]
	);

	return (
		<Page title="Inbox" sub={`${unreadCount} unread · derived from your orders, disputes and payouts`}>
			<div className="filter-bar">
				<input
					className="input"
					style={{ flex: 1 }}
					placeholder="Search your activity…"
					value={controls.searchInput}
					onChange={(e) => controls.setSearchInput(e.target.value)}
				/>
				<select
					className="input"
					style={{ width: 160, flex: "none" }}
					value={status}
					onChange={(e) => controls.setStatus(e.target.value as EventTag | "")}
					aria-label="Filter by type"
				>
					<option value="">Any type</option>
					{TAGS.map((tag) => (
						<option key={tag} value={tag}>
							{tag}
						</option>
					))}
				</select>
			</div>

			<div style={{ display: "flex", alignItems: "center" }}>
				<span className="text-muted" style={{ ...mono, fontSize: 12, letterSpacing: "0.1em" }}>
					{unreadCount} UNREAD
				</span>
				<button className="btn btn-ghost" style={{ marginLeft: "auto" }} onClick={markAllRead}>
					Mark all as read
				</button>
			</div>

			<AsyncPanel
				loading={loading}
				error={error}
				isEmpty={visible.length === 0}
				emptyMessage={
					search || status
						? "Nothing matches these filters"
						: "Nothing yet — activity on your orders lands here"
				}
			>
				<div style={{ borderTop: "2px solid var(--color-divider)" }}>
					{visible.map((event, index) => {
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
								<div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
									<span style={{ fontSize: 15, fontWeight: 700 }}>{event.title}</span>
									<span className="tag tag-neutral" style={{ ...mono, fontSize: 10.5 }}>
										{event.tag}
									</span>
									<span className="text-muted" style={{ marginLeft: "auto", ...mono, fontSize: 12 }}>
										{formatRelative(event.time)}
									</span>
								</div>
								<div className="text-muted" style={{ fontSize: 14, maxWidth: "80ch" }}>
									{event.body}
								</div>
							</div>
						);
					})}
				</div>
			</AsyncPanel>

			<Pagination
				page={page}
				pages={pages}
				limit={limit}
				total={filtered.length}
				onPage={controls.setPage}
				onLimit={controls.setLimit}
				noun="events"
			/>
		</Page>
	);
}
