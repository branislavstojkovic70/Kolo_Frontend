import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
	adminApi,
	type AdminDispute,
	type BuyRequestStatus,
	type DisputeStatus,
	type OrderStatus,
	type WithdrawalStatus,
} from "../api";
import AsyncPanel from "../components/async-panel";
import CountUp from "../components/count-up";
import Page from "../components/page";
import Pagination from "../components/pagination";
import StatusTag from "../components/status-tag";
import { useAsync } from "../hooks/use-async";
import { buyRequestStatusTag } from "../lib/listing-ui";
import { disputeStatusTag, orderStatusTag, withdrawalStatusTag } from "../lib/order-ui";
import { formatDate, humanise, shortRef } from "../utils/format";
import { money, usd } from "../utils/money";
import { feeLabel, usePlatformConfig } from "../hooks/use-platform-config";
import { useListControls } from "../hooks/use-list-controls";

type Tab = "disputes" | "orders" | "payouts" | "alerts";

function StatCell({
	label,
	sub,
	value,
	prefix,
	delay,
}: {
	label: string;
	sub: string;
	value: number;
	prefix?: string;
	delay: number;
}) {
	return (
		<div
			className="card"
			style={{ gap: 2, containerType: "inline-size", animation: `fadeUp .35s ease ${delay}s both` }}
		>
			<div className="text-muted" style={{ fontSize: 14 }}>
				{label}
			</div>
			{/* Four cards in a row leave ~150px of inner width at the narrow end of
			    desktop, and a nowrap "$1,234,567.89" at 28px overruns that. The size
			    is read off the card (`cqi`), not the viewport, so it holds through
			    every column count `.stat-grid` goes through — 4, then 2, then 1. */}
			<div
				style={{
					fontSize: "clamp(19px, 12cqi, 28px)",
					fontWeight: 700,
					lineHeight: 1.1,
					whiteSpace: "nowrap",
				}}
			>
				{prefix}
				<CountUp to={value} dec={prefix ? 2 : 0} />
			</div>
			<div className="text-muted" style={{ fontSize: 13 }}>
				{sub}
			</div>
		</div>
	);
}

function DisputeQueueItem({ dispute, onResolved }: { dispute: AdminDispute; onResolved: () => void }) {
	const [note, setNote] = useState("");
	const [busy, setBusy] = useState(false);
	// Settling is irreversible and the two buttons sit side by side — a misclick
	// picks the opposite winner. First click arms, second confirms.
	const [pendingWinner, setPendingWinner] = useState<"BUYER" | "SELLER" | null>(null);

	const act = async (action: "BUYER" | "SELLER" | "telegram") => {
		setBusy(true);
		try {
			if (action === "telegram") {
				await adminApi.telegramRetry(dispute.id);
				toast.success("Chat created");
			} else {
				await adminApi.resolveDispute(dispute.id, action, note.trim() || undefined);
				toast.success(`Resolved for the ${action.toLowerCase()}`);
			}
			onResolved();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Action failed");
		} finally {
			setPendingWinner(null);
			setBusy(false);
		}
	};

	return (
		<div className="card" style={{ gap: 12 }}>
			<div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
				<StatusTag {...disputeStatusTag(dispute.status)} />
				<span className="text-muted" style={{ fontSize: 14 }}>
					Order #{shortRef(dispute.orderId)} · opened {formatDate(dispute.createdAt)}
				</span>
				<span style={{ marginLeft: "auto", fontSize: 16, fontWeight: 600 }}>
					{money(dispute.order.sellerAmountUsd)} on hold
				</span>
			</div>
			<div style={{ fontSize: 16, fontWeight: 600 }}>{dispute.reason}</div>
			<div className="text-muted" style={{ fontSize: 14 }}>
				{dispute.order.titleSnapshot} · buyer {dispute.order.buyer.username ?? dispute.order.buyer.email} vs
				seller {dispute.order.seller.username ?? dispute.order.seller.email}
			</div>
			{/* Four controls in a row on desktop; a stack of full-width ones on a
			    phone, where "Refund the buyer" next to "Pay the seller" next to
			    "Open the chat" cannot fit on any sensible number of lines. */}
			<div className="action-row" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
				<input
					className="input mobile-full"
					style={{ flex: 1, minWidth: 220 }}
					placeholder="Note for both parties (optional)"
					value={note}
					onChange={(e) => setNote(e.target.value)}
				/>
				{pendingWinner === null ? (
					<>
						<button className="btn btn-primary" disabled={busy} onClick={() => setPendingWinner("BUYER")}>
							Refund the buyer
						</button>
						<button className="btn btn-secondary" disabled={busy} onClick={() => setPendingWinner("SELLER")}>
							Pay the seller
						</button>
					</>
				) : (
					<>
						{/* flexBasis 100%: the sentence takes its own line of the wrapping row. */}
						<span style={{ fontSize: 14, color: "var(--body-soft)", flexBasis: "100%" }}>
							{pendingWinner === "BUYER"
								? `This returns ${money(dispute.order.amountUsd)} to the buyer and closes the request.`
								: `This releases ${money(dispute.order.sellerAmountUsd)} to the seller and closes the request.`}{" "}
							It can't be undone.
						</span>
						<button className="btn btn-primary" disabled={busy} onClick={() => act(pendingWinner)}>
							{pendingWinner === "BUYER" ? "Yes, refund the buyer" : "Yes, pay the seller"}
						</button>
						<button className="btn btn-secondary" disabled={busy} onClick={() => setPendingWinner(null)}>
							Go back
						</button>
					</>
				)}
				{dispute.telegramInviteLink ? (
					<a className="btn btn-ghost" href={dispute.telegramInviteLink} target="_blank" rel="noreferrer">
						Open the chat
					</a>
				) : (
					<button className="btn btn-ghost" disabled={busy} onClick={() => act("telegram")}>
						Retry the chat
					</button>
				)}
			</div>
		</div>
	);
}

