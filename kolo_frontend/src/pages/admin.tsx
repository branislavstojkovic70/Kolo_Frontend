import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { adminApi, type AdminDispute } from "../api";
import AsyncPanel from "../components/async-panel";
import CountUp from "../components/count-up";
import Page from "../components/page";
import StatusTag from "../components/status-tag";
import { useAsync } from "../hooks/use-async";
import { disputeStatusTag, orderStatusTag, withdrawalStatusTag } from "../lib/order-ui";
import { formatDate } from "../utils/format";
import { fmtUsd, usd } from "../utils/money";

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

export default function Admin() {
	const navigate = useNavigate();
	const [tab, setTab] = useState<Tab>("disputes");

	const statsQ = useAsync(() => adminApi.stats(), []);
	const disputesQ = useAsync(() => adminApi.disputes({ limit: 50 }), []);
	const ordersQ = useAsync(() => adminApi.orders({ limit: 50 }), []);
	const withdrawalsQ = useAsync(() => adminApi.withdrawals({ limit: 50 }), []);

	const stats = statsQ.data;
	const openDisputes = (disputesQ.data?.items ?? []).filter((d) => d.status === "OPEN");
	const resolvedDisputes = (disputesQ.data?.items ?? []).filter((d) => d.status !== "OPEN");

	const refreshAll = () => {
		statsQ.reload();
		disputesQ.reload();
		ordersQ.reload();
		withdrawalsQ.reload();
	};

	return (
		<Page title="Arbitration" sub="Admin · disputes, orders and payouts">
			<div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
				<StatCell label="GROSS VOLUME" sub={`${stats?.orders.total ?? 0} orders · ${stats?.users ?? 0} users`} value={usd(stats?.money.grossVolumeUsd ?? 0)} suffix="USDT" delay={0} />
				<StatCell label="IN ESCROW" sub="seller money on the platform" value={usd(stats?.money.inEscrowUsd ?? 0)} suffix="USDT" delay={0.06} />
				<StatCell label="FEES EARNED" sub="4% of confirmed payments" value={usd(stats?.money.platformFeesUsd ?? 0)} suffix="USDT" delay={0.12} />
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
				<AsyncPanel
					loading={disputesQ.loading}
					error={disputesQ.error}
					isEmpty={(disputesQ.data?.items ?? []).length === 0}
					emptyMessage="No disputes on the platform"
				>
					<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
						{openDisputes.length === 0 && (
							<div className="text-muted" style={{ ...mono, fontSize: 12, letterSpacing: "0.1em" }}>
								QUEUE EMPTY · NOTHING AWAITS ARBITRATION
							</div>
						)}
						{openDisputes.map((dispute) => (
							<DisputeQueueItem key={dispute.id} dispute={dispute} onResolved={refreshAll} />
						))}
						{resolvedDisputes.length > 0 && (
							<>
								<div className="text-muted" style={{ ...mono, fontSize: 12, letterSpacing: "0.1em", marginTop: 8 }}>
									RESOLVED
								</div>
								{resolvedDisputes.map((dispute) => (
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
			)}

			{tab === "orders" && (
				<AsyncPanel
					loading={ordersQ.loading}
					error={ordersQ.error}
					isEmpty={(ordersQ.data?.items ?? []).length === 0}
					emptyMessage="No orders yet"
				>
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
				</AsyncPanel>
			)}

			{tab === "payouts" && (
				<AsyncPanel
					loading={withdrawalsQ.loading}
					error={withdrawalsQ.error}
					isEmpty={(withdrawalsQ.data?.items ?? []).length === 0}
					emptyMessage="No payouts yet"
				>
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
				</AsyncPanel>
			)}

			<div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "2px solid var(--color-divider)", paddingTop: 14 }}>
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
