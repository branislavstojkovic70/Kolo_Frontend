const tickerSpan: React.CSSProperties = {
	fontFamily: "var(--font-mono)",
	fontSize: 11,
	letterSpacing: "0.07em",
	padding: "7px 0 7px 28px",
	whiteSpace: "nowrap",
};

/** Endless marquee of real escrow events; content is duplicated for a seamless −50% loop. */
export default function Ticker({ text }: { text: string }) {
	return (
		<div
			className="ticker"
			style={{
				flex: "none",
				overflow: "hidden",
				borderBottom: "2px solid var(--color-divider)",
				background: "var(--color-neutral-100)",
			}}
		>
			<div className="ticker-track">
				<span className="text-muted" style={tickerSpan}>
					{text}
				</span>
				<span className="text-muted" style={tickerSpan} aria-hidden="true">
					{text}
				</span>
			</div>
		</div>
	);
}
