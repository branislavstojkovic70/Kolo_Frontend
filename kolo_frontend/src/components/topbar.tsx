import { useLocation, useNavigate } from "react-router-dom";
import { MenuIcon, PlusIcon } from "./icons";
import ThemeToggle from "./theme-toggle";

function crumbOf(pathname: string): string {
	if (pathname.startsWith("/ads/new")) return "Sell a subscription";
	if (/^\/ads\/.+\/edit/.test(pathname)) return "Edit your listing";
	if (/^\/ads\/.+/.test(pathname)) return "Subscription details";
	if (pathname.startsWith("/alerts")) return "Deal Alerts";
	if (/^\/orders\/.+/.test(pathname)) return "Your order";
	if (pathname.startsWith("/orders")) return "Orders";
	if (pathname.startsWith("/disputes")) return "Resolution";
	if (pathname.startsWith("/notifications")) return "Activity";
	if (pathname.startsWith("/profile")) return "Wallet";
	if (pathname.startsWith("/admin")) return "Resolution centre";
	return "Browse";
}

export default function Topbar({ onMenu }: { onMenu?: () => void }) {
	const navigate = useNavigate();
	const crumb = crumbOf(useLocation().pathname);

	return (
		<header
			style={{
				display: "flex",
				alignItems: "center",
				gap: "clamp(8px, 2vw, 16px)",
				padding: "0 clamp(12px, 3vw, 24px)",
				// A minimum, not a height: a 48px button inside a 72px bar has no room
				// to spare once the reader has scaled their text up.
				minHeight: 72,
				flex: "none",
				background: "var(--canvas)",
				borderBottom: "1px solid var(--hairline)",
			}}
		>
			{/* Below 1128px the sidebar is a drawer, so the topbar grows the two
			    things it took with it: the opener and the wordmark. */}
			<button className="btn btn-icon menu-btn" onClick={onMenu} title="Menu" aria-label="Menu">
				<MenuIcon size={18} />
			</button>
			<button
				type="button"
				className="topbar-brand"
				title="Kolo marketplace"
				onClick={() => navigate("/ads")}
			>
				Kolo
			</button>
			{/* The breadcrumb is the first thing to go on a phone: the drawer's
			    active row says the same thing and the wordmark needs the room. */}
			<div
				className="hide-xs"
				style={{
					minWidth: 0,
					fontSize: 16,
					fontWeight: 600,
					whiteSpace: "nowrap",
					overflow: "hidden",
					textOverflow: "ellipsis",
				}}
			>
				{crumb}
			</div>
			<div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
				<span className="text-muted hide-md" style={{ whiteSpace: "nowrap", fontSize: 14 }}>
					Every order is covered by Buyer Protection
				</span>
				<ThemeToggle />
				<button
					className="btn btn-primary"
					style={{ whiteSpace: "nowrap" }}
					onClick={() => navigate("/ads/new")}
					title="Sell a subscription"
					aria-label="Sell a subscription"
				>
					<PlusIcon size={16} />
					<span className="hide-xs">Sell a subscription</span>
				</button>
			</div>
		</header>
	);
}
