import type { ReactNode } from "react";

interface PageProps {
	title: string;
	/** Right-aligned mono subtitle; rendered uppercase. */
	sub: string;
	children: ReactNode;
}

/** Content frame: 24px padding, 22px section gap, giant page header with 2px rule. */
export default function Page({ title, sub, children }: PageProps) {
	return (
		<div className="page-frame">
			<div
				style={{
					display: "flex",
					alignItems: "flex-end",
					flexWrap: "wrap",
					gap: 18,
					borderBottom: "2px solid var(--color-divider)",
					paddingBottom: 14,
					animation: "fadeUp .4s ease both",
				}}
			>
				<h1
					style={{
						margin: 0,
						fontSize: "clamp(32px, 5.5vw, 52px)",
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
						fontSize: 11,
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
