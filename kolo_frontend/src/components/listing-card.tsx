import { useState } from "react";
import { Link } from "react-router-dom";
import type { ListingRow } from "../api/types";
import { availableOf, formatCountdown, listingStatusTag } from "../lib/listing-ui";
import { useNow } from "../hooks/use-now";
import { money, savedPercent } from "../utils/money";

interface ListingCardProps {
	listing: ListingRow;
	index: number;
	/** Show the listing status tag (Mine view — PAUSED listings are invisible to buyers). */
	showStatus?: boolean;
}

export default function ListingCard({ listing, index, showStatus = false }: ListingCardProps) {
	// Sellers paste any URL they like, so a dead link must not leave a hole.
	const [imageFailed, setImageFailed] = useState(false);

	const cover = listing.imageUrl ?? listing.product.imageUrl ?? null;
	const showImage = !!cover && !imageFailed;
	const category = listing.category ?? listing.product.category;
	const available = availableOf(listing);
	const retail = listing.product.retailPriceUsd;
	const saved = savedPercent(listing.priceUsd, retail);
	const status = listingStatusTag(listing);

	// Held units only appear on the seller's own feed, so the clock only runs there.
	const held = listing.reservations ?? [];
	const now = useNow(held.length > 0 ? 30_000 : undefined);
	const soonest = held.reduce<number | undefined>((earliest, reservation) => {
		const at = new Date(reservation.expiresAt).getTime();
		return earliest === undefined || at < earliest ? at : earliest;
	}, undefined);
	const heldIn = soonest === undefined ? null : formatCountdown(soonest - now);

	return (
		// A real link: keyboard focus, Enter, middle-click and screen-reader
		// semantics for the app's primary navigation.
		<Link
			to={`/ads/${listing.id}`}
			className="card mcard link-plain"
			style={{
				padding: 0,
				gap: 0,
				overflow: "hidden",
				animation: `fadeUp .3s ease ${(Math.min(index, 11) * 0.04).toFixed(2)}s both`,
			}}
		>
			<div className="mcard-media">
				{showImage ? (
					<img
						src={cover ?? undefined}
						alt={listing.title}
						loading="lazy"
						onError={() => setImageFailed(true)}
					/>
				) : (
					<span
						aria-hidden="true"
						style={{
							position: "absolute",
							inset: 0,
							display: "grid",
							placeItems: "center",
							fontSize: 44,
							fontWeight: 600,
							color: "var(--hairline)",
						}}
					>
						{category.slice(0, 1).toUpperCase()}
					</span>
				)}
				{showStatus && (
					<span
						className="tag tag-status"
						style={
							{
								pointerEvents: "none",
								position: "absolute",
								top: 10,
								right: 10,
								// Opaque, so the chip stays readable over the cover image.
								background: "var(--surface-card)",
								"--chip": status.color,
							} as React.CSSProperties
						}
					>
						{status.label}
					</span>
				)}
			</div>

			{/* `minWidth: 0` on the text column: the grid cell is a `minmax(0, 1fr)`
			    track, so the card is as narrow as a one-up phone column, and a
			    seller's title or username can be one long unbroken token. Those two
			    lines break mid-word rather than reach past the card. */}
			<div
				style={{
					padding: 14,
					display: "flex",
					flexDirection: "column",
					gap: 4,
					flex: 1,
					minWidth: 0,
				}}
			>
				<div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, overflowWrap: "anywhere" }}>
					{listing.title}
				</div>
				<div className="text-muted" style={{ fontSize: 14, overflowWrap: "anywhere" }}>
					{category} · {listing.seller.username ?? "Kolo seller"}
				</div>
				<div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
					<span style={{ fontSize: 16, fontWeight: 600 }}>{money(listing.priceUsd)}</span>
					{saved !== null && (
						<>
							<span className="price-was" style={{ fontSize: 14 }}>
								{money(retail)}
							</span>
							<span className="save-badge">Save {saved}%</span>
						</>
					)}
				</div>
				<div className="text-muted" style={{ fontSize: 14, marginTop: "auto", paddingTop: 4 }}>
					{available === 0 ? (
						listing.soldCount >= listing.quantity ? (
							"Sold out"
						) : (
							"All units are being paid for"
						)
					) : available === 1 ? (
						<span style={{ color: "var(--accent-ink)", fontWeight: 500 }}>Only 1 left</span>
					) : listing.soldCount > 0 ? (
						`${listing.soldCount} sold`
					) : (
						`${available} available`
					)}
				</div>
				{/* Why availableCount sits below quantity − soldCount, in the seller's words. */}
				{held.length > 0 && (
					<div className="text-muted" style={{ fontSize: 13 }}>
						{held.length} {held.length === 1 ? "unit" : "units"} held by a buyer
						{held.length === 1 ? "" : "s"}
						{heldIn ? ` · frees up in ${heldIn}` : " · freeing up now"}
					</div>
				)}
			</div>
		</Link>
	);
}
