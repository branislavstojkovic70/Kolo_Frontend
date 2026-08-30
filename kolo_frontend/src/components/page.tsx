import type { ReactNode } from "react";

interface PageProps {
	/** Orange mono view index, e.g. "01". */
	idx: string;
	title: string;
	/** Right-aligned mono subtitle; rendered uppercase. */
	sub: string;
	children: ReactNode;
}

/** Content frame: 24px padding, 22px section gap, giant page header with 2px rule. */
export default function Page({ idx, title, sub, children }: PageProps) {
	return (
		<div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 22 }}>
			<div
				style={{
					display: "flex",
					alignItems: "flex-end",
					gap: 18,
					borderBottom: "2px solid var(--color-divider)",
					paddingBottom: 14,
					animation: "fadeUp .4s ease both",
				}}
			>
				<span
					style={{
						fontFamily: "var(--font-mono)",
						fontSize: 12,
						color: "var(--color-accent)",
						paddingBottom: 9,
					}}
				>
					{idx}
				</span>
				<h1
					style={{
						margin: 0,
						fontSize: 52,
						lineHeight: 0.92,
						letterSpacing: "-0.025em",
						textTransform: "uppercase",
					}}
				>
					{title}
				</h1>
				<span
					className="text-muted"
					style={{
						marginLeft: "auto",
						fontFamily: "var(--font-mono)",
						fontSize: 10.5,
						letterSpacing: "0.08em",
						paddingBottom: 9,
						textAlign: "right",
						textTransform: "uppercase",
					}}
				>
					{sub}
				</span>
			</div>
			{children}
		</div>
	);
}
