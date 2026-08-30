import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { disputesApi, ordersApi, type Dispute, type Order } from "../api";
import AsyncPanel from "../components/async-panel";
import BlockAvatar from "../components/block-avatar";
import { ArrowLeftIcon, CopyIcon, ExternalLinkIcon, LockIcon } from "../components/icons";
import Page from "../components/page";
import QrPlate from "../components/qr-plate";
import StatusTag from "../components/status-tag";
import { useAsync } from "../hooks/use-async";
import { useAuth } from "../hooks/use-auth";
import { useNow } from "../hooks/use-now";
import { formatDate, formatDateTime, shortRef } from "../utils/format";
import { fmtUsd } from "../utils/money";
import { orderStatusTag } from "../lib/order-ui";

const mono: React.CSSProperties = { fontFamily: "var(--font-mono)" };
const muted15 = "color-mix(in srgb, var(--color-text) 15%, transparent)";
const INVOICE_LIFETIME_MS = 60 * 60 * 1000; // backend invoice lifetime: 60 min
const DISPUTE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

type StepState = "done" | "current" | "ready" | "bad" | "future";

interface FlowStep {
	t: string;
	d: string;
	state: StepState;
}

const stepColor: Record<StepState, string> = {
	done: "var(--color-accent)",
	current: "var(--warn)",
	ready: "var(--ok)",
	bad: "var(--bad)",
	future: muted15,
};

function buildFlow(order: Order, countdown: string): FlowStep[] {
	const vested = !!order.vestedAt && new Date(order.vestedAt).getTime() <= Date.now();
	switch (order.status) {
		case "PENDING_PAYMENT":
			return [
				{ t: "Payment", d: `awaiting · ${countdown}`, state: "current" },
				{ t: "Escrow", d: "locks on confirmation", state: "future" },
				{ t: "Delivery", d: "unlocks after escrow", state: "future" },
				{ t: "Vesting", d: "30 days from payment", state: "future" },
				{ t: "Released", d: "withdrawable by seller", state: "future" },
			];
		case "EXPIRED":
			return [
				{ t: "Payment", d: "invoice expired", state: "bad" },
				{ t: "Escrow", d: "—", state: "future" },
				{ t: "Delivery", d: "—", state: "future" },
				{ t: "Vesting", d: "—", state: "future" },
				{ t: "Released", d: "—", state: "future" },
			];
		case "DISPUTED":
			return [
				{ t: "Payment", d: order.paidAt ? `confirmed ${formatDate(order.paidAt)}` : "confirmed", state: "done" },
				{ t: "Escrow", d: `${fmtUsd(order.sellerAmountUsd)} USDT locked`, state: "done" },
				{ t: "Delivery", d: "details unlocked for buyer", state: "done" },
				{ t: "Vesting", d: "frozen by open dispute", state: "bad" },
				{ t: "Released", d: "after arbitration", state: "future" },
			];
		case "REFUNDED":
			return [
				{ t: "Payment", d: order.paidAt ? `confirmed ${formatDate(order.paidAt)}` : "confirmed", state: "done" },
				{ t: "Escrow", d: `${fmtUsd(order.sellerAmountUsd)} USDT held`, state: "done" },
				{ t: "Delivery", d: "disputed by buyer", state: "done" },
				{ t: "Vesting", d: "waived · buyer won", state: "done" },
				{ t: "Released", d: "refund withdrawable by buyer", state: "ready" },
			];
		case "PAID":
			return [
				{ t: "Payment", d: order.paidAt ? `confirmed ${formatDate(order.paidAt)}` : "confirmed", state: "done" },
				{ t: "Escrow", d: `${fmtUsd(order.sellerAmountUsd)} USDT locked`, state: "done" },
				{ t: "Delivery", d: "details unlocked for buyer", state: "done" },
				vested
					? { t: "Vesting", d: `completed ${order.vestedAt ? formatDate(order.vestedAt) : ""}`, state: "done" }
					: { t: "Vesting", d: order.vestedAt ? `until ${formatDate(order.vestedAt)}` : "30 days", state: "current" },
				order.withdrawalId
					? { t: "Released", d: "paid out to seller", state: "done" }
					: vested
						? { t: "Released", d: "withdrawable now", state: "ready" }
						: { t: "Released", d: "after vesting", state: "future" },
			];
	}
}

