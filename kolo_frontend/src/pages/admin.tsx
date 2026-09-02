import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { adminApi, type AdminDispute, type DisputeStatus, type OrderStatus, type WithdrawalStatus } from "../api";
import AsyncPanel from "../components/async-panel";
import CountUp from "../components/count-up";
import Page from "../components/page";
import Pagination from "../components/pagination";
import StatusTag from "../components/status-tag";
import { useAsync } from "../hooks/use-async";
import { disputeStatusTag, orderStatusTag, withdrawalStatusTag } from "../lib/order-ui";
import { formatDate } from "../utils/format";
import { fmtUsd, usd } from "../utils/money";
import { feeLabel, usePlatformConfig } from "../hooks/use-platform-config";
import { useListControls } from "../hooks/use-list-controls";

type Tab = "disputes" | "orders" | "payouts";

const mono: React.CSSProperties = { fontFamily: "var(--font-mono)" };
const monoLabel: React.CSSProperties = { ...mono, fontSize: 10.5, letterSpacing: "0.12em" };

function StatCell({
	label,
	sub,
	value,
	suffix,
	delay,
}: {
	label: string;
	sub: string;
	value: number;
	suffix?: string;
	delay: number;
}) {
	return (
		<div style={{ borderTop: "2px solid var(--color-divider)", paddingTop: 10, animation: `fadeUp .45s ease ${delay}s both` }}>
			<div className="text-muted" style={monoLabel}>
				{label}
			</div>
			<div style={{ ...mono, fontSize: 30, fontWeight: 600, marginTop: 6, lineHeight: 1, whiteSpace: "nowrap" }}>
				<CountUp to={value} dec={suffix ? 2 : 0} />
				{suffix && (
					<span className="text-muted" style={{ fontSize: 13, fontWeight: 400 }}>
						{" "}
						{suffix}
					</span>
				)}
			</div>
			<div className="text-muted" style={{ fontSize: 12 }}>
				{sub}
			</div>
		</div>
	);
}

