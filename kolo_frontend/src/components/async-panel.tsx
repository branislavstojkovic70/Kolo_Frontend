import type { ReactNode } from "react";

interface AsyncPanelProps {
	loading: boolean;
	error?: string;
	isEmpty?: boolean;
	emptyMessage?: string;
	children: ReactNode;
}

/** Uniform loading / error / empty states in the design language. */
export default function AsyncPanel({
	loading,
	error,
	isEmpty,
	emptyMessage = "Nothing here yet.",
	children,
}: AsyncPanelProps) {
	if (loading) {
		return (
			<div
				className="text-muted"
				style={{
					padding: "56px 0",
					textAlign: "center",
					fontSize: 16,
					animation: "pulseDot 1.2s ease-in-out infinite",
				}}
			>
				Loading…
			</div>
		);
	}

	if (error) {
		return (
			<div
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
