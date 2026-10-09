import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useParams } from "react-router-dom";
import { listingsApi, ordersApi } from "../api";
import AsyncPanel from "../components/async-panel";
import BlockAvatar from "../components/block-avatar";
import {
	ArrowLeftIcon,
	CheckIcon,
	LockIcon,
	MessageIcon,
	PauseIcon,
	PencilIcon,
	PlayIcon,
	ShieldCheckIcon,
	TrashIcon,
} from "../components/icons";
import { availableOf, isSoldOut } from "../lib/listing-ui";
import { useDocumentTitle } from "../hooks/use-document-title";
import { useAsync } from "../hooks/use-async";
import { useAuth } from "../hooks/use-auth";
import { formatDate } from "../utils/format";
import { money, savedPercent, usd } from "../utils/money";
import { feeLabel, previewFee, usePlatformConfig } from "../hooks/use-platform-config";

/** The quiet trust stack under the buy button — three hairline-divided rows. */
const TRUST_ROWS = [
	{
		icon: <ShieldCheckIcon size={16} />,
		title: "Buyer Protection",
		body: "Full refund if it's not as described.",
	},
	{
		icon: <LockIcon size={16} />,
		title: "Payment held securely",
		body: "The seller is paid only after you've confirmed.",
	},
	{
		icon: <MessageIcon size={16} />,
		title: "Resolution support",
		body: "A real human steps in if something goes wrong.",
	},
];

