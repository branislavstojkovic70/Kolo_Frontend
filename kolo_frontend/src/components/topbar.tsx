import { Link, useLocation } from "react-router-dom";
import type { Savings } from "../api";
import { money } from "../utils/money";
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

export default function Topbar({
	onMenu,
	menuOpen = false,
	savings,
}: {
	onMenu?: () => void;
	menuOpen?: boolean;
	/** The buyer's lifetime savings; undefined until loaded or while zero. */
	savings?: Savings;
}) {
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
			<button
				className="btn btn-icon menu-btn"
				onClick={onMenu}
				title="Menu"
				aria-label="Menu"
				aria-expanded={menuOpen}
				aria-controls="app-nav"
			>
				<MenuIcon size={18} />
			</button>
			<Link to="/ads" className="topbar-brand" title="Kolo marketplace">
				Kolo
			</Link>
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
				{/* The product's whole point, worn where it's always visible: what
				    sharing subscriptions has saved this buyer so far. Before the
				    first purchase, the protection promise fills the slot instead. */}
				{savings ? (
					<Link
						to="/profile"
						className="hide-md"
						style={{
							whiteSpace: "nowrap",
							fontSize: 14,
							fontWeight: 600,
							textDecoration: "none",
							color: "var(--accent-ink)",
							background: "var(--accent-tint)",
							padding: "8px 14px",
							borderRadius: "var(--r-pill)",
						}}
					>
						You've saved {money(savings.totalSavedUsd)}
					</Link>
				) : (
					<span className="text-muted hide-md" style={{ whiteSpace: "nowrap", fontSize: 14 }}>
						Every order is covered by Buyer Protection
					</span>
				)}
				<ThemeToggle />
				<Link
					to="/ads/new"
					className="btn btn-primary"
					style={{ whiteSpace: "nowrap" }}
					title="Sell a subscription"
					aria-label="Sell a subscription"
				>
					<PlusIcon size={16} />
					<span className="hide-xs">Sell a subscription</span>
				</Link>
			</div>
		</header>
	);
}