function DisputeQueueItem({ dispute, onResolved }: { dispute: AdminDispute; onResolved: () => void }) {
	const [note, setNote] = useState("");
	const [busy, setBusy] = useState(false);

	const act = async (action: "BUYER" | "SELLER" | "telegram") => {
		setBusy(true);
		try {
			if (action === "telegram") {
				await adminApi.telegramRetry(dispute.id);
				toast.success("Telegram group created");
			} else {
				await adminApi.resolveDispute(dispute.id, action, note.trim() || undefined);
				toast.success(`Resolved for the ${action.toLowerCase()}`);
			}
			onResolved();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Action failed");
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="card elev-sm" style={{ padding: 16, gap: 10 }}>
			<div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
				<StatusTag {...disputeStatusTag(dispute.status)} />
				<span className="text-muted" style={{ ...mono, fontSize: 11, border: "1px solid var(--color-divider)", padding: "2px 8px" }}>
					{dispute.orderId}
				</span>
				<span className="text-muted" style={{ ...mono, fontSize: 10.5, letterSpacing: "0.08em" }}>
					OPENED {formatDate(dispute.createdAt).toUpperCase()}
				</span>
				<span style={{ marginLeft: "auto", ...mono, fontSize: 14, fontWeight: 600 }}>
					{fmtUsd(dispute.order.sellerAmountUsd)} USDT frozen
				</span>
			</div>
			<div style={{ fontSize: 15, fontWeight: 600 }}>{dispute.reason}</div>
			<div className="text-muted" style={{ fontSize: 13.5 }}>
				{dispute.order.titleSnapshot} · buyer {dispute.order.buyer.username ?? dispute.order.buyer.email} vs
				seller {dispute.order.seller.username ?? dispute.order.seller.email}
			</div>
			<div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
				<input
					className="input"
					style={{ flex: 1, minWidth: 220 }}
					placeholder="Resolution note (optional)"
					value={note}
					onChange={(e) => setNote(e.target.value)}
				/>
				<button className="btn btn-primary" disabled={busy} onClick={() => act("BUYER")}>
					Buyer wins · refund
				</button>
				<button className="btn btn-secondary" disabled={busy} onClick={() => act("SELLER")}>
					Seller wins · release
				</button>
				{dispute.telegramInviteLink ? (
					<a className="btn btn-ghost" href={dispute.telegramInviteLink} target="_blank" rel="noreferrer">
						Open Telegram →
					</a>
				) : (
					<button className="btn btn-ghost" disabled={busy} onClick={() => act("telegram")}>
						Retry Telegram group
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
			style={{ width: 200, flex: "none", padding: "5px 8px", fontSize: 13 }}
			value={value}
			onChange={(e) => onChange(e.target.value as T | "")}
			aria-label="Filter by status"
		>
			<option value="">Any status</option>
			{options.map((option) => (
				<option key={option} value={option}>
					{option.replace(/_/g, " ").toLowerCase()}
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

	const stats = statsQ.data;
	const disputes = disputesQ.data?.items ?? [];

	const refreshAll = () => {
		statsQ.reload();
		disputesQ.reload();
		ordersQ.reload();
		withdrawalsQ.reload();
	};

	return (
		<Page title="Arbitration" sub="Admin · disputes, orders and payouts">
			<div className="stat-grid">
				<StatCell label="GROSS VOLUME" sub={`${stats?.orders.total ?? 0} orders · ${stats?.users ?? 0} users`} value={usd(stats?.money.grossVolumeUsd ?? 0)} suffix="USDT" delay={0} />
				<StatCell label="IN ESCROW" sub="seller money on the platform" value={usd(stats?.money.inEscrowUsd ?? 0)} suffix="USDT" delay={0.06} />
				<StatCell label="FEES EARNED" sub={`${feeLabel(platform)} of confirmed payments`} value={usd(stats?.money.platformFeesUsd ?? 0)} suffix="USDT" delay={0.12} />
				<StatCell label="OPEN DISPUTES" sub={`${stats?.disputes.total ?? 0} lifetime`} value={stats?.disputes.open ?? 0} delay={0.18} />
			</div>

			<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
				<div className="seg">
					<label className="seg-opt">
						<input type="radio" name="atab" checked={tab === "disputes"} onChange={() => setTab("disputes")} />
						Disputes
					</label>
					<label className="seg-opt">
						<input type="radio" name="atab" checked={tab === "orders"} onChange={() => setTab("orders")} />
						Orders
					</label>
					<label className="seg-opt">
						<input type="radio" name="atab" checked={tab === "payouts"} onChange={() => setTab("payouts")} />
						Payouts
					</label>
				</div>
				<button className="btn btn-ghost" style={{ marginLeft: "auto" }} onClick={refreshAll}>
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
					<span className="text-muted" style={{ ...mono, fontSize: 12, letterSpacing: "0.1em" }}>
						{disputesQ.data?.total ?? 0} DISPUTES
					</span>
				</div>
				<AsyncPanel
					loading={disputesQ.loading}
					error={disputesQ.error}
					isEmpty={(disputesQ.data?.items ?? []).length === 0}
					emptyMessage="No disputes on the platform"
				>
					<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
						{/* OPEN rows get the resolve controls; resolved ones are read-only. */}
						{disputes
							.filter((d) => d.status === "OPEN")
							.map((dispute) => (
								<DisputeQueueItem key={dispute.id} dispute={dispute} onResolved={refreshAll} />
							))}
						{disputes.some((d) => d.status !== "OPEN") && (
							<>
								<div className="text-muted" style={{ ...mono, fontSize: 12, letterSpacing: "0.1em", marginTop: 8 }}>
									RESOLVED
								</div>
								{disputes
									.filter((d) => d.status !== "OPEN")
									.map((dispute) => (
									<div
										key={dispute.id}
										style={{
											display: "flex",
											alignItems: "center",
											gap: 12,
											padding: "10px 12px",
											borderLeft: "3px solid var(--ok)",
											background: "var(--color-neutral-100)",
											flexWrap: "wrap",
										}}
									>
										<StatusTag {...disputeStatusTag(dispute.status)} fontSize={10} />
										<span style={{ fontSize: 14, fontWeight: 600 }}>{dispute.reason}</span>
										<span className="text-muted" style={{ marginLeft: "auto", ...mono, fontSize: 12 }}>
											{fmtUsd(dispute.order.sellerAmountUsd)} USDT ·{" "}
											{dispute.resolvedAt ? formatDate(dispute.resolvedAt) : ""}
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
					noun="disputes"
				/>
				</>
			)}

			{tab === "orders" && (
				<>
				<div className="filter-bar">
					<StatusFilter
						options={ORDER_STATUSES}
						value={orderCtl.status}
						onChange={orderCtl.setStatus}
					/>
					<span className="text-muted" style={{ ...mono, fontSize: 12, letterSpacing: "0.1em" }}>
						{ordersQ.data?.total ?? 0} ORDERS
					</span>
				</div>
				<AsyncPanel
					loading={ordersQ.loading}
					error={ordersQ.error}
					isEmpty={(ordersQ.data?.items ?? []).length === 0}
					emptyMessage="No orders yet"
				>
					<div className="table-wrap">
					<table className="table">
						<thead>
							<tr>
								<th>Service</th>
								<th>Buyer → Seller</th>
								<th>Amount</th>
								<th>Fee</th>
								<th>Status</th>
								<th>Created</th>
							</tr>
						</thead>
						<tbody>
							{(ordersQ.data?.items ?? []).map((order) => (
								<tr key={order.id}>
									<td>
										<div style={{ fontWeight: 600, fontSize: 14 }}>{order.titleSnapshot}</div>
										<div className="text-muted" style={{ ...mono, fontSize: 12 }}>
											{order.id}
										</div>
									</td>
									<td className="text-muted" style={{ fontSize: 13.5 }}>
										{order.buyer.username ?? order.buyer.email} → {order.seller.username ?? order.seller.email}
									</td>
									<td style={{ ...mono, fontSize: 14 }}>{fmtUsd(order.amountUsd)}</td>
									<td className="text-muted" style={{ ...mono, fontSize: 13 }}>
										{fmtUsd(order.feeUsd)}
									</td>
									<td>
										<StatusTag {...orderStatusTag(order.status)} />
									</td>
									<td className="text-muted" style={{ ...mono, fontSize: 13 }}>
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
					<StatusFilter
						options={PAYOUT_STATUSES}
						value={payoutCtl.status}
						onChange={payoutCtl.setStatus}
					/>
					<span className="text-muted" style={{ ...mono, fontSize: 12, letterSpacing: "0.1em" }}>
						{withdrawalsQ.data?.total ?? 0} PAYOUTS
					</span>
				</div>
				<AsyncPanel
					loading={withdrawalsQ.loading}
					error={withdrawalsQ.error}
					isEmpty={(withdrawalsQ.data?.items ?? []).length === 0}
					emptyMessage="No payouts yet"
				>
					<div className="table-wrap">
					<table className="table">
						<thead>
							<tr>
								<th>User</th>
								<th>Amount</th>
								<th>Destination</th>
								<th>Orders</th>
								<th>Status</th>
								<th>Created</th>
							</tr>
						</thead>
						<tbody>
							{(withdrawalsQ.data?.items ?? []).map((w) => (
								<tr key={w.id}>
									<td style={{ fontSize: 13.5 }}>{w.user.username ?? w.user.email}</td>
									<td style={{ ...mono, fontSize: 14 }}>
										{fmtUsd(w.amountUsd)} {w.currency}
									</td>
									<td className="text-muted" style={{ ...mono, fontSize: 12 }}>
										{w.network} · {w.address.slice(0, 10)}…{w.address.slice(-4)}
									</td>
									<td style={{ ...mono, fontSize: 13.5 }}>{w.orderCount}</td>
									<td>
										<StatusTag {...withdrawalStatusTag(w.status)} />
										{w.error && (
											<div className="text-muted" style={{ fontSize: 12, color: "var(--bad)" }}>
												{w.error}
											</div>
										)}
									</td>
									<td className="text-muted" style={{ ...mono, fontSize: 13 }}>
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
					noun="payouts"
				/>
				</>
			)}

			<div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "2px solid var(--color-divider)", paddingTop: 14, flexWrap: "wrap" }}>
				<span className="text-muted" style={{ fontSize: 12 }}>
					Buyer wins → order refunded, buyer withdraws from escrow immediately. Seller wins → order back
					to paid, normal vesting continues.
				</span>
				<button className="btn btn-ghost" style={{ marginLeft: "auto", whiteSpace: "nowrap" }} onClick={() => navigate("/ads")}>
					Back to marketplace →
				</button>
			</div>
		</Page>
	);
}
