import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ApiError, buyRequestsApi, productsApi, type BuyRequest, type BuyRequestStatus } from "../api";
import AsyncPanel from "../components/async-panel";
import { BellIcon, ExternalLinkIcon, TrashIcon } from "../components/icons";
import Page from "../components/page";
import Pagination from "../components/pagination";
import ProductPicker from "../components/product-picker";
import StatusTag from "../components/status-tag";
import { useAsync } from "../hooks/use-async";
import { useListControls } from "../hooks/use-list-controls";
import { usePlatformConfig } from "../hooks/use-platform-config";
import { useNow } from "../hooks/use-now";
import { buyRequestStatusTag, findProduct, formatClock } from "../lib/listing-ui";
import { formatDate } from "../utils/format";
import { money, savedPercent, usd } from "../utils/money";

const STATUS_OPTIONS: { value: BuyRequestStatus; label: string }[] = [
	{ value: "ACTIVE", label: "Watching" },
	{ value: "MATCHED", label: "Deal found" },
	{ value: "FULFILLED", label: "Purchased" },
	{ value: "CANCELLED", label: "Cancelled" },
	{ value: "EXPIRED", label: "Expired" },
];

/** Fallback hold window, used only until /api/config has landed. */
const DEFAULT_HOLD_MINUTES = 15;

interface AlertCardProps {
	alert: BuyRequest;
	/** Milliseconds the reservation has left; null when nothing is reserved. */
	msLeft: number | null;
	onCancel: (alert: BuyRequest) => void;
	busy: boolean;
}

function AlertCard({ alert, msLeft, onCancel, busy }: AlertCardProps) {
	const navigate = useNavigate();
	const chip = buyRequestStatusTag(alert.status);
	const matched = alert.status === "MATCHED";
	const clock = msLeft === null ? null : formatClock(msLeft);
	const paid = alert.matchedOrder?.amountUsd;
	const saved = paid ? savedPercent(paid, alert.product.retailPriceUsd) : null;

	return (
		<div
			className={matched ? "card deal-card" : "card"}
			style={{ padding: "clamp(14px, 4vw, 20px)", gap: 10 }}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
				<StatusTag label={chip.label} color={chip.color} />
				<span className="text-muted" style={{ fontSize: 14 }}>
					{alert.product.category}
				</span>
				<span className="text-muted" style={{ marginLeft: "auto", fontSize: 13 }}>
					Set up {formatDate(alert.createdAt)}
				</span>
			</div>

			<div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{alert.product.name}</div>

			<div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", fontSize: 15 }}>
				<span>
					Buy at or under <b>{money(alert.maxPriceUsd)}</b>
				</span>
				<span className="price-was" style={{ fontSize: 14 }}>
					{money(alert.product.retailPriceUsd)}
				</span>
			</div>

			{alert.status === "ACTIVE" && (
				<div className="text-muted" style={{ fontSize: 14 }}>
					We're watching for this. The moment a seller lists it at your price we'll buy it for you
					and send you the payment link.
					{alert.expiresAt ? ` This alert stops on ${formatDate(alert.expiresAt)}.` : ""}
				</div>
			)}

			{matched && (
				<>
					<div style={{ fontSize: 15 }}>
						Found at <b>{paid ? money(paid) : "-"}</b>
						{saved !== null && `, ${saved}% under the regular price`}. One is held for you.
					</div>
					{clock ? (
						<div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
							<span className="hold-clock">{clock}</span>
							<span style={{ fontSize: 14, color: "var(--body-soft)" }}>
								left to pay before it goes back on sale
							</span>
						</div>
					) : (
						<div style={{ fontSize: 14, color: "var(--body-soft)" }}>
							Reservation lapsed. Your alert will re-arm automatically.
						</div>
					)}
					<div className="action-row" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 2 }}>
						{alert.matchedOrder?.paymentUrl && clock && (
							<a
								className="btn btn-primary btn-sm"
								href={alert.matchedOrder.paymentUrl}
								target="_blank"
								rel="noreferrer"
							>
								Complete payment
								<ExternalLinkIcon size={14} />
							</a>
						)}
						{alert.matchedOrderId && (
							<button
								className="btn btn-secondary btn-sm"
								onClick={() => navigate(`/orders/${alert.matchedOrderId}`)}
							>
								View the order
							</button>
						)}
					</div>
				</>
			)}

			{alert.status === "FULFILLED" && alert.matchedOrderId && (
				<button
					className="btn btn-secondary btn-sm"
					style={{ alignSelf: "flex-start" }}
					onClick={() => navigate(`/orders/${alert.matchedOrderId}`)}
				>
					View the order
				</button>
			)}

			{(alert.status === "ACTIVE" || matched) && (
				<div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
					{matched && (
						<span className="text-muted" style={{ fontSize: 13 }}>
							Let the reservation expire to cancel
						</span>
					)}
					<button
						className="btn btn-ghost btn-sm"
						style={{ marginLeft: "auto", color: matched ? undefined : "var(--error)" }}
						onClick={() => onCancel(alert)}
						disabled={busy || matched}
						title={matched ? "Let the reservation expire to cancel" : undefined}
					>
						<TrashIcon size={14} />
						Cancel alert
					</button>
				</div>
			)}
		</div>
	);
}

