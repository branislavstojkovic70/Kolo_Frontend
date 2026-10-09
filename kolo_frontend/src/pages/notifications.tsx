import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import AsyncPanel from "../components/async-panel";
import Page from "../components/page";
import Pagination from "../components/pagination";
import { useSharedEvents } from "../hooks/use-events";
import { useListControls } from "../hooks/use-list-controls";
import { getLastSeen } from "../lib/events";
import { formatRelative } from "../utils/format";

/**
 * The activity list has no backend table — events are derived client-side — so
 * its search, filter and pagination all run over the in-memory feed. The `tag`
 * is the closest thing an event has to a status.
 */
const TAGS = ["Order", "Sale", "Payment", "Protected", "Cleared", "Resolution", "Transfer"] as const;

type EventTag = (typeof TAGS)[number];

export default function Notifications() {
	const { events, loading, error, unreadCount, markAllRead, reload } = useSharedEvents();
	const controls = useListControls<EventTag>(20);
	const { search, status, page, limit } = controls;

	// Freshen the shared feed when the list opens.
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
				// carries the item name — is searched too.
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
		<Page
			title="Activity"
			sub={
				unreadCount > 0
					? `${unreadCount} new since you last looked.`
					: "Everything that's happened on your orders, requests and transfers."
			}
		>
			<div className="filter-bar">
				<input
					className="input"
					style={{ flex: 1, maxWidth: 420 }}
					placeholder="Search your activity…"
					value={controls.searchInput}
					onChange={(e) => controls.setSearchInput(e.target.value)}
				/>
				<select
					className="input"
					style={{ width: 180, flex: "0 1 auto", minWidth: 0 }}
					value={status}
					onChange={(e) => controls.setStatus(e.target.value as EventTag | "")}
					aria-label="Filter by type"
				>
					<option value="">Everything</option>
					{TAGS.map((tag) => (
						<option key={tag} value={tag}>
							{tag}
						</option>
					))}
				</select>
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
						? "Nothing matches those filters."
						: "Nothing yet — what happens on your orders shows up here."
				}
			>
				<div style={{ borderTop: "1px solid var(--hairline-soft)" }}>
					{visible.map((event) => {
						const unread = event.time > seen;
						return (
							<Link
								key={event.id}
								to={event.href}
								className="row-click link-plain"
								style={{
									display: "flex",
									flexDirection: "column",
									gap: 4,
									padding: "16px 14px",
									background: unread ? "var(--surface-soft)" : "transparent",
									borderBottom: "1px solid var(--hairline-soft)",
								}}
							>
								<div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
									{unread && (
										<>
											<span
												aria-hidden="true"
												style={{
													width: 7,
													height: 7,
													borderRadius: "var(--r-pill)",
													background: "var(--accent)",
													flex: "none",
												}}
											/>
											<span className="visually-hidden">Unread:</span>
										</>
									)}
									<span style={{ fontSize: 16, fontWeight: 600 }}>{event.title}</span>
									<span className="tag tag-neutral">{event.tag}</span>
									<span className="text-muted" style={{ marginLeft: "auto", fontSize: 14 }}>
										{formatRelative(event.time)}
									</span>
								</div>
								<div className="text-muted" style={{ fontSize: 15, maxWidth: "80ch" }}>
									{event.body}
								</div>
							</Link>
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
				noun="updates"
			/>
		</Page>
	);
}
