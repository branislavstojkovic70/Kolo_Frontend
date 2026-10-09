import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { disputesApi, MAX_PAGE_SIZE, ordersApi, type Dispute, type Order, type PlatformConfig } from "../api";
import { usePlatformConfig } from "../hooks/use-platform-config";
import AsyncPanel from "../components/async-panel";
import BlockAvatar from "../components/block-avatar";
import { ArrowLeftIcon, CopyIcon, ExternalLinkIcon, LockIcon, MessageIcon } from "../components/icons";
import Page from "../components/page";
import QrPlate from "../components/qr-plate";
import StatusTag from "../components/status-tag";
import { useAsync } from "../hooks/use-async";
import { useAuth } from "../hooks/use-auth";
import { useNow } from "../hooks/use-now";
import { formatDate, formatDateTime, shortRef } from "../utils/format";
import { money } from "../utils/money";
import { formatClock } from "../lib/listing-ui";
import { orderStatusTag } from "../lib/order-ui";

const hairline = "var(--hairline)";
/** Fallbacks for the two windows the backend owns, used only until /config lands. */
const DEFAULT_DISPUTE_WINDOW_DAYS = 30;
const DEFAULT_HOLD_MINUTES = 15;

type StepState = "done" | "current" | "ready" | "bad" | "future";

interface FlowStep {
	t: string;
	d: string;
	state: StepState;
}

const stepColor: Record<StepState, string> = {
	done: "var(--accent)",
	current: "var(--caution)",
	ready: "var(--success)",
	bad: "var(--error)",
	future: "var(--hairline)",
};

function buildFlow(
	order: Order,
	clock: string | null,
	platform: PlatformConfig | undefined
): FlowStep[] {
	// Rule text comes from the backend config; per-order dates come from the order.
	const clearingLabel = platform ? `${platform.vestingDays} days` : "clearing period";
	const vested = !!order.vestedAt && new Date(order.vestedAt).getTime() <= Date.now();
	switch (order.status) {
		case "PENDING_PAYMENT":
			return [
				{ t: "Payment", d: clock ? `held for you · ${clock}` : "waiting for payment", state: "current" },
				{ t: "Protected", d: "starts when you pay", state: "future" },
				{ t: "Delivered", d: "unlocks right after payment", state: "future" },
				{ t: "Clearing", d: `${clearingLabel} from payment`, state: "future" },
				{ t: "Seller paid", d: "after the clearing period", state: "future" },
			];
		case "EXPIRED":
			return [
				{ t: "Payment", d: "not completed in time", state: "bad" },
				{ t: "Protected", d: "-", state: "future" },
				{ t: "Delivered", d: "-", state: "future" },
				{ t: "Clearing", d: "-", state: "future" },
				{ t: "Seller paid", d: "-", state: "future" },
			];
		case "DISPUTED":
			return [
				{ t: "Payment", d: order.paidAt ? `paid ${formatDate(order.paidAt)}` : "paid", state: "done" },
				{ t: "Protected", d: `${money(order.sellerAmountUsd)} held`, state: "done" },
				{ t: "Delivered", d: "details shared with you", state: "done" },
				{ t: "Clearing", d: "paused while we look into it", state: "bad" },
				{ t: "Seller paid", d: "after the decision", state: "future" },
			];
		case "REFUNDED":
			return [
				{ t: "Payment", d: order.paidAt ? `paid ${formatDate(order.paidAt)}` : "paid", state: "done" },
				{ t: "Protected", d: `${money(order.sellerAmountUsd)} held`, state: "done" },
				{ t: "Delivered", d: "reported as a problem", state: "done" },
				{ t: "Clearing", d: "waived · decided for the buyer", state: "done" },
				{ t: "Refunded", d: "ready to withdraw", state: "ready" },
			];
		case "PAID":
			return [
				{ t: "Payment", d: order.paidAt ? `paid ${formatDate(order.paidAt)}` : "paid", state: "done" },
				{ t: "Protected", d: `${money(order.sellerAmountUsd)} held`, state: "done" },
				{ t: "Delivered", d: "details shared with the buyer", state: "done" },
				vested
					? { t: "Clearing", d: `done ${order.vestedAt ? formatDate(order.vestedAt) : ""}`, state: "done" }
					: {
							t: "Clearing",
							d: order.vestedAt ? `available ${formatDate(order.vestedAt)}` : clearingLabel,
							state: "current",
						},
				order.withdrawalId
					? { t: "Seller paid", d: "transferred", state: "done" }
					: vested
						? { t: "Seller paid", d: "ready to withdraw", state: "ready" }
						: { t: "Seller paid", d: "after clearing", state: "future" },
			];
	}
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
	// The value is a sentence as often as it is a figure ("On hold while we look
	// into it"), and this row lives in a card that is 300px wide on a phone — so
	// it wraps onto a second line rather than squeezing the label away. The value
	// grows to fill whichever line it lands on, which keeps it right-aligned
	// there too.
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "space-between",
				flexWrap: "wrap",
				gap: 4,
				columnGap: 12,
				fontSize: 15,
			}}
		>
			<span className="text-muted" style={{ flex: "none" }}>
				{label}
			</span>
			<span style={{ flex: "1 1 auto", minWidth: 0, color, textAlign: "right" }}>{value}</span>
		</div>
	);
}