export default function AdDetails() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const platform = usePlatformConfig();
	const { user } = useAuth();
	const [imageFailed, setImageFailed] = useState(false);
	const [coverDraft, setCoverDraft] = useState<string>();
	const [busy, setBusy] = useState(false);
	// Removing a listing is destructive, so the button arms first — an inline
	// confirm in the same card, not a browser popup.
	const [confirmingDelete, setConfirmingDelete] = useState(false);

	const { data: ad, loading, error, reload } = useAsync(
		() => (id ? listingsApi.get(id) : Promise.reject(new Error("Missing listing id"))),
		[id]
	);
	const { data: catalogue } = useAsync(() => listingsApi.list({ limit: 100 }), []);
	useDocumentTitle(ad?.title);

	const moreFromSeller = useMemo(
		() =>
			(catalogue?.items ?? [])
				.filter((l) => l.sellerId === ad?.sellerId && l.id !== ad?.id)
				.slice(0, 3),
		[catalogue, ad]
	);

	const isOwnAd = !!user && user.id === ad?.sellerId;
	const available = ad ? availableOf(ad) : 0;
	const soldOut = !!ad && isSoldOut(ad);
	const price = usd(ad?.priceUsd ?? 0);
	const fee = previewFee(platform, price);
	const retail = ad?.product.retailPriceUsd;
	const saved = ad ? savedPercent(ad.priceUsd, retail) : null;
	const cover = ad ? (ad.imageUrl ?? ad.product.imageUrl) : null;
	const canBuy = !!ad && ad.status === "ACTIVE" && available > 0;
	// quantity − soldCount − availableCount: units other buyers are mid-payment on.
	const heldUnits = ad ? Math.max(ad.quantity - ad.soldCount - ad.availableCount, 0) : 0;

	// Every unit held by a buyer mid-payment: the listing is still ACTIVE and the
	// deep link still resolves, so say why rather than pretending it is gone.
	const allUnitsHeld = !!ad && ad.status === "ACTIVE" && !soldOut && available === 0;

	const buyLabel = busy
		? "Starting your order…"
		: soldOut
			? "Sold out"
			: ad?.status !== "ACTIVE"
				? "Not available"
				: allUnitsHeld
					? "Currently unavailable"
					: "Buy now";

	const handleOrder = async () => {
		if (!ad) return;
		setBusy(true);
		try {
			const created = await ordersApi.create(ad.id);
			toast.success("Order started. Finish the payment to confirm it");
			navigate(`/orders/${created.order.id}`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not start the order");
		} finally {
			setBusy(false);
		}
	};

	const handleToggleStatus = async () => {
		if (!ad) return;
		setBusy(true);
		try {
			await listingsApi.update(ad.id, { status: ad.status === "ACTIVE" ? "PAUSED" : "ACTIVE" });
			toast.success(ad.status === "ACTIVE" ? "Listing paused" : "Listing is live again");
			reload();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Update failed");
		} finally {
			setBusy(false);
		}
	};

	/** Cover art is the one listing field editable in place — sellers swap the URL. */
	const handleSaveCover = async () => {
		if (!ad || coverDraft === undefined) return;
		setBusy(true);
		try {
			await listingsApi.update(ad.id, { imageUrl: coverDraft.trim() });
			toast.success(coverDraft.trim() ? "Cover photo updated" : "Cover photo removed");
			setCoverDraft(undefined);
			setImageFailed(false);
			reload();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Update failed");
		} finally {
			setBusy(false);
		}
	};

	const handleDelete = async () => {
		if (!ad) return;
		setBusy(true);
		try {
			await listingsApi.remove(ad.id);
			toast.success("Listing removed");
			navigate("/ads");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not remove the listing");
			setBusy(false);
		}
	};

	return (
		/* No page headline here: on a detail view the listing's own 22px title is
		   the heading, the way a product page reads in any shop. */
		<div className="page-frame">
			<div>
				<button
					className="btn btn-ghost"
					onClick={() => navigate("/ads")}
					style={{ marginLeft: -10, whiteSpace: "nowrap" }}
				>
					<ArrowLeftIcon size={15} />
					Back to browsing
				</button>
			</div>

			<AsyncPanel
				loading={loading}
				error={error}
				onRetry={reload}
				isEmpty={!ad}
				emptyMessage="That listing is no longer here."
			>
				{ad && (
					/* `has-buy-bar` only when there is actually a bar to make room
					   for — the seller's own listing shows management controls in the
					   card instead, and gets no fixed bar. */
					<div className={`layout-detail${isOwnAd ? "" : " has-buy-bar"}`}>
						<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
							{cover && !imageFailed && (
								<img
									src={cover}
									alt=""
									onError={() => setImageFailed(true)}
									style={{
										width: "100%",
										/* A flat 360px crop is most of a phone screen before the
										   title is even reached — the cover scales with the page. */
										maxHeight: "clamp(200px, 42vw, 360px)",
										objectFit: "cover",
										borderRadius: "var(--r-card)",
									}}
								/>
							)}
							<div>
								<div className="text-muted" style={{ fontSize: 14 }}>
									{ad.category ?? ad.product.category} · listed {formatDate(ad.createdAt)}
								</div>
								{/* No size/weight override: the h1 base style (clamp 22–28px, 700)
							    must outweigh the 22px/600 section heads below it. */}
							<h1 style={{ margin: "6px 0 12px" }}>{ad.title}</h1>
								<div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
									<BlockAvatar name={ad.seller.username} imageUrl={ad.seller.imageUrl} size={28} fontSize={12} />
									<span style={{ fontSize: 15, fontWeight: 600 }}>
										{ad.seller.username ?? "Kolo seller"}
									</span>
									{ad.status !== "ACTIVE" && (
										<span
											className="tag tag-status"
											style={
												{ "--chip": soldOut ? "var(--muted)" : "var(--caution)" } as React.CSSProperties
											}
										>
											{soldOut ? "Sold out" : "Paused"}
										</span>
									)}
									<span className="text-muted" style={{ fontSize: 14 }}>
										{available === 0
											? soldOut
												? "Sold out"
												: "All units are being paid for right now"
											: available === 1
												? "Only 1 left"
												: `${available} available`}
									</span>
								</div>
							</div>

							<div>
								<h2 style={{ margin: "0 0 10px" }}>What you get</h2>
								{ad.description.split(/\n{2,}/).map((paragraph, i, all) => (
									<p
										key={i}
										style={{
											fontSize: 16,
											maxWidth: "64ch",
											marginBottom: i === all.length - 1 ? 0 : undefined,
										}}
									>
										{paragraph}
									</p>
								))}
							</div>

							<div>
								<h2 style={{ margin: "0 0 10px" }}>How buying works</h2>
								<div style={{ maxWidth: "64ch", display: "flex", flexDirection: "column", gap: 10 }}>
									{[
										"Pay for your order. We hold the money, not the seller.",
										"Your access details appear on the order page straight away.",
										platform
											? `Check everything works. If it doesn't, ask for help within ${platform.disputeWindowDays} days.`
											: "Check everything works. If it doesn't, ask us for help.",
										"Once the clearing period passes, the seller gets paid.",
									].map((step, i) => (
										<div key={step} style={{ display: "flex", gap: 12, fontSize: 15 }}>
											<span
												style={{
													flex: "none",
													width: 24,
													height: 24,
													display: "grid",
													placeItems: "center",
													borderRadius: "var(--r-pill)",
													background: "var(--surface-strong)",
													fontSize: 13,
													fontWeight: 600,
												}}
											>
												{i + 1}
											</span>
											<span style={{ color: "var(--body-soft)" }}>{step}</span>
										</div>
									))}
								</div>
							</div>

							{moreFromSeller.length > 0 && (
								<div>
									<h2 style={{ margin: "0 0 12px" }}>More from this seller</h2>
									<div
										style={{ display: "flex", flexDirection: "column", maxWidth: "min(640px, 100%)" }}
									>
										{moreFromSeller.map((l) => (
											<Link
												key={l.id}
												to={`/ads/${l.id}`}
												className="row-click link-plain"
												style={{
													display: "block",
													padding: "12px 0",
													borderBottom: "1px solid var(--hairline-soft)",
												}}
											>
												<div style={{ fontSize: 16, fontWeight: 600 }}>{l.title}</div>
												<div className="text-muted" style={{ fontSize: 14 }}>
													{money(l.priceUsd)} · {(l.category ?? "subscription").toLowerCase()}
												</div>
											</Link>
										))}
									</div>
								</div>
							)}
						</div>

						{/* 24px of class padding is 48px of a 360px screen — the card
						    keeps the desktop inset and gives it back on a phone. */}
						<div className="buy-card" style={{ padding: "clamp(16px, 4vw, 24px)" }}>
							<div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
								<span style={{ fontSize: 21, fontWeight: 700 }}>{money(ad.priceUsd)}</span>
								{saved !== null && retail && (
									<span className="price-was" style={{ fontSize: 15 }}>
										{money(retail)}
									</span>
								)}
							</div>
							{saved !== null && retail && (
								<div style={{ fontSize: 15, color: "var(--accent-ink)", fontWeight: 500 }}>
									You save {money(usd(retail) - price)} ({saved}% off the regular price)
								</div>
							)}

							{isOwnAd ? (
								<>
									<div className="text-muted" style={{ fontSize: 14 }}>
										This is your listing. Buyers see it{" "}
										{ad.status === "ACTIVE"
											? "right now."
											: soldOut
												? "but can't buy it: every unit is sold. Raise the quantity to put it back on sale."
												: "only once you make it live again."}
									</div>
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											gap: 6,
											fontSize: 14,
											padding: "12px 0",
											borderTop: "1px solid var(--hairline-soft)",
											borderBottom: "1px solid var(--hairline-soft)",
										}}
									>
										<div
											style={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "baseline",
												gap: 12,
											}}
										>
											<span className="text-muted">Sold so far</span>
											<span>
												{ad.soldCount} of {ad.quantity}
											</span>
										</div>
										{heldUnits > 0 && (
											<div
												style={{
													display: "flex",
													justifyContent: "space-between",
													alignItems: "baseline",
													gap: 12,
												}}
											>
												<span className="text-muted">Being paid for</span>
												<span>
													{heldUnits} {heldUnits === 1 ? "unit" : "units"}
												</span>
											</div>
										)}
										<div
											style={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "baseline",
												gap: 12,
											}}
										>
											<span className="text-muted">Service fee ({feeLabel(platform)})</span>
											<span>{money(fee)}</span>
										</div>
										<div
											style={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "baseline",
												gap: 12,
											}}
										>
											<span className="text-muted">You receive per sale</span>
											<span style={{ fontWeight: 600 }}>{money(price - fee)}</span>
										</div>
									</div>
									<div className="field">
										<label htmlFor="ad-cover">Cover photo link</label>
										<input
											id="ad-cover"
											className="input"
											type="url"
											value={coverDraft ?? ad.imageUrl ?? ""}
											onChange={(e) => setCoverDraft(e.target.value)}
											placeholder="https://example.com/cover.jpg"
										/>
										{coverDraft !== undefined && coverDraft !== (ad.imageUrl ?? "") && (
											<button
												className="btn btn-secondary btn-block"
												onClick={handleSaveCover}
												disabled={busy}
											>
												<CheckIcon size={15} />
												Save cover photo
											</button>
										)}
									</div>
									<button
										className="btn btn-secondary btn-block"
										onClick={() => navigate(`/ads/${ad.id}/edit`)}
										disabled={busy}
									>
										<PencilIcon size={15} />
										Edit listing
									</button>
									{/* Sold out is decided by stock, not by the seller — only Edit can lift it. */}
									<button
										className="btn btn-secondary btn-block"
										onClick={handleToggleStatus}
										disabled={busy || soldOut}
									>
										{ad.status === "ACTIVE" ? <PauseIcon size={15} /> : <PlayIcon size={15} />}
										{ad.status === "ACTIVE"
											? "Pause listing"
											: soldOut
												? "Sold out, edit to restock"
												: "Make it live"}
									</button>
									{!confirmingDelete ? (
										<button
											className="btn btn-ghost btn-block"
											onClick={() => setConfirmingDelete(true)}
											disabled={busy}
											style={{ color: "var(--error)" }}
										>
											<TrashIcon size={15} />
											Remove listing
										</button>
									) : (
										<>
											<div style={{ fontSize: 14, color: "var(--body-soft)" }}>
												Buyers will no longer see this listing. Paid orders stay untouched.
											</div>
											<button
												className="btn btn-secondary btn-block"
												onClick={handleDelete}
												disabled={busy}
												style={{ color: "var(--error)", borderColor: "var(--error)" }}
											>
												Yes, remove it
											</button>
											<button
												className="btn btn-ghost btn-block"
												onClick={() => setConfirmingDelete(false)}
												disabled={busy}
											>
												Keep the listing
											</button>
										</>
									)}
								</>
							) : (
								<>
									{allUnitsHeld && (
										<div className="hold-banner" style={{ fontSize: 14, padding: "12px 14px" }}>
											Currently unavailable. All units are being paid for right now, check back in a
											few minutes.
										</div>
									)}
									<button
										className="btn btn-primary btn-block buy-cta-desktop"
										onClick={handleOrder}
										disabled={busy || !canBuy}
									>
										{buyLabel}
									</button>
								</>
							)}

							<div className="trust-stack">
								{TRUST_ROWS.map((row) => (
									<div key={row.title} className="trust-row">
										{row.icon}
										<span>
											<b>{row.title}</b> - {row.body}
										</span>
									</div>
								))}
							</div>
						</div>

						{/* Below the detail breakpoint the buy card's CTA moves down here. */}
						{!isOwnAd && (
							<div className="buy-bar">
								<div style={{ minWidth: 0 }}>
									<div style={{ fontSize: 17, fontWeight: 700 }}>{money(ad.priceUsd)}</div>
									{saved !== null && retail && (
										<div className="text-muted" style={{ fontSize: 13 }}>
											You save {money(usd(retail) - price)}
										</div>
									)}
								</div>
								<button
									className="btn btn-primary"
									style={{ marginLeft: "auto" }}
									onClick={handleOrder}
									disabled={busy || !canBuy}
								>
									{buyLabel}
								</button>
							</div>
						)}
					</div>
				)}
			</AsyncPanel>
		</div>
	);
}
