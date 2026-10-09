const tickerSpan: React.CSSProperties = {
	fontSize: 13,
	padding: "8px 0 8px 36px",
	whiteSpace: "nowrap",
};

/**
 * Quiet activity strip under the topbar: one line of muted text, drifting
 * slowly. The content is duplicated for a seamless −50% loop.
 */
export default function Ticker({ text }: { text: string }) {
	return (
		<div
			className="ticker"
			style={{
				flex: "none",
				// The track is `width: max-content` by design. The strip it runs in has
				// to stay the width of the shell column, or the one-line marquee
				// becomes the widest thing on the page.
				minWidth: 0,
				maxWidth: "100%",
				overflow: "hidden",
				borderBottom: "1px solid var(--hairline-soft)",
				background: "var(--canvas)",
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
