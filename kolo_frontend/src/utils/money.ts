/** Backend money is a 2-decimal USD string; 1 USDT = 1 USD platform-wide. */

export function usd(value: string | number): number {
	const parsed = typeof value === "number" ? value : parseFloat(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

/** "1234.5" → "1,234.50" */
export function fmtUsd(value: string | number): string {
	return usd(value).toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

/** "1234.5" → "$1,234.50" — the only shape a price takes in the UI. */
export function money(value: string | number): string {
	return `$${fmtUsd(value)}`;
}

export function sumUsd(...values: Array<string | number>): number {
	return values.reduce<number>((total, value) => total + usd(value), 0);
}

/**
 * Discount off the official price, as a whole percent. `null` when there is
 * nothing to show — no retail price, or a retail price at or below the asking
 * price — so callers can simply omit the badge.
 */
export function savedPercent(
	priceUsd: string | number,
	retailUsd: string | number | null | undefined
): number | null {
	if (retailUsd === null || retailUsd === undefined) return null;
	const retail = usd(retailUsd);
	const price = usd(priceUsd);
	if (!(retail > price) || retail <= 0) return null;
	return Math.round(((retail - price) / retail) * 100);
}

// The platform fee lives in GET /api/config — see usePlatformConfig(). Nothing
// here may restate it.
