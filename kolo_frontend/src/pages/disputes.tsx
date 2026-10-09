import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { adminApi, disputesApi, type Dispute, type DisputeStatus, type Page as Paged } from "../api";
import AsyncPanel from "../components/async-panel";
import { MessageIcon } from "../components/icons";
import Page from "../components/page";
import Pagination from "../components/pagination";
import StatusTag from "../components/status-tag";
import { useAsync } from "../hooks/use-async";
import { useAuth } from "../hooks/use-auth";
import { useListControls } from "../hooks/use-list-controls";
import { disputeStatusTag } from "../lib/order-ui";
import { formatDate, formatRelative, shortRef } from "../utils/format";
import { money } from "../utils/money";

const STATUS_OPTIONS: { value: DisputeStatus; label: string }[] = [
	{ value: "OPEN", label: "In review" },
	{ value: "RESOLVED_BUYER", label: "Resolved for buyer" },
	{ value: "RESOLVED_SELLER", label: "Resolved for seller" },
];

/**
 * The queue renders the same five fields whether they came from /disputes/mine
 * or, for an admin, from /admin/disputes — and those two payloads differ
 * elsewhere, so the list is typed down to what it actually reads.
 */
interface DisputeRow {
	id: string;
	status: DisputeStatus;
	createdAt: string;
	reason: string;
	order: { titleSnapshot: string; amountUsd: string };
}

const ROLES = {
	BUYER: { label: "Buyer", color: "var(--muted)" },
	SELLER: { label: "Seller", color: "var(--caution)" },
	ADMIN: { label: "Kolo support", color: "var(--accent)" },
} as const;

function MessagePlate({
	role,
	name,
	time,
	children,
}: {
	role: keyof typeof ROLES;
	name: string;
	time?: string;
	children: React.ReactNode;
}) {
	return (
		<div
			style={{
				background: role === "ADMIN" ? "var(--accent-tint)" : "var(--surface-soft)",
				borderRadius: "var(--r-card)",
				// Three nested paddings sit between a phone edge and this text —
				// the card, the thread's gutter, then the plate. The inner two give
				// width back as the viewport narrows.
				padding: "14px clamp(12px, 3.5vw, 16px)",
			}}
		>
			<div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", lineHeight: 1.4 }}>
				<span
					style={{
						whiteSpace: "nowrap",
						flex: "none",
						fontSize: 13,
						fontWeight: 600,
						color: ROLES[role].color,
					}}
				>
					{ROLES[role].label}
				</span>
				<span style={{ whiteSpace: "nowrap", flex: "none", fontSize: 15, fontWeight: 600 }}>{name}</span>
				{time && (
					<span className="text-muted" style={{ whiteSpace: "nowrap", marginLeft: "auto", fontSize: 13 }}>
						{time}
					</span>
				)}
			</div>
			<div style={{ fontSize: 15, lineHeight: 1.5, marginTop: 6, color: "var(--body-soft)" }}>
				{children}
			</div>
		</div>
	);
}

