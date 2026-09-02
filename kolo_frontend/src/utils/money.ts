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

export function sumUsd(...values: Array<string | number>): number {
	return values.reduce<number>((total, value) => total + usd(value), 0);
}

// The platform fee lives in GET /api/config — see usePlatformConfig(). Nothing
// here may restate it.