function useCountdown(expiresAt: number | undefined, active: boolean): string {
	const [now, setNow] = useState(Date.now);

	useEffect(() => {
		if (!active) return;
		const timer = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timer);
	}, [active]);

	if (!expiresAt) return "";
	const left = expiresAt - now;
	if (left <= 0) return "may have expired";
	const minutes = Math.floor(left / 60000);
	const seconds = Math.floor((left % 60000) / 1000);
	return `expires in ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
	return (
		<div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
			<span className="text-muted">{label}</span>
			<span style={{ ...mono, color }}>{value}</span>
		</div>
	);
}

export default function OrderDetails() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { user } = useAuth();
	const [disputeOpen, setDisputeOpen] = useState(false);
	const [disputeReason, setDisputeReason] = useState("");
	const [busy, setBusy] = useState(false);

	const { data: order, loading, error, reload } = useAsync(
		() => (id ? ordersApi.get(id) : Promise.reject(new Error("Missing order id"))),
		[id]
	);
	const { data: myDisputes, reload: reloadDisputes } = useAsync(() => disputesApi.mine(), []);
	const dispute: Dispute | undefined = useMemo(
		() => (myDisputes ?? []).find((d) => d.orderId === id),
		[myDisputes, id]
	);

	const pending = order?.status === "PENDING_PAYMENT";
	const now = useNow(pending ? 1000 : undefined);

	// The OxaPay webhook flips the order — poll while the invoice is open.
	useEffect(() => {
		if (!pending) return;
		const timer = setInterval(reload, 5000);
		return () => clearInterval(timer);
	}, [pending, reload]);

	const countdown = useCountdown(
		order ? new Date(order.createdAt).getTime() + INVOICE_LIFETIME_MS : undefined,
		pending
	);

	if (!order) {
		return (
			<Page title="Order" sub="Payment, escrow flow and activity">
				<AsyncPanel loading={loading} error={error} isEmpty emptyMessage="Order not found">
					<span />
				</AsyncPanel>
			</Page>
		);
	}

	const isBuyer = user?.id === order.buyerId;
	const chip = orderStatusTag(order.status);
	const flow = buildFlow(order, countdown);
	const canDispute =
		isBuyer &&
		order.status === "PAID" &&
		!dispute &&
		!!order.paidAt &&
		now - new Date(order.paidAt).getTime() < DISPUTE_WINDOW_MS;

	const copyPaymentUrl = () => {
		if (!order.paymentUrl) return;
		void navigator.clipboard.writeText(order.paymentUrl);
		toast.success("Invoice link copied");
	};

	const submitDispute = async () => {
		if (disputeReason.trim().length < 5) return toast.error("Describe the problem first");
		setBusy(true);
		try {
			const created = await disputesApi.open(order.id, disputeReason.trim());
			toast.success("Dispute opened — an admin will arbitrate");
			reloadDisputes();
			navigate(`/disputes/${created.dispute.id}`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not open the dispute");
			setBusy(false);
		}
	};

	const activity: Array<{ time: string; text: string; color?: string }> = [
		{ time: order.createdAt, text: `Order created from listing ${order.listingId}` },
	];
	if (order.oxapayTrackId) {
		activity.push({ time: order.createdAt, text: `OxaPay invoice #${order.oxapayTrackId} issued` });
	}
	if (order.paidAt) {
		activity.push({
			time: order.paidAt,
			text: `Payment confirmed · ${fmtUsd(order.sellerAmountUsd)} USDT locked in escrow`,
		});
	}
	if (dispute) {
		activity.push({ time: dispute.createdAt, text: `Dispute opened · ${dispute.reason}`, color: "var(--bad)" });
		if (dispute.resolvedAt) {
			activity.push({
				time: dispute.resolvedAt,
				text: `Dispute resolved · ${dispute.status === "RESOLVED_BUYER" ? "buyer" : "seller"} won`,
			});
		}
	}
	if (order.status === "PAID" && order.vestedAt && new Date(order.vestedAt).getTime() <= now) {
		activity.push({ time: order.vestedAt, text: "Vesting complete · funds withdrawable", color: "var(--ok)" });
	}

	return (
		<Page title={`Order ${shortRef(order.id)}`} sub={chip.label + " · escrow protected"}>
			<div>
				<button
					className="btn btn-ghost"
					onClick={() => navigate("/orders")}
					style={{ marginLeft: -6, whiteSpace: "nowrap" }}
				>
					<ArrowLeftIcon size={14} />
					Back to orders
				</button>
			</div>

			<div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
				<StatusTag label={chip.label} color={chip.color} />
				<span className="text-muted" style={{ fontSize: 13 }}>
					{order.titleSnapshot} · seller {order.seller.username ?? "—"}
				</span>
				<span className="text-muted" style={{ marginLeft: "auto", ...mono, fontSize: 12 }}>
					created {formatDate(order.createdAt)}
				</span>
			</div>

			<div className="card" style={{ padding: 18 }}>
				<h6 style={{ marginBottom: 12 }}>Money flow</h6>
				<div style={{ display: "flex", gap: 14 }}>
					{flow.map((step, i) => (
						<div
							key={step.t}
							style={{
								flex: 1,
								borderTop: `3px solid ${stepColor[step.state]}`,
								paddingTop: 9,
								animation: `fadeUp .4s ease ${(i * 0.08).toFixed(2)}s both`,
							}}
						>
							<div
								style={{
									fontSize: 12.5,
									fontWeight: 600,
									color: step.state === "done" || step.state === "future" ? "inherit" : stepColor[step.state],
								}}
							>
								{step.t}
							</div>
							<div className="text-muted" style={{ ...mono, fontSize: 10.5, marginTop: 3 }}>
								{step.d}
							</div>
						</div>
					))}
				</div>
			</div>

			<div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 22, alignItems: "stretch" }}>
				<div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
					{pending && order.paymentUrl && (
						<div className="card elev-md" style={{ padding: 18, gap: 14, animation: "fadeUp .45s ease .08s both", flex: 1 }}>
							<div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
								<h5 style={{ margin: 0 }}>Pay {fmtUsd(order.amountUsd)} USDT</h5>
								<span style={{ ...mono, fontSize: 11, color: "var(--warn)" }}>{countdown}</span>
							</div>
							<div className="text-muted" style={{ fontSize: 12 }}>
								Seller accepts <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>100+ crypto assets</span> —
								pick yours at the OxaPay checkout; the USDT price is fixed for this invoice.
							</div>
							<div style={{ display: "flex", gap: 16 }}>
								<QrPlate value={order.paymentUrl} />
								<div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5 }}>
									<div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
										<span className="text-muted">Network</span>
										<span style={{ ...mono, whiteSpace: "nowrap" }}>any · via OxaPay</span>
									</div>
									<div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
										<span className="text-muted">Amount</span>
										<span style={{ ...mono, whiteSpace: "nowrap" }}>{fmtUsd(order.amountUsd)} USDT</span>
									</div>
									<div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
										<span className="text-muted">Invoice</span>
										<span style={{ ...mono, whiteSpace: "nowrap" }}>oxapay #{order.oxapayTrackId ?? "—"}</span>
									</div>
									<div>
										<div className="text-muted" style={{ fontSize: 11, marginBottom: 4 }}>
											Invoice link
										</div>
										<div style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid var(--color-divider)", padding: "7px 9px" }}>
											<span style={{ ...mono, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
												{order.paymentUrl}
											</span>
											<button
												className="btn btn-icon btn-secondary"
												style={{ width: 28, height: 28, flex: "none" }}
												title="Copy invoice link"
												onClick={copyPaymentUrl}
											>
												<CopyIcon size={13} />
											</button>
										</div>
									</div>
								</div>
							</div>
							<a
								className="btn btn-secondary btn-block"
								href={order.paymentUrl}
								target="_blank"
								rel="noreferrer"
							>
								Open OxaPay checkout · 100+ assets
								<ExternalLinkIcon size={13} />
							</a>
							<div className="text-muted" style={{ fontSize: 11 }}>
								Pay the exact amount in one transaction. Confirmation usually lands within 1–2 minutes; the
								order then moves to escrow automatically — this page refreshes itself.
							</div>
						</div>
					)}

					{order.status === "EXPIRED" && (
						<div className="card elev-md" style={{ padding: 18, gap: 12, flex: 1 }}>
							<h5 style={{ margin: 0 }}>Invoice expired</h5>
							<div className="text-muted" style={{ fontSize: 13 }}>
								This OxaPay invoice was not paid in time. The order is closed — you can re-order the
								service to get a fresh invoice.
							</div>
							<button className="btn btn-primary btn-block" onClick={() => navigate(`/ads/${order.listingId}`)}>
								View service again →
							</button>
						</div>
					)}

					{isBuyer && order.deliveryInfo !== undefined && (
						<div className="card elev-md" style={{ padding: 18, gap: 12, flex: 1 }}>
							<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
								<h5 style={{ margin: 0 }}>Your delivery</h5>
								<span className="tag tag-status" style={{ background: "var(--ok)", fontSize: 10 }}>
									Unlocked
								</span>
							</div>
							<div
								style={{
									...mono,
									fontSize: 12.5,
									lineHeight: 1.6,
									whiteSpace: "pre-wrap",
									background: "var(--color-neutral-100)",
									borderLeft: "3px solid var(--ok)",
									padding: "12px 14px",
									wordBreak: "break-word",
								}}
							>
								{order.deliveryInfo || "The seller left no delivery note — contact them via a dispute if nothing arrived."}
							</div>
							<div className="text-muted" style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11 }}>
								<LockIcon size={13} style={{ flex: "none", marginTop: 1 }} />
								<span>
									Only you can see this. If something is wrong, open a dispute within 30 days of payment —
									the escrow stays frozen until an admin decides.
								</span>
							</div>
						</div>
					)}

					{!isBuyer && (order.status === "PAID" || order.status === "DISPUTED") && (
						<div className="card elev-md" style={{ padding: 18, gap: 12, flex: 1 }}>
							<h5 style={{ margin: 0 }}>Escrow position</h5>
							<Row label="Locked for you" value={`${fmtUsd(order.sellerAmountUsd)} USDT`} color={order.status === "DISPUTED" ? "var(--bad)" : undefined} />
							<Row
								label="Vesting until"
								value={order.vestedAt ? formatDate(order.vestedAt) : "—"}
							/>
							<Row
								label="State"
								value={
									order.status === "DISPUTED"
										? "frozen · open dispute"
										: order.withdrawalId
											? "paid out"
											: order.vestedAt && new Date(order.vestedAt).getTime() <= now
												? "withdrawable in wallet"
												: "vesting"
								}
							/>
							<div className="text-muted" style={{ fontSize: 11 }}>
								The buyer's delivery details unlocked the moment payment confirmed. Funds release to your
								wallet once vesting passes{order.status === "DISPUTED" ? " and the dispute resolves" : ""}.
							</div>
						</div>
					)}
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
					<div className="card" style={{ padding: 16, gap: 8 }}>
						<h6 style={{ marginBottom: 4 }}>Breakdown</h6>
						<Row label="Service price" value={`${fmtUsd(order.amountUsd)} USDT`} />
						<Row label="Kolo fee (4%)" value={`${fmtUsd(order.feeUsd)} USDT`} />
						<Row label="Seller receives" value={`${fmtUsd(order.sellerAmountUsd)} USDT`} />
						<Row
							label="Vesting"
							value={order.vestedAt ? `until ${formatDate(order.vestedAt)}` : "30 days after payment"}
						/>
					</div>
					<div className="card" style={{ padding: 16, gap: 10 }}>
						<h6 style={{ marginBottom: 2 }}>Parties</h6>
						<div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
							<BlockAvatar name={order.buyer.username} imageUrl={order.buyer.imageUrl} size={22} fontSize={10} />
							<span style={{ fontWeight: 600 }}>{order.buyer.username ?? "Buyer"}</span>
							<span className="text-muted">· buyer{isBuyer ? " (you)" : ""}</span>
						</div>
						<div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
							<BlockAvatar name={order.seller.username} imageUrl={order.seller.imageUrl} size={22} fontSize={10} />
							<span style={{ fontWeight: 600 }}>{order.seller.username ?? "Seller"}</span>
							<span className="text-muted">· seller{!isBuyer ? " (you)" : ""}</span>
						</div>
					</div>
					<div className="card" style={{ padding: 16, gap: 8, flex: 1 }}>
						<h6 style={{ marginBottom: 4 }}>Activity</h6>
						{activity.map((entry, i) => (
							<div key={i} style={{ display: "flex", gap: 10, fontSize: 12.5 }}>
								<span className="text-muted" style={{ ...mono, flex: "none" }}>
									{formatDateTime(entry.time)}
								</span>
								<span style={{ color: entry.color }}>{entry.text}</span>
							</div>
						))}
						{pending && (
							<div style={{ display: "flex", gap: 10, fontSize: 12.5 }}>
								<span className="text-muted" style={{ ...mono, flex: "none" }}>
									- now
								</span>
								<span style={{ color: "var(--warn)" }}>Awaiting payment</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{disputeOpen && (
				<div className="card elev-md" style={{ padding: 18, gap: 12 }}>
					<h6 style={{ margin: 0 }}>Open a dispute</h6>
					<div className="text-muted" style={{ fontSize: 12 }}>
						The escrow freezes immediately and an admin arbitrates in a dedicated Telegram group with
						both parties. Describe what went wrong:
					</div>
					<textarea
						className="input"
						value={disputeReason}
						onChange={(e) => setDisputeReason(e.target.value)}
						placeholder="e.g. The redeem code was already used when I tried it."
						autoFocus
					/>
					<div style={{ display: "flex", gap: 8 }}>
						<button className="btn btn-primary" onClick={submitDispute} disabled={busy}>
							{busy ? "Opening…" : "Open dispute · freeze escrow"}
						</button>
						<button className="btn btn-secondary" onClick={() => setDisputeOpen(false)} disabled={busy}>
							Cancel
						</button>
					</div>
				</div>
			)}

			<div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "2px solid var(--color-divider)", paddingTop: 14 }}>
				{canDispute && !disputeOpen && (
					<button className="btn btn-secondary" style={{ whiteSpace: "nowrap" }} onClick={() => setDisputeOpen(true)}>
						Open a dispute
					</button>
				)}
				{dispute && (
					<button className="btn btn-ghost" style={{ whiteSpace: "nowrap" }} onClick={() => navigate(`/disputes/${dispute.id}`)}>
						View dispute →
					</button>
				)}
				<span className="text-muted" style={{ fontSize: 11 }}>
					{pending
						? "Disputes become available once payment is confirmed."
						: canDispute
							? "Something wrong? You can open a dispute within 30 days of payment."
							: dispute
								? "This order has a dispute on file."
								: "Escrow releases automatically once vesting completes."}
				</span>
				<span className="text-muted" style={{ marginLeft: "auto", whiteSpace: "nowrap", ...mono, fontSize: 11 }}>
					{order.id} · created {formatDate(order.createdAt)}
				</span>
			</div>
		</Page>
	);
}