export default function Disputes() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { isAdmin } = useAuth();
	const [note, setNote] = useState("");
	const [busy, setBusy] = useState(false);

	const controls = useListControls<DisputeStatus>(10);
	const { search, status, page, limit } = controls;

	// An admin settles requests he is never a party to, so /disputes/mine would
	// always come back empty for him — the whole list lives behind /admin/disputes.
	const list = useAsync<Paged<DisputeRow>>(
		() => {
			const query = {
				search: search || undefined,
				status: status || undefined,
				page,
				limit,
			};
			return isAdmin ? adminApi.disputes(query) : disputesApi.mine(query);
		},
		[isAdmin, search, status, page, limit]
	);
	const entries = useMemo(() => list.data?.items ?? [], [list.data]);
	// Falling back to the first row keeps the detail pane filled as filters change.
	const selectedId = id ?? entries[0]?.id;
	const detail = useAsync<Dispute | undefined>(
		() => (selectedId ? disputesApi.get(selectedId) : Promise.resolve(undefined)),
		[selectedId]
	);

	const dispute = detail.data;

	const resolve = async (winner: "BUYER" | "SELLER") => {
		if (!dispute) return;
		setBusy(true);
		try {
			await adminApi.resolveDispute(dispute.id, winner, note.trim() || undefined);
			toast.success(`Resolved for the ${winner.toLowerCase()}`);
			setNote("");
			detail.reload();
			list.reload();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not resolve this request");
		} finally {
			setBusy(false);
		}
	};

	return (
		<Page
			title="Resolution"
			sub="Orders you've asked for help with. Your payment stays put until each one is settled."
		>
			<div className="filter-bar">
				<input
					className="input"
					style={{ flex: 1, maxWidth: 420 }}
					placeholder="Search by item…"
					value={controls.searchInput}
					onChange={(e) => controls.setSearchInput(e.target.value)}
				/>
				<select
					className="input"
					style={{ width: 200, maxWidth: "100%", flex: "none" }}
					value={status}
					onChange={(e) => controls.setStatus(e.target.value as DisputeStatus | "")}
					aria-label="Filter by status"
				>
					<option value="">Any status</option>
					{STATUS_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</div>

			<AsyncPanel
				loading={list.loading}
				error={list.error}
				isEmpty={entries.length === 0}
				emptyMessage={
					search || status ? "Nothing matches those filters." : "No open requests — that's a good sign."
				}
			>
				<div className="layout-master">
					{/* minWidth 0: the master track has a 240px floor, and a grid item
					    defaults to min-content — without this an unbreakable string in
					    a plate widens the track instead of wrapping inside it. */}
					<div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
						{entries.map((entry) => {
							const chip = disputeStatusTag(entry.status);
							const selected = entry.id === selectedId;
							return (
								<div
									key={entry.id}
									className="row-click"
									onClick={() => navigate(`/disputes/${entry.id}`)}
									style={{
										padding: "14px 16px",
										borderRadius: "var(--r-card)",
										border: `1px solid ${
											selected ? "var(--border-strong)" : "var(--hairline-soft)"
										}`,
										background: selected ? "var(--surface-soft)" : "var(--surface-card)",
										display: "flex",
										flexDirection: "column",
										gap: 8,
									}}
								>
									{/* "Resolved for seller" is a nowrap pill and the master column
									    is only 240px at its floor — the timestamp drops to its own
									    line rather than pushing the row wider than the plate. */}
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: 8,
											flexWrap: "wrap",
										}}
									>
										<StatusTag label={chip.label} color={chip.color} />
										<span className="text-muted" style={{ marginLeft: "auto", fontSize: 13 }}>
											{formatRelative(entry.createdAt)}
										</span>
									</div>
									<div
										style={{
											fontSize: 15,
											fontWeight: 600,
											lineHeight: 1.4,
											display: "-webkit-box",
											WebkitLineClamp: 2,
											WebkitBoxOrient: "vertical",
											overflow: "hidden",
										}}
									>
										{entry.reason}
									</div>
									<div className="text-muted" style={{ fontSize: 14 }}>
										{entry.order.titleSnapshot} · {money(entry.order.amountUsd)}
									</div>
								</div>
							);
						})}
						<Pagination
							page={page}
							pages={list.data?.pages ?? 1}
							limit={limit}
							total={list.data?.total ?? 0}
							onPage={controls.setPage}
							onLimit={controls.setLimit}
							noun="requests"
						/>
						<div className="card" style={{ gap: 8 }}>
							<h2 className="section-head">How this works</h2>
							<div className="text-muted" style={{ fontSize: 14, lineHeight: 1.5 }}>
								Asking for help puts the payment on hold, even if the clearing period has already
								passed. We open a private chat with you, the seller and our team, look at what each
								side shows us, and decide. Whoever is right gets the money.
							</div>
						</div>
					</div>

					<div className="card" style={{ padding: 0, gap: 0, overflow: "hidden" }}>
						{dispute ? (
							<>
								<div
									style={{
										padding: "20px clamp(14px, 4vw, 22px)",
										borderBottom: "1px solid var(--hairline)",
									}}
								>
									<div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
										<StatusTag {...disputeStatusTag(dispute.status)} />
										<span
											className="text-muted row-click"
											onClick={() => navigate(`/orders/${dispute.orderId}`)}
											style={{ whiteSpace: "nowrap", fontSize: 14, textDecoration: "underline" }}
										>
											Order #{shortRef(dispute.orderId)}
										</span>
										<span className="text-muted" style={{ whiteSpace: "nowrap", fontSize: 14 }}>
											Opened {formatDate(dispute.createdAt)} by the buyer
										</span>
									</div>
									<h2 style={{ margin: "12px 0 0", fontSize: 20, lineHeight: 1.35 }}>{dispute.reason}</h2>
								</div>

								<div
									style={{
										// Stacked, this pane is the page: a flat 420px window would
										// be taller than a phone in landscape and push the footer
										// CTA off-screen, so the thread never takes more than ~60%
										// of the viewport it is actually rendered in.
										maxHeight: "min(420px, 60vh)",
										overflowY: "auto",
										padding: "18px clamp(14px, 4vw, 20px)",
										display: "flex",
										flexDirection: "column",
										gap: 12,
									}}
								>
									<MessagePlate role="BUYER" name="Problem reported" time={formatDate(dispute.createdAt)}>
										{dispute.reason}
										<div style={{ marginTop: 10, fontSize: 14, color: "var(--muted)" }}>
											{money(dispute.order.sellerAmountUsd)} is on hold while this is open.
										</div>
									</MessagePlate>

									<MessagePlate role="ADMIN" name="Kolo support">
										{dispute.telegramInviteLink
											? "We've opened a private chat for this order. Share anything that helps — screenshots, messages, dates — and we'll take it from there."
											: "Your request is logged and the payment is on hold. We're setting up the chat now — check back in a moment."}
									</MessagePlate>

									{dispute.status !== "OPEN" && (
										<div
											style={{
												background: "var(--accent-tint)",
												borderRadius: "var(--r-card)",
												padding: "14px clamp(12px, 3.5vw, 16px)",
											}}
										>
											<div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-ink)" }}>
												Final decision
												{dispute.resolvedAt ? ` · ${formatDate(dispute.resolvedAt)}` : ""}
											</div>
											<div style={{ fontSize: 15, lineHeight: 1.5, marginTop: 6 }}>
												{dispute.resolutionNote ??
													(dispute.status === "RESOLVED_BUYER"
														? `Decided for the buyer · ${money(dispute.order.sellerAmountUsd)} refunded and ready to withdraw straight away.`
														: "Decided for the seller · the order goes back to its normal clearing schedule.")}
											</div>
										</div>
									)}

									{isAdmin && dispute.status === "OPEN" && (
										<div className="card" style={{ gap: 12 }}>
											<h2 className="section-head">Decide this request</h2>
											<input
												className="input"
												value={note}
												onChange={(e) => setNote(e.target.value)}
												placeholder="Note for both parties (optional)"
											/>
											<div className="action-row" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
												<button className="btn btn-primary" disabled={busy} onClick={() => resolve("BUYER")}>
													Refund the buyer
												</button>
												<button className="btn btn-secondary" disabled={busy} onClick={() => resolve("SELLER")}>
													Pay the seller
												</button>
											</div>
										</div>
									)}
								</div>

								<div
									className="action-row"
									style={{
										display: "flex",
										gap: 12,
										padding: "16px clamp(14px, 4vw, 20px)",
										borderTop: "1px solid var(--hairline)",
										alignItems: "center",
										flexWrap: "wrap",
									}}
								>
									{dispute.telegramInviteLink ? (
										<>
											{/* Not nowrap: the label is a sentence and would be wider
											    than a 360px screen on one line. */}
											<a
												className="btn btn-primary"
												href={dispute.telegramInviteLink}
												target="_blank"
												rel="noreferrer"
											>
												<MessageIcon size={16} />
												Chat with support and the seller
											</a>
											<span className="text-muted" style={{ fontSize: 14 }}>
												Everything about this order is discussed there.
											</span>
										</>
									) : (
										<span className="text-muted" style={{ fontSize: 14 }}>
											The chat isn't ready yet — your payment is on hold regardless, and we'll follow
											up here.
										</span>
									)}
								</div>
							</>
						) : (
							<div style={{ padding: "clamp(24px, 8vw, 40px)" }}>
								<AsyncPanel
									loading={detail.loading}
									error={detail.error}
									isEmpty
									emptyMessage="Pick a request to see the details."
								>
									<span />
								</AsyncPanel>
							</div>
						)}
					</div>
				</div>
			</AsyncPanel>
		</Page>
	);
}