export default function OrderDetails() {
	const platform = usePlatformConfig();
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
	const { data: myDisputes, reload: reloadDisputes } = useAsync(
		() => disputesApi.mine({ limit: MAX_PAGE_SIZE }),
		[]
	);
	const dispute: Dispute | undefined = useMemo(
		() => (myDisputes?.items ?? []).find((d) => d.orderId === id),
		[myDisputes, id]
	);

	const pending = order?.status === "PENDING_PAYMENT";
	const now = useNow(pending ? 1000 : undefined);

	// The payment webhook flips the order — poll while the checkout is open.
	useEffect(() => {
		if (!pending) return;
		const timer = setInterval(reload, 5000);
		return () => clearInterval(timer);
	}, [pending, reload]);

	if (!order) {
		return (
			<Page title="Order" sub="Payment, delivery and protection">
				<AsyncPanel
				loading={loading}
				error={error}
				onRetry={reload}
				isEmpty
				emptyMessage="We couldn't find that order."
			>
					<span />
				</AsyncPanel>
			</Page>
		);
	}

	const isBuyer = user?.id === order.buyerId;
	const chip = orderStatusTag(order.status);
	// The unit is held for the reservation window, counted from the order's birth.
	const holdMinutes = platform?.autoBuyReservationMinutes ?? DEFAULT_HOLD_MINUTES;
	const clock = pending
		? formatClock(new Date(order.createdAt).getTime() + holdMinutes * 60_000 - now)
		: null;
	const flow = buildFlow(order, clock, platform);
	// The help window is a platform rule — it comes from /api/config, never a constant here.
	const disputeWindowDays = platform?.disputeWindowDays ?? DEFAULT_DISPUTE_WINDOW_DAYS;
	const canDispute =
		isBuyer &&
		order.status === "PAID" &&
		!dispute &&
		!!order.paidAt &&
		now - new Date(order.paidAt).getTime() < disputeWindowDays * 86_400_000;

	const copyPaymentUrl = () => {
		if (!order.paymentUrl) return;
		void navigator.clipboard.writeText(order.paymentUrl);
		toast.success("Payment link copied");
	};

	const submitDispute = async () => {
		if (disputeReason.trim().length < 5) return toast.error("Tell us what went wrong first");
		setBusy(true);
		try {
			const created = await disputesApi.open(order.id, disputeReason.trim());
			toast.success("Request sent. We'll take it from here");
			reloadDisputes();
			navigate(`/disputes/${created.dispute.id}`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not send your request");
			setBusy(false);
		}
	};

	const activity: Array<{ time: string; text: string; color?: string }> = [
		{ time: order.createdAt, text: "Order placed" },
	];
	if (order.paidAt) {
		activity.push({
			time: order.paidAt,
			text: `Payment confirmed · ${money(order.sellerAmountUsd)} held for the seller`,
		});
	}
	if (dispute) {
		activity.push({
			time: dispute.createdAt,
			text: `Help requested · ${dispute.reason}`,
			color: "var(--error)",
		});
		if (dispute.resolvedAt) {
			activity.push({
				time: dispute.resolvedAt,
				text: `Resolved for the ${dispute.status === "RESOLVED_BUYER" ? "buyer" : "seller"}`,
			});
		}
	}
	if (order.status === "PAID" && order.vestedAt && new Date(order.vestedAt).getTime() <= now) {
		activity.push({
			time: order.vestedAt,
			text: "Clearing complete · funds ready to withdraw",
			color: "var(--success)",
		});
	}

	return (
		<Page title={`Order #${shortRef(order.id)}`} sub={order.titleSnapshot}>
			<div>
				<button
					className="btn btn-ghost"
					onClick={() => navigate("/orders")}
					style={{ marginLeft: -10, whiteSpace: "nowrap" }}
				>
					<ArrowLeftIcon size={15} />
					Back to orders
				</button>
			</div>

			{pending && (
				<div className="hold-banner">
					<span>
						We're holding this item for you
						{clock ? ": " : ""}
						{clock && <span className="hold-clock">{clock}</span>}
					</span>
					<span className="text-muted" style={{ fontSize: 14 }}>
						{clock
							? "Finish the payment before the timer runs out and it's yours."
							: "The hold has run out. Finish the payment or place the order again."}
					</span>
				</div>
			)}

			<div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
				<StatusTag label={chip.label} color={chip.color} />
				<span className="text-muted" style={{ fontSize: 15 }}>
					{isBuyer ? `Sold by ${order.seller.username ?? "a Kolo seller"}` : `Bought by ${order.buyer.username ?? "a Kolo buyer"}`}
				</span>
				{/* `mobile-full` drops the auto margin below 744px — once this line has
				    wrapped onto its own row, pushing it to the right edge only makes the
				    header look broken. */}
				<span className="text-muted mobile-full" style={{ marginLeft: "auto", fontSize: 14 }}>
					Placed {formatDate(order.createdAt)}
				</span>
			</div>

			<div className="card">
				<h2 className="section-head" style={{ marginBottom: 12 }}>
					Where your order is
				</h2>
				<div className="flow-row">
					{flow.map((step) => (
						<div
							key={step.t}
							style={{
								flex: 1,
								borderTop: `3px solid ${stepColor[step.state]}`,
								borderRadius: 2,
								paddingTop: 10,
							}}
						>
							<div
								style={{
									fontSize: 15,
									fontWeight: 600,
									color: step.state === "done" || step.state === "future" ? "inherit" : stepColor[step.state],
								}}
							>
								{step.t}
							</div>
							<div className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
								{step.d}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* The two columns split on the space they actually have, not on the
			    viewport: the sidebar eats 264px of a desktop window, and the same
			    1000px of page can be one column or two depending on it. `min(360px,
			    100%)` is what stops the 360px floor from being wider than a 360px
			    phone. The left column is conditional in every branch — a seller
			    looking at a refunded order renders nothing into it — so it collapses
			    when empty (`.order-primary:empty`) instead of leaving the summary
			    stack squeezed into half a page beside a hole. */}
			<div
				className="order-split"
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))",
					gap: 20,
				}}
			>
				<div className="order-primary" style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
					{pending && order.paymentUrl && (
						<div className="card elev-md" style={{ padding: 20, gap: 16, flex: 1 }}>
							<h2 className="section-head">Pay {money(order.amountUsd)}</h2>
							<div className="text-muted" style={{ fontSize: 15 }}>
								You'll finish on our secure checkout. The moment it clears, your access details
								appear here. This page updates itself.
							</div>
							<a className="btn btn-primary btn-block" href={order.paymentUrl} target="_blank" rel="noreferrer">
								Complete payment
								<ExternalLinkIcon size={15} />
							</a>
							<div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
								<QrPlate value={order.paymentUrl} />
								<div style={{ flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: 10 }}>
									<div style={{ fontSize: 15, fontWeight: 600 }}>Prefer to pay on your phone?</div>
									<div className="text-muted" style={{ fontSize: 14 }}>
										Scan the code, or send yourself the link.
									</div>
									<button className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }} onClick={copyPaymentUrl}>
										<CopyIcon size={14} />
										Copy payment link
									</button>
								</div>
							</div>
						</div>
					)}

					{order.status === "EXPIRED" && (
						<div className="card" style={{ padding: 20, gap: 12, flex: 1 }}>
							<h2 className="section-head">This order wasn't paid in time</h2>
							<div className="text-muted" style={{ fontSize: 15 }}>
								The hold on your item has been released, so the order is closed. If it's still
								listed, you can order it again.
							</div>
							<button className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={() => navigate(`/ads/${order.listingId}`)}>
								View the listing again
							</button>
						</div>
					)}

					{isBuyer && order.deliveryInfo !== undefined && (
						<div className="card" style={{ padding: 20, gap: 14, flex: 1 }}>
							<div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
								<h2 className="section-head">Your access details</h2>
								<StatusTag label="Unlocked" color="var(--success)" />
							</div>
							<div
								style={{
									fontSize: 15,
									lineHeight: 1.6,
									whiteSpace: "pre-wrap",
									background: "var(--surface-soft)",
									borderRadius: "var(--r-card)",
									padding: "16px 18px",
									wordBreak: "break-word",
								}}
							>
								{order.deliveryInfo ||
									"The seller left no note here. If nothing arrived, ask us for help below."}
							</div>
							<div
								className="text-muted"
								style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 14 }}
							>
								<LockIcon size={14} style={{ flex: "none", marginTop: 2 }} />
								<span>
									Only you can see this. If anything is wrong, ask for help within{" "}
									{platform?.disputeWindowDays ?? "-"} days of paying. Your payment stays put
									until it's sorted.
								</span>
							</div>
						</div>
					)}

					{!isBuyer && (order.status === "PAID" || order.status === "DISPUTED") && (
						<div className="card" style={{ padding: 20, gap: 12, flex: 1 }}>
							<h2 className="section-head">Your payout</h2>
							<Row
								label="Held for you"
								value={money(order.sellerAmountUsd)}
								color={order.status === "DISPUTED" ? "var(--error)" : undefined}
							/>
							<Row
								label="Available"
								value={order.vestedAt ? formatDate(order.vestedAt) : "-"}
							/>
							<Row
								label="Status"
								value={
									order.status === "DISPUTED"
										? "On hold while we look into it"
										: order.withdrawalId
											? "Paid out"
											: order.vestedAt && new Date(order.vestedAt).getTime() <= now
												? "Ready to withdraw"
												: "Clearing"
								}
							/>
							<div className="text-muted" style={{ fontSize: 14 }}>
								The buyer got their access details the moment the payment cleared. Your money moves
								to your wallet once the clearing period ends
								{order.status === "DISPUTED" ? " and the request is resolved" : ""}.
							</div>
						</div>
					)}
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
					<div className="card" style={{ padding: 18, gap: 10 }}>
						<h2 className="section-head">Summary</h2>
						{order.retailPriceUsdSnapshot && (
							<Row label="Regular price" value={money(order.retailPriceUsdSnapshot)} />
						)}
						<Row label="You paid" value={money(order.amountUsd)} />
						{!isBuyer && <Row label="Service fee" value={money(order.feeUsd)} />}
						{!isBuyer && <Row label="You receive" value={money(order.sellerAmountUsd)} />}
						<Row
							label="Clearing"
							value={
								order.vestedAt
									? `available ${formatDate(order.vestedAt)}`
									: platform
										? `${platform.vestingDays} days after payment`
										: "after payment"
							}
						/>
					</div>
					<div className="card" style={{ padding: 18, gap: 12 }}>
						<h2 className="section-head">People on this order</h2>
						{/* A seller-typed username is a string nobody chose the length of: the
						    role label wraps under it rather than off the card. */}
						<div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 15 }}>
							<BlockAvatar name={order.buyer.username} imageUrl={order.buyer.imageUrl} size={26} fontSize={11} />
							<span style={{ fontWeight: 600, minWidth: 0 }}>{order.buyer.username ?? "Buyer"}</span>
							<span className="text-muted">buyer{isBuyer ? " (you)" : ""}</span>
						</div>
						<div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 15 }}>
							<BlockAvatar name={order.seller.username} imageUrl={order.seller.imageUrl} size={26} fontSize={11} />
							<span style={{ fontWeight: 600, minWidth: 0 }}>{order.seller.username ?? "Seller"}</span>
							<span className="text-muted">seller{!isBuyer ? " (you)" : ""}</span>
						</div>
					</div>
					<div className="card" style={{ padding: 18, gap: 10, flex: 1 }}>
						<h2 className="section-head">History</h2>
						{activity.map((entry, i) => (
							<div key={i} style={{ display: "flex", gap: 12, fontSize: 14, flexWrap: "wrap" }}>
								<span className="text-muted" style={{ flex: "none" }}>
									{formatDateTime(entry.time)}
								</span>
								<span style={{ color: entry.color }}>{entry.text}</span>
							</div>
						))}
						{pending && (
							<div style={{ display: "flex", gap: 12, fontSize: 14, flexWrap: "wrap" }}>
								<span className="text-muted" style={{ flex: "none" }}>
									Now
								</span>
								<span style={{ color: "var(--caution)" }}>Waiting for your payment</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{disputeOpen && (
				<div className="card elev-md" style={{ padding: 20, gap: 14 }}>
					<h2 className="section-head">Report a problem</h2>
					<div className="text-muted" style={{ fontSize: 15 }}>
						We'll hold the payment and open a private chat with you, the seller and our team.
						Tell us what happened:
					</div>
					<textarea
						className="input"
						value={disputeReason}
						onChange={(e) => setDisputeReason(e.target.value)}
						placeholder="e.g. The code had already been used when I tried it."
						autoFocus
					/>
					<div className="action-row" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
						<button className="btn btn-primary" onClick={submitDispute} disabled={busy}>
							{busy ? "Sending…" : "Send request"}
						</button>
						<button className="btn btn-secondary" onClick={() => setDisputeOpen(false)} disabled={busy}>
							Cancel
						</button>
					</div>
				</div>
			)}

			{/* `action-row` stacks these full-width below 744px. The labels are
			    sentences, not words, so none of them may be `nowrap` — at 360px a
			    nowrap "Chat with support and the seller" is wider than the screen. */}
			<div
				className="action-row"
				style={{
					display: "flex",
					alignItems: "center",
					gap: 14,
					borderTop: `1px solid ${hairline}`,
					paddingTop: 18,
					flexWrap: "wrap",
				}}
			>
				{canDispute && !disputeOpen && (
					<button className="btn btn-secondary" onClick={() => setDisputeOpen(true)}>
						Get help with this order
					</button>
				)}
				{dispute && (
					<button className="btn btn-ghost" onClick={() => navigate(`/disputes/${dispute.id}`)}>
						View your request
					</button>
				)}
				{/* Buyer and seller both get the chat link — neither is added to it for them. */}
				{dispute?.telegramInviteLink && (
					<a
						className="btn btn-secondary"
						href={dispute.telegramInviteLink}
						target="_blank"
						rel="noreferrer"
					>
						<MessageIcon size={15} />
						Chat with support and the {isBuyer ? "seller" : "buyer"}
					</a>
				)}
				<span className="text-muted" style={{ fontSize: 14 }}>
					{pending
						? "You can ask for help once your payment has gone through."
						: canDispute
							? `Something wrong? Ask for help within ${platform?.disputeWindowDays ?? "-"} days of paying.`
							: dispute
								? "There's an open help request on this order."
								: "Nothing to do. The seller is paid automatically once clearing ends."}
				</span>
			</div>
		</Page>
	);
}
