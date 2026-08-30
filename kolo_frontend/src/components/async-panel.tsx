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
					padding: "48px 0",
					textAlign: "center",
					fontFamily: "var(--font-mono)",
					fontSize: 11,
					letterSpacing: "0.12em",
					animation: "pulseDot 1.2s ease-in-out infinite",
				}}
			>
				LOADING…
			</div>
		);
	}

	if (error) {
		return (
			<div
				style={{
					borderLeft: "3px solid var(--bad)",
					background: "var(--color-neutral-100)",
					padding: "14px 16px",
					fontSize: 13,
				}}
			>
				<span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", color: "var(--bad)" }}>
					ERROR ·{" "}
				</span>
				{error}
			</div>
		);
	}

	if (isEmpty) {
		return (
			<div
				className="text-muted"
				style={{
					padding: "48px 0",
					textAlign: "center",
					fontFamily: "var(--font-mono)",
					fontSize: 11,
					letterSpacing: "0.12em",
				}}
			>
				{emptyMessage.toUpperCase()}
			</div>
		);
	}

	return <>{children}</>;
}
