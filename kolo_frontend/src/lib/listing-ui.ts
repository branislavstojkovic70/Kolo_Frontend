import type { BuyRequestStatus, Listing, Product } from "../api/types";

/** Shared catalogue lookup so callers don't each write the same `find`. */
export function findProduct(products: Product[] | undefined, id: string): Product | undefined {
	return (products ?? []).find((product) => product.id === id);
}

/**
 * Units a buyer can claim right now: quantity − paid − units held by buyers
 * mid-payment. The backend is the only thing allowed to work this out, so the
 * UI reads `availableCount` and never subtracts anything itself.
 */
export function availableOf(listing: Pick<Listing, "availableCount">): number {
	return Math.max(listing.availableCount, 0);
}

/** `SOLD` is the live enum; `SOLD_OUT` is the legacy spelling of the same thing. */
export function isSoldOut(listing: Pick<Listing, "status">): boolean {
	return listing.status === "SOLD" || listing.status === "SOLD_OUT";
}

/**
 * True when every remaining unit is held by a buyer mid-payment. The listing is
 * still `ACTIVE` and still reachable by deep link — it just can't be bought for
 * the next few minutes.
 */
export function isFullyHeld(listing: Pick<Listing, "status" | "availableCount">): boolean {
	return listing.status === "ACTIVE" && availableOf(listing) === 0;
}

/** Seller-facing listing chip — `color` is the chip's ink, as in order-ui. */
export function listingStatusTag(
	listing: Pick<Listing, "status" | "availableCount">
): { label: string; color: string } {
	if (isSoldOut(listing)) return { label: "Sold out", color: "var(--muted)" };
	if (listing.status !== "ACTIVE") return { label: "Paused", color: "var(--caution)" };
	if (availableOf(listing) === 0) return { label: "All units held", color: "var(--caution)" };
	return { label: "Live", color: "var(--success)" };
}

/** Deal Alert chips. The API enum names never reach the screen. */
export function buyRequestStatusTag(status: BuyRequestStatus): { label: string; color: string } {
	switch (status) {
		case "ACTIVE":
			return { label: "Watching", color: "var(--accent)" };
		case "MATCHED":
			return { label: "Deal found: pay now", color: "var(--caution)" };
		case "FULFILLED":
			return { label: "Purchased", color: "var(--success)" };
		case "CANCELLED":
			return { label: "Cancelled", color: "var(--muted)" };
		case "EXPIRED":
			return { label: "Expired", color: "var(--muted)" };
	}
}

/** "12 min" / "48 sec" / null once the moment has passed — held units, reservations. */
export function formatCountdown(msLeft: number): string | null {
	if (msLeft <= 0) return null;
	const minutes = Math.floor(msLeft / 60_000);
	if (minutes >= 1) return `${minutes} min`;
	return `${Math.max(Math.floor(msLeft / 1000), 1)} sec`;
}

/** "14:02" — the zero-padded clock used on checkout and Deal Alert cards. */
export function formatClock(msLeft: number): string | null {
	if (msLeft <= 0) return null;
	const minutes = Math.floor(msLeft / 60_000);
	const seconds = Math.floor((msLeft % 60_000) / 1000);
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
