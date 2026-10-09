import { useEffect, useState } from "react";
import { toDataURL } from "qrcode";

/** Rendered bitmap size. The plate caps itself at this, or at the width of its
 *  column when that is narrower — a QR under ~200px gets unreliable to scan,
 *  so it is the floor the layout works around rather than the first thing to
 *  shrink. The bitmap is generated at 2× and scaled down by CSS, which keeps it
 *  crisp on a phone screen. */
const PLATE = 200;

/**
 * A QR of the checkout link so the buyer can finish paying on their phone.
 *
 * **Deliberately light in both themes.** Phone cameras expect dark modules on
 * a light field; inverting the code for the dark theme would leave the buyer
 * with something that doesn't scan. The plate therefore reads
 * `--qr-plate` / `--qr-plate-border` / `--qr-ink`, which are the only tokens in
 * the sheet that do not change with the theme — and the bitmap is generated
 * from the very same values, so the code and its card can never drift apart.
 */
function qrToken(name: string, fallback: string): string {
	const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	return value || fallback;
}

export default function QrPlate({ value }: { value: string }) {
	const [src, setSrc] = useState<string>();

	useEffect(() => {
		let cancelled = false;
		toDataURL(value, {
			width: PLATE * 2,
			margin: 1,
			color: { dark: qrToken("--qr-ink", "#222222"), light: qrToken("--qr-plate", "#ffffff") },
		})
			.then((url) => {
				if (!cancelled) setSrc(url);
			})
			.catch(() => setSrc(undefined));
		return () => {
			cancelled = true;
		};
	}, [value]);

	return (
		<div
			style={{
				// Never wider than its column, never wider than it needs to be.
				width: `min(100%, ${PLATE + 14}px)`,
				flex: "none",
				padding: 7,
				background: "var(--qr-plate)",
				border: "1px solid var(--qr-plate-border)",
				borderRadius: "var(--r-card)",
			}}
		>
			{src ? (
				<img
					src={src}
					alt="QR code for the payment link"
					style={{ width: "100%", height: "auto", aspectRatio: "1", borderRadius: 6 }}
				/>
			) : (
				<span
					style={{
						display: "grid",
						placeItems: "center",
						aspectRatio: "1",
						fontSize: 13,
						textAlign: "center",
						// The plate is light in both themes, so its placeholder cannot
						// use --muted — that goes pale on the dark theme.
						color: "var(--qr-plate-muted)",
					}}
				>
					Preparing QR…
				</span>
			)}
		</div>
	);
}