const DISPUTE_STATUSES: DisputeStatus[] = ["OPEN", "RESOLVED_BUYER", "RESOLVED_SELLER"];
const ORDER_STATUSES: OrderStatus[] = [
	"PENDING_PAYMENT",
	"PAID",
	"DISPUTED",
	"REFUNDED",
	"EXPIRED",
];
const PAYOUT_STATUSES: WithdrawalStatus[] = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"];
const ALERT_STATUSES: BuyRequestStatus[] = [
	"ACTIVE",
	"MATCHED",
	"FULFILLED",
	"CANCELLED",
	"EXPIRED",
];

/** The admin endpoints filter by status only — no free-text search server-side. */
function StatusFilter<T extends string>({
	options,
	value,
	onChange,
}: {
	options: T[];
	value: T | "";
	onChange: (value: T | "") => void;
}) {
	return (
		<select
			className="input"
			style={{ width: 220, maxWidth: "100%", flex: "none" }}
			value={value}
			onChange={(e) => onChange(e.target.value as T | "")}
			aria-label="Filter by status"
		>
			<option value="">Any status</option>
			{options.map((option) => (
				<option key={option} value={option}>
					{humanise(option.toLowerCase())}
				</option>
			))}
		</select>
	);
}

export default function Admin() {
	const platform = usePlatformConfig();
	const navigate = useNavigate();
	const [tab, setTab] = useState<Tab>("disputes");

	// One set of controls per tab — the three admin endpoints paginate and filter
	// by status independently, and switching tabs must not reset the others.
	const disputeCtl = useListControls<DisputeStatus>();
	const orderCtl = useListControls<OrderStatus>();
	const payoutCtl = useListControls<WithdrawalStatus>();
	const alertCtl = useListControls<BuyRequestStatus>();

	const statsQ = useAsync(() => adminApi.stats(), []);
	const disputesQ = useAsync(
		() =>
			adminApi.disputes({
				status: disputeCtl.status || undefined,
				page: disputeCtl.page,
				limit: disputeCtl.limit,
			}),
		[disputeCtl.status, disputeCtl.page, disputeCtl.limit]
	);
	const ordersQ = useAsync(
		() =>
			adminApi.orders({
				status: orderCtl.status || undefined,
				page: orderCtl.page,
				limit: orderCtl.limit,
			}),
		[orderCtl.status, orderCtl.page, orderCtl.limit]
	);
	const withdrawalsQ = useAsync(
		() =>
			adminApi.withdrawals({
				status: payoutCtl.status || undefined,
				page: payoutCtl.page,
				limit: payoutCtl.limit,
			}),
		[payoutCtl.status, payoutCtl.page, payoutCtl.limit]
	);

	const alertsQ = useAsync(
		() =>
			adminApi.buyRequests({
				status: alertCtl.status || undefined,
				page: alertCtl.page,
				limit: alertCtl.limit,
			}),
		[alertCtl.status, alertCtl.page, alertCtl.limit]
	);

	const stats = statsQ.data;
	const disputes = disputesQ.data?.items ?? [];

	const refreshAll = () => {
		statsQ.reload();
		disputesQ.reload();
		ordersQ.reload();
		withdrawalsQ.reload();
		alertsQ.reload();
	};

	return (
		<Page title="Resolution centre" sub="Requests, orders and transfers across the platform.">
			<div className="stat-grid">
				<StatCell
					label="Total sales"
					sub={`${stats?.orders.total ?? 0} orders · ${stats?.users ?? 0} members`}
					value={usd(stats?.money.grossVolumeUsd ?? 0)}
					prefix="$"
					delay={0}
				/>
				<StatCell
					label="Held for sellers"
					sub="money protected on the platform"
					value={usd(stats?.money.inEscrowUsd ?? 0)}
					prefix="$"
					delay={0.06}
				/>
				<StatCell
					label="Service fees"
					sub={`${feeLabel(platform)} of completed orders`}
					value={usd(stats?.money.platformFeesUsd ?? 0)}
					prefix="$"
					delay={0.12}
				/>
				<StatCell
					label="Open requests"
					sub={`${stats?.disputes.total ?? 0} all time`}
					value={stats?.disputes.open ?? 0}
					delay={0.18}
				/>
			</div>

			{/* The headline for a closing slide: what buyers kept versus retail. */}
			<div className="text-muted" style={{ fontSize: 14, marginTop: -8 }}>
				Buyers have saved <b style={{ color: "var(--ink)" }}>{money(stats?.money.buyerSavedUsd ?? 0)}</b>{" "}
				against {money(stats?.money.buyerRetailUsd ?? 0)} of regular prices.
			</div>

			<div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
				<div className="seg">
					<label className="seg-opt">
						<input type="radio" name="atab" checked={tab === "disputes"} onChange={() => setTab("disputes")} />
						Requests
					</label>
					<label className="seg-opt">
						<input type="radio" name="atab" checked={tab === "orders"} onChange={() => setTab("orders")} />
						Orders
					</label>
					<label className="seg-opt">
						<input type="radio" name="atab" checked={tab === "payouts"} onChange={() => setTab("payouts")} />
						Transfers
					</label>
					<label className="seg-opt">
						<input type="radio" name="atab" checked={tab === "alerts"} onChange={() => setTab("alerts")} />
						Deal Alerts
					</label>
				</div>
				{/* The four-option track already owns its line once it starts
				    scrolling, so Refresh takes the next one whole instead of
				    hanging off the right edge on its own. */}
				<button className="btn btn-ghost mobile-full" style={{ marginLeft: "auto" }} onClick={refreshAll}>
					Refresh
				</button>
			</div>

			{tab === "disputes" && (
				<>
					<div className="filter-bar">
						<StatusFilter
							options={DISPUTE_STATUSES}
							value={disputeCtl.status}
							onChange={disputeCtl.setStatus}
						/>
						<span className="text-muted" style={{ fontSize: 14 }}>
							{disputesQ.data?.total ?? 0} requests
						</span>
					</div>
					<AsyncPanel
						loading={disputesQ.loading}
						error={disputesQ.error}
						onRetry={disputesQ.reload}
						isEmpty={(disputesQ.data?.items ?? []).length === 0}
						emptyMessage="No requests on the platform."
					>
						<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
							{/* OPEN rows get the decision controls; settled ones are read-only. */}
							{disputes
								.filter((d) => d.status === "OPEN")
								.map((dispute) => (
									<DisputeQueueItem key={dispute.id} dispute={dispute} onResolved={refreshAll} />
								))}
							{disputes.some((d) => d.status !== "OPEN") && (
								<>
									<h2 className="section-head" style={{ marginTop: 8 }}>
										Settled
									</h2>
									{disputes
										.filter((d) => d.status !== "OPEN")
										.map((dispute) => (
											<div
												key={dispute.id}
												style={{
													display: "flex",
													alignItems: "center",
													gap: 12,
													padding: "12px 14px",
													borderRadius: "var(--r-card)",
													background: "var(--surface-soft)",
													flexWrap: "wrap",
												}}
											>
												<StatusTag {...disputeStatusTag(dispute.status)} />
												<span style={{ fontSize: 15, fontWeight: 600 }}>{dispute.reason}</span>
												<span className="text-muted" style={{ marginLeft: "auto", fontSize: 14 }}>
													{money(dispute.order.sellerAmountUsd)}
													{dispute.resolvedAt ? ` · ${formatDate(dispute.resolvedAt)}` : ""}
												</span>
											</div>
										))}
								</>
							)}
						</div>
					</AsyncPanel>
					<Pagination
						page={disputeCtl.page}
						pages={disputesQ.data?.pages ?? 1}
						limit={disputeCtl.limit}
						total={disputesQ.data?.total ?? 0}
						onPage={disputeCtl.setPage}
						onLimit={disputeCtl.setLimit}
						noun="requests"
					/>
				</>
			)}

			{tab === "orders" && (
				<>
					<div className="filter-bar">
						<StatusFilter options={ORDER_STATUSES} value={orderCtl.status} onChange={orderCtl.setStatus} />
						<span className="text-muted" style={{ fontSize: 14 }}>
							{ordersQ.data?.total ?? 0} orders
						</span>
					</div>
					<AsyncPanel
						loading={ordersQ.loading}
						error={ordersQ.error}
						onRetry={ordersQ.reload}
						isEmpty={(ordersQ.data?.items ?? []).length === 0}
						emptyMessage="No orders yet."
					>
						<div className="table-wrap">
							<table className="table">
								<thead>
									<tr>
										<th>Item</th>
										<th>Buyer → Seller</th>
										<th>Price</th>
										<th>Fee</th>
										<th>Status</th>
										<th>Placed</th>
									</tr>
								</thead>
								<tbody>
									{(ordersQ.data?.items ?? []).map((order) => (
										<tr key={order.id}>
											<td>
												<div style={{ fontWeight: 600, fontSize: 15 }}>{order.titleSnapshot}</div>
												<div className="text-muted" style={{ fontSize: 13 }}>
													#{shortRef(order.id)}
												</div>
											</td>
											<td className="text-muted" style={{ fontSize: 14 }}>
												{order.buyer.username ?? order.buyer.email} →{" "}
												{order.seller.username ?? order.seller.email}
											</td>
											<td style={{ fontSize: 15, whiteSpace: "nowrap" }}>{money(order.amountUsd)}</td>
											<td className="text-muted" style={{ fontSize: 14, whiteSpace: "nowrap" }}>
												{money(order.feeUsd)}
											</td>
											<td>
												<StatusTag {...orderStatusTag(order.status)} />
											</td>
											<td className="text-muted" style={{ fontSize: 14, whiteSpace: "nowrap" }}>
												{formatDate(order.createdAt)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</AsyncPanel>
					<Pagination
						page={orderCtl.page}
						pages={ordersQ.data?.pages ?? 1}
						limit={orderCtl.limit}
						total={ordersQ.data?.total ?? 0}
						onPage={orderCtl.setPage}
						onLimit={orderCtl.setLimit}
						noun="orders"
					/>
				</>
			)}

			{tab === "payouts" && (
				<>
					<div className="filter-bar">
						<StatusFilter options={PAYOUT_STATUSES} value={payoutCtl.status} onChange={payoutCtl.setStatus} />
						<span className="text-muted" style={{ fontSize: 14 }}>
							{withdrawalsQ.data?.total ?? 0} transfers
						</span>
					</div>
					<AsyncPanel
						loading={withdrawalsQ.loading}
						error={withdrawalsQ.error}
						onRetry={withdrawalsQ.reload}
						isEmpty={(withdrawalsQ.data?.items ?? []).length === 0}
						emptyMessage="No transfers yet."
					>
						<div className="table-wrap">
							<table className="table">
								<thead>
									<tr>
										<th>Member</th>
										<th>Amount</th>
										<th>Destination</th>
										<th>Orders</th>
										<th>Status</th>
										<th>Requested</th>
									</tr>
								</thead>
								<tbody>
									{(withdrawalsQ.data?.items ?? []).map((w) => (
										<tr key={w.id}>
											<td style={{ fontSize: 14 }}>{w.user.username ?? w.user.email}</td>
											<td style={{ fontSize: 15, whiteSpace: "nowrap" }}>{money(w.amountUsd)}</td>
											<td className="text-muted" style={{ fontSize: 14 }}>
												{w.network} · {w.address.slice(0, 10)}…{w.address.slice(-4)}
											</td>
											<td style={{ fontSize: 15 }}>{w.orderCount}</td>
											<td>
												<StatusTag {...withdrawalStatusTag(w.status)} />
												{w.error && (
													<div style={{ fontSize: 13, color: "var(--error)", marginTop: 4 }}>{w.error}</div>
												)}
											</td>
											<td className="text-muted" style={{ fontSize: 14, whiteSpace: "nowrap" }}>
												{formatDate(w.createdAt)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</AsyncPanel>
					<Pagination
						page={payoutCtl.page}
						pages={withdrawalsQ.data?.pages ?? 1}
						limit={payoutCtl.limit}
						total={withdrawalsQ.data?.total ?? 0}
						onPage={payoutCtl.setPage}
						onLimit={payoutCtl.setLimit}
						noun="transfers"
					/>
				</>
			)}

			{tab === "alerts" && (
				<>
					<div className="filter-bar">
						<StatusFilter options={ALERT_STATUSES} value={alertCtl.status} onChange={alertCtl.setStatus} />
						<span className="text-muted" style={{ fontSize: 14 }}>
							{alertsQ.data?.total ?? 0} alerts
						</span>
					</div>
					<AsyncPanel
						loading={alertsQ.loading}
						error={alertsQ.error}
						onRetry={alertsQ.reload}
						isEmpty={(alertsQ.data?.items ?? []).length === 0}
						emptyMessage="Nobody is watching anything yet."
					>
						<div className="table-wrap">
							<table className="table">
								<thead>
									<tr>
										<th>Member</th>
										<th>Wants</th>
										<th>At or under</th>
										<th>Matched order</th>
										<th>Status</th>
										<th>Created</th>
									</tr>
								</thead>
								<tbody>
									{(alertsQ.data?.items ?? []).map((alert) => (
										<tr key={alert.id}>
											<td style={{ fontSize: 14 }}>{alert.buyer.username ?? alert.buyer.email}</td>
											<td>
												<div style={{ fontWeight: 600, fontSize: 15 }}>{alert.product.name}</div>
												<div className="text-muted" style={{ fontSize: 13 }}>
													{alert.product.category}
												</div>
											</td>
											<td style={{ fontSize: 15, whiteSpace: "nowrap" }}>{money(alert.maxPriceUsd)}</td>
											<td className="text-muted" style={{ fontSize: 14, whiteSpace: "nowrap" }}>
												{alert.matchedOrder
													? `#${shortRef(alert.matchedOrder.id)} · ${money(alert.matchedOrder.amountUsd)}`
													: "…"}
											</td>
											<td>
												<StatusTag {...buyRequestStatusTag(alert.status)} />
											</td>
											<td className="text-muted" style={{ fontSize: 14, whiteSpace: "nowrap" }}>
												{formatDate(alert.createdAt)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</AsyncPanel>
					<Pagination
						page={alertCtl.page}
						pages={alertsQ.data?.pages ?? 1}
						limit={alertCtl.limit}
						total={alertsQ.data?.total ?? 0}
						onPage={alertCtl.setPage}
						onLimit={alertCtl.setLimit}
						noun="alerts"
					/>
				</>
			)}

			<div
				className="action-row"
				style={{
					display: "flex",
					alignItems: "center",
					gap: 12,
					borderTop: "1px solid var(--hairline-soft)",
					paddingTop: 18,
					flexWrap: "wrap",
				}}
			>
				<span className="text-muted" style={{ fontSize: 14 }}>
					Refund the buyer → the order is refunded and the buyer can withdraw straight away. Pay the
					seller → the order goes back to its normal clearing schedule.
				</span>
				<button
					className="btn btn-ghost mobile-full"
					style={{ marginLeft: "auto", whiteSpace: "nowrap" }}
					onClick={() => navigate("/ads")}
				>
					Back to browsing
				</button>
			</div>
		</Page>
	);
}
