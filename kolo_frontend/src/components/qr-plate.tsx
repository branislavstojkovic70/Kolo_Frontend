import { useEffect, useState } from "react";
import { toDataURL } from "qrcode";

/**
 * 150px QR of the OxaPay invoice URL with the animated orange scan line.
 * Rendered on white in both themes so phone cameras can read it.
 */
export default function QrPlate({ value }: { value: string }) {
	const [src, setSrc] = useState<string>();

	useEffect(() => {
		let cancelled = false;
		toDataURL(value, {
			width: 148,
			margin: 1,
			color: { dark: "#0a0f1a", light: "#ffffff" },
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
			className="grid-plate"
			style={{
				width: 150,
				height: 150,
				flex: "none",
				position: "relative",
				border: "1px solid var(--color-divider)",
				overflow: "hidden",
			}}
		>
			{src ? (
				<img src={src} alt="OxaPay invoice QR" style={{ width: "100%", height: "100%" }} />
			) : (
				<span
					className="text-muted"
					style={{
						position: "absolute",
						inset: 0,
						display: "grid",
						placeItems: "center",
						fontFamily: "var(--font-mono)",
						fontSize: 10.5,
						textAlign: "center",
					}}
				>
					OXAPAY QR
				</span>
			)}
			<span
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					top: 0,
					height: 2,
					background: "var(--color-accent)",
					animation: "scan 2.4s linear infinite",
				}}
			/>
		</div>
	);
}
