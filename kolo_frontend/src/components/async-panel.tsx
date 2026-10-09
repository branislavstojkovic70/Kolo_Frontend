import type { ReactNode } from "react";

interface AsyncPanelProps {
	loading: boolean;
	error?: string;
	isEmpty?: boolean;
	emptyMessage?: string;
	/** Re-runs the failed fetch. With it, the error state offers "Try again". */
	onRetry?: () => void;
	/** How many placeholder rows the loading silhouette shows. */
	skeletonRows?: number;
	children: ReactNode;
}

/** Uniform loading / error / empty states in the design language. */
export default function AsyncPanel({
	loading,
	error,
	isEmpty,
	emptyMessage = "Nothing here yet.",
	onRetry,
	skeletonRows = 3,
	children,
}: AsyncPanelProps) {
	if (loading) {
		// A silhouette, not a spinner: rows the shape of the content keep the
		// page's height, so the real list doesn't arrive with a layout jump.
		return (
			<div aria-busy="true" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
				{Array.from({ length: skeletonRows }, (_, i) => (
					<div
						key={i}
						style={{
							height: 64,
							borderRadius: "var(--r-card)",
							background: "var(--surface-soft)",
							animation: "pulseDot 1.2s ease-in-out infinite",
							animationDelay: `${(i * 0.12).toFixed(2)}s`,
						}}
					/>
				))}
				<span className="visually-hidden">Loading…</span>
			</div>
		);
	}

	if (error) {
		return (
			<div
				role="alert"
				style={{
					borderRadius: "var(--r-card)",
					background: "var(--surface-soft)",
					padding: "16px 18px",
					fontSize: 15,
					color: "var(--body-soft)",
					// Server messages carry ids and URLs — single tokens longer than a
					// phone is wide. They break instead of widening the page.
					overflowWrap: "anywhere",
				}}
			>
				<span style={{ fontWeight: 600, color: "var(--error)" }}>Something went wrong. </span>
				{error}
				{onRetry && (
					<div style={{ marginTop: 10 }}>
						<button className="btn btn-secondary btn-sm" onClick={onRetry}>
							Try again
						</button>
					</div>
				)}
			</div>
		);
	}

	if (isEmpty) {
		return (
			<div
				className="text-muted"
				style={{ padding: "56px 0", textAlign: "center", fontSize: 16 }}
			>
				{emptyMessage}
			</div>
		);
	}

	return <>{children}</>;
}
