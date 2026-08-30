import type { ReactNode } from "react";
import { listingsApi } from "../api";
import { useAsync } from "../hooks/use-async";
import { useThemeMode } from "../theme";
import { MoonIcon, SunIcon } from "./icons";

/**
 * Split auth screen: orange manifesto poster left, centered 360px form right.
 * The poster stat row is real — live service count from the public catalogue.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
	const { mode, toggleMode } = useThemeMode();
	const { data: listings } = useAsync(() => listingsApi.list({ limit: 1 }), []);

	return (
		<div style={{ display: "flex", width: "100%", height: "100vh", overflow: "hidden" }}>
			<div
				className="poster"
				style={{
					flex: 1.25,
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					padding: 38,
				}}
			>
				<div className="poster-stripes" />
				<div style={{ position: "relative" }}>
					<div
						className="poster-ink"
						style={{
							fontFamily: "var(--font-heading)",
							fontWeight: 800,
							fontSize: 30,
							lineHeight: 1,
						}}
					>
						Kolo
					</div>
					<div
						style={{
							fontFamily: "var(--font-mono)",
							fontSize: 10.5,
							letterSpacing: "0.14em",
							color: "rgba(10,15,26,0.7)",
							marginTop: 7,
						}}
					>
						DIGITAL SERVICES · CRYPTO ESCROW
					</div>
				</div>
				<div style={{ position: "relative", animation: "fadeUp .6s ease .1s both" }}>
					<div
						className="poster-ink"
						style={{
							fontFamily: "var(--font-heading)",
							fontWeight: 800,
							fontSize: 58,
							lineHeight: 0.94,
							letterSpacing: "-0.025em",
							textTransform: "uppercase",
						}}
					>
						Paid.
						<br />
						Escrowed.
						<br />
						Vested.
						<br />
						Released.
					</div>
					<div
						className="poster-ink-soft"
						style={{
							fontFamily: "var(--font-mono)",
							fontSize: 13,
							marginTop: 16,
							maxWidth: "46ch",
						}}
					>
						Buy and sell subscriptions, VPNs and digital services. Pay in 100+ crypto assets ·
						funds sit in escrow until you confirm delivery.
					</div>
				</div>
				<div
					style={{
						position: "relative",
						display: "flex",
						gap: 26,
						flexWrap: "wrap",
						fontFamily: "var(--font-mono)",
						fontSize: 12,
						letterSpacing: "0.06em",
						color: "rgba(10,15,26,0.85)",
					}}
				>
					{listings && <span>{listings.total} SERVICES LIVE</span>}
					<span>4% FLAT FEE</span>
					<span>100+ CRYPTO ASSETS</span>
				</div>
			</div>
			<div
				style={{
					flex: 1,
					position: "relative",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					padding: "48px 40px",
					overflowY: "auto",
				}}
			>
				<button
					className="btn btn-icon btn-secondary"
					onClick={toggleMode}
					title="Toggle light / dark"
					style={{ position: "absolute", top: 20, right: 20 }}
				>
					{mode === "dark" ? <SunIcon size={15} /> : <MoonIcon size={15} />}
				</button>
				<div style={{ maxWidth: 360, width: "100%", animation: "fadeUp .5s ease .15s both" }}>
					{children}
				</div>
			</div>
		</div>
	);
}
