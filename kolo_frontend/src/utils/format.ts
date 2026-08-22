export function formatCurrency(amount: number, currency = "USDT"): string {
	return `${amount.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})} ${currency}`;
}

export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

export function formatDateTime(iso: string): string {
	return new Date(iso).toLocaleString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function formatRelative(iso: string): string {
	const diffMs = new Date(iso).getTime() - Date.now();
	const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

	const units: [Intl.RelativeTimeFormatUnit, number][] = [
		["day", 86_400_000],
		["hour", 3_600_000],
		["minute", 60_000],
	];

	for (const [unit, ms] of units) {
		if (Math.abs(diffMs) >= ms) {
			return formatter.format(Math.round(diffMs / ms), unit);
		}
	}

	return "just now";
}

/** "in_progress" -> "In progress" */
export function humanise(value: string): string {
	const spaced = value.replace(/_/g, " ");
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