/**
 * Auto-buy, consumer-side. A buyer registers "buy this the moment it drops to
 * my price"; the backend makes the order and holds a unit, and the buyer still
 * pays the link themselves. The countdown is the whole point of the screen — a
 * payment link that quietly dies is the one thing people cannot be left to
 * guess at.
 */
export default function DealAlerts() {
	const platform = usePlatformConfig();
	const controls = useListControls<BuyRequestStatus>(10);
	const { status, page, limit } = controls;
	const [productId, setProductId] = useState("");
	const [maxPrice, setMaxPrice] = useState("");
	const [expiresAt, setExpiresAt] = useState("");
	const [busy, setBusy] = useState(false);

	const { data: products } = useAsync(() => productsApi.list(), []);
	const list = useAsync(
		() => buyRequestsApi.mine({ status: status || undefined, page, limit }),
		[status, page, limit]
	);

	const alerts = list.data?.items ?? [];
	const hasMatch = alerts.some((alert) => alert.status === "MATCHED");
	// Only tick while a reservation is actually running down.
	const now = useNow(hasMatch ? 1000 : undefined);

	const holdMinutes = platform?.autoBuyReservationMinutes ?? DEFAULT_HOLD_MINUTES;
	const product = findProduct(products, productId);
	const priceNum = parseFloat(maxPrice) || 0;

	/** Reservation clock for a matched alert: matchedAt + the hold window. */
	const msLeftFor = (alert: BuyRequest): number | null => {
		if (alert.status !== "MATCHED" || !alert.matchedAt) return null;
		return new Date(alert.matchedAt).getTime() + holdMinutes * 60_000 - now;
	};

	const create = async () => {
		if (!productId) return toast.error("Pick what you'd like to watch");
		if (!(priceNum > 0)) return toast.error("Set the most you'd pay");

		setBusy(true);
		try {
			const created = await buyRequestsApi.create({
				productId,
				maxPriceUsd: Math.round(priceNum * 100) / 100,
				// The input is a local date; the API wants an ISO moment.
				expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : undefined,
			});
			if (created.status === "MATCHED") {
				toast.success("Found one already. Pay the link to make it yours");
			} else {
				toast.success("Alert set. We'll buy it the moment the price is right");
			}
			setProductId("");
			setMaxPrice("");
			setExpiresAt("");
			list.reload();
		} catch (err) {
			// 409 is the one error worth its own sentence: the alert already exists.
			if (err instanceof ApiError && err.statusCode === 409) {
				toast.error("You're already watching this one. Change that alert instead.");
			} else {
				toast.error(err instanceof Error ? err.message : "Could not set that alert");
			}
		} finally {
			setBusy(false);
		}
	};

	const cancel = async (alert: BuyRequest) => {
		setBusy(true);
		try {
			await buyRequestsApi.cancel(alert.id);
			toast.success("Alert cancelled");
			list.reload();
		} catch (err) {
			if (err instanceof ApiError && err.statusCode === 409) {
				toast.error("This one already found a deal. Let the reservation expire to cancel.");
			} else {
				toast.error(err instanceof Error ? err.message : "Could not cancel that alert");
			}
			list.reload();
		} finally {
			setBusy(false);
		}
	};

	return (
		<Page
			title="Deal Alerts"
			sub="Name your price and we'll do the watching. When a seller lists it that cheap, we grab one and send you the payment link."
		>
			{/* `aside-first`: stacked, the create form comes before the list. The
			    list is the reward for setting an alert, not the way in. */}
			<div className="layout-form aside-first">
				<div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
					<div className="filter-bar">
						<span className="text-muted" style={{ fontSize: 14 }}>
							{list.data?.total ?? 0} {(list.data?.total ?? 0) === 1 ? "alert" : "alerts"}
						</span>
						<select
							className="input"
							style={{ width: 190, maxWidth: "100%", flex: "none", marginLeft: "auto" }}
							value={status}
							onChange={(e) => controls.setStatus(e.target.value as BuyRequestStatus | "")}
							aria-label="Filter alerts by status"
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
						onRetry={list.reload}
						isEmpty={alerts.length === 0}
						emptyMessage={
							status
								? "No alerts with that status."
								: "No alerts yet. Set one up and we'll watch the marketplace for you."
						}
					>
						<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
							{alerts.map((alert) => (
								<AlertCard
									key={alert.id}
									alert={alert}
									msLeft={msLeftFor(alert)}
									onCancel={cancel}
									busy={busy}
								/>
							))}
						</div>
					</AsyncPanel>

					<Pagination
						page={page}
						pages={list.data?.pages ?? 1}
						limit={limit}
						total={list.data?.total ?? 0}
						onPage={controls.setPage}
						onLimit={controls.setLimit}
						noun="alerts"
					/>
				</div>

				<div className="card elev-md" style={{ padding: "clamp(16px, 4vw, 20px)", gap: 16 }}>
					<h2 className="section-head">Set up an alert</h2>
					<ProductPicker
						id="al-product"
						label="What do you want?"
						products={products}
						value={productId}
						onChange={setProductId}
					/>
					<div className="field">
						<label htmlFor="al-price">The most you'd pay</label>
						<input
							id="al-price"
							className="input"
							value={maxPrice}
							onChange={(e) => setMaxPrice(e.target.value)}
							placeholder="0.00"
							inputMode="decimal"
						/>
						<span className="text-muted" style={{ fontSize: 13 }}>
							{product
								? `Regular price ${money(product.retailPriceUsd)}${
										priceNum > 0 && priceNum < usd(product.retailPriceUsd)
											? `, you'd save ${money(usd(product.retailPriceUsd) - priceNum)}`
											: ""
									}`
								: "Pick something to see its regular price"}
						</span>
					</div>
					<div className="field">
						<label htmlFor="al-expires">Stop watching after (optional)</label>
						<input
							id="al-expires"
							className="input"
							type="date"
							value={expiresAt}
							onChange={(e) => setExpiresAt(e.target.value)}
						/>
					</div>
					<button className="btn btn-primary btn-block" onClick={create} disabled={busy}>
						<BellIcon size={16} />
						{busy ? "Setting it up…" : "Set the alert"}
					</button>
					<div
						className="text-muted"
						style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14 }}
					>
						<BellIcon size={15} style={{ flex: "none", marginTop: 2 }} />
						<span>
							Nothing is charged up front. When we find a deal we hold one for{" "}
							{holdMinutes} minutes and you pay it like any other order, Buyer Protection
							included. If you don't pay, the hold is released and the alert carries on
							watching.
						</span>
					</div>
				</div>
			</div>
		</Page>
	);
}
