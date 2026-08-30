import { useLocation, useNavigate } from "react-router-dom";
import { useThemeMode } from "../theme";
import { MoonIcon, PlusIcon, SunIcon } from "./icons";

function crumbOf(pathname: string): string {
	if (pathname.startsWith("/ads/new")) return "MARKETPLACE / POST AN AD";
	if (/^\/ads\/.+/.test(pathname)) return "MARKETPLACE / SERVICE";
	if (/^\/orders\/.+/.test(pathname)) return "ORDERS / ORDER";
	if (pathname.startsWith("/orders")) return "ORDERS";
	if (pathname.startsWith("/disputes")) return "DISPUTES";
	if (pathname.startsWith("/notifications")) return "NOTIFICATIONS";
	if (pathname.startsWith("/profile")) return "WALLET & PROFILE";
	if (pathname.startsWith("/admin")) return "ARBITRATION";
	return "MARKETPLACE";
}

export default function Topbar() {
	const { mode, toggleMode } = useThemeMode();
	const navigate = useNavigate();
	const crumb = crumbOf(useLocation().pathname);

	return (
		<header
			style={{
				display: "flex",
				alignItems: "center",
				gap: 16,
				padding: "0 24px",
				height: 64,
				flex: "none",
				borderBottom: "2px solid var(--color-divider)",
			}}
		>
			<div
				className="text-muted"
				style={{
					fontFamily: "var(--font-mono)",
					fontSize: 12,
					letterSpacing: "0.12em",
					whiteSpace: "nowrap",
					overflow: "hidden",
					textOverflow: "ellipsis",
				}}
			>
				KOLO<span style={{ color: "var(--color-accent)" }}> / </span>
				{crumb}
			</div>
			<div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
				<span
					className="text-muted"
					style={{
						whiteSpace: "nowrap",
						fontFamily: "var(--font-mono)",
						fontSize: 12,
						border: "1px solid var(--color-divider)",
						padding: "5px 9px",
					}}
				>
					100+ CRYPTO ASSETS
				</span>
				<button className="btn btn-icon btn-secondary" onClick={toggleMode} title="Toggle light / dark">
					{mode === "dark" ? <SunIcon size={15} /> : <MoonIcon size={15} />}
				</button>
				<button
					className="btn btn-primary"
					style={{ whiteSpace: "nowrap" }}
					onClick={() => navigate("/ads/new")}
				>
					<PlusIcon size={15} />
					Post an ad
				</button>
			</div>
		</header>
	);
}
