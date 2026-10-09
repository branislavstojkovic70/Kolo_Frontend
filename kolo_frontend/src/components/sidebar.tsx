import { Link, useLocation, useNavigate } from "react-router-dom";
import { walletApi } from "../api";
import { useAsync } from "../hooks/use-async";
import { useAuth } from "../hooks/use-auth";
import { formatDate } from "../utils/format";
import { money, sumUsd } from "../utils/money";
import BlockAvatar from "./block-avatar";
import {
	BellIcon,
	FileTextIcon,
	HourglassIcon,
	LogOutIcon,
	ShieldAlertIcon,
	ShieldCheckIcon,
	StoreIcon,
	WalletIcon,
} from "./icons";

type Section = "market" | "alerts" | "orders" | "disputes" | "notifs" | "wallet" | "admin";

function sectionOf(pathname: string): Section {
	if (pathname.startsWith("/alerts")) return "alerts";
	if (pathname.startsWith("/orders")) return "orders";
	if (pathname.startsWith("/disputes")) return "disputes";
	if (pathname.startsWith("/notifications")) return "notifs";
	if (pathname.startsWith("/profile")) return "wallet";
	if (pathname.startsWith("/admin")) return "admin";
	return "market";
}

interface SidebarProps {
	unreadCount: number;
	/** Drawer state on narrow viewports; ignored on desktop. */
	open?: boolean;
	onNavigate?: () => void;
}

export default function Sidebar({ unreadCount, open = false, onNavigate }: SidebarProps) {
	const { user, isAdmin, logout } = useAuth();
	const navigate = useNavigate();
	const active = sectionOf(useLocation().pathname);
	const { data: balance } = useAsync(() => walletApi.balance(), []);

	// "Clearing" and "On hold" together: money that is yours but not yet movable.
	const clearing = balance ? sumUsd(balance.vesting, balance.disputed) : undefined;

	// Real links: cmd/middle-click, keyboard focus and `aria-current` all come
	// with the element. `onNavigate` still closes the drawer on tap.
	const item = (section: Section, label: string, icon: React.ReactNode, to: string, badge?: number) => (
		<Link
			to={to}
			className={`snav${active === section ? " active" : ""}`}
			aria-current={active === section ? "page" : undefined}
			onClick={() => onNavigate?.()}
		>
			{icon}
			{label}
			{badge !== undefined && badge > 0 && (
				<>
					<span
						aria-hidden="true"
						style={{
							marginLeft: "auto",
							fontSize: 11,
							fontWeight: 600,
							background: "var(--accent)",
							color: "var(--on-accent)",
							borderRadius: "var(--r-pill)",
							padding: "2px 8px",
						}}
					>
						{badge}
					</span>
					<span className="visually-hidden">{badge} unread</span>
				</>
			)}
		</Link>
	);

	return (
		<aside
			id="app-nav"
			aria-label="Main navigation"
			// Focus target when the drawer opens — see the effect in app-shell.
			tabIndex={-1}
			className={`app-sidebar${open ? " open" : ""}`}
			style={{
				width: 264,
				// The drawer rule already caps the open panel at 86vw; this is the
				// same promise for the fixed width itself, on any viewport narrower
				// than the panel.
				maxWidth: "100%",
				flex: "none",
				display: "flex",
				flexDirection: "column",
				background: "var(--canvas)",
				borderRight: "1px solid var(--hairline)",
				padding: "22px 14px 16px",
				overflowY: "auto",
			}}
		>
			<div style={{ padding: "0 10px 20px" }}>
				<Link
					to="/ads"
					className="link-plain"
					title="Kolo marketplace"
					onClick={() => onNavigate?.()}
					style={{
						display: "inline-block",
						fontSize: 26,
						fontWeight: 700,
						letterSpacing: "-0.01em",
						color: "var(--accent)",
						lineHeight: 1,
						width: "fit-content",
					}}
				>
					Kolo
				</Link>
				<div className="text-muted" style={{ fontSize: 13, marginTop: 6 }}>
					Subscriptions below retail
				</div>
			</div>

			<nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
				{item("market", "Browse", <StoreIcon size={18} />, "/ads")}
				{item("alerts", "Deal Alerts", <HourglassIcon size={18} />, "/alerts")}
				{item("orders", "Orders", <FileTextIcon size={18} />, "/orders")}
				{item("disputes", "Resolution", <ShieldAlertIcon size={18} />, "/disputes")}
				{item("notifs", "Activity", <BellIcon size={18} />, "/notifications", unreadCount)}
				{item("wallet", "Wallet", <WalletIcon size={18} />, "/profile")}
				{isAdmin && item("admin", "Resolution centre", <ShieldCheckIcon size={18} />, "/admin")}
			</nav>

			{/* Wallet at a glance — the full breakdown lives on the wallet page. */}
			<Link
				to="/profile"
				className="link-plain"
				onClick={() => onNavigate?.()}
				style={{
					display: "block",
					margin: "20px 4px 0",
					padding: 16,
					// Same ground as the wallet page, so the glance card reads as a
					// window onto it.
					background: "var(--wallet-ground)",
					borderRadius: "var(--r-card)",
				}}
			>
				<div className="text-muted" style={{ fontSize: 13 }}>
					Ready to withdraw
				</div>
				{/* A balance is one unbreakable token at 24px inside a 196px card. */}
				<div
					style={{
						fontSize: 24,
						fontWeight: 700,
						lineHeight: 1.2,
						marginTop: 2,
						overflowWrap: "anywhere",
					}}
				>
					{balance ? money(balance.available) : "—"}
				</div>
				<div className="text-muted" style={{ fontSize: 13, marginTop: 6 }}>
					{clearing !== undefined && clearing > 0
						? balance?.nextVestingAt
							? `${money(clearing)} clearing · next ${formatDate(balance.nextVestingAt)}`
							: `${money(clearing)} clearing`
						: "Nothing clearing right now"}
				</div>
			</Link>

			<div style={{ flex: 1 }} />

			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 10,
					padding: "16px 10px 4px",
					borderTop: "1px solid var(--hairline-soft)",
					marginTop: 20,
				}}
			>
				<BlockAvatar name={user?.username ?? user?.email} imageUrl={user?.imageUrl} />
				<div style={{ minWidth: 0 }}>
					<div
						style={{
							fontSize: 15,
							fontWeight: 600,
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
						}}
					>
						{user?.username ?? user?.email}
					</div>
					<div className="text-muted" style={{ fontSize: 13 }}>
						{isAdmin ? "Admin" : "Member"}
					</div>
				</div>
				<button
					className="btn btn-icon"
					title="Log out"
					aria-label="Log out"
					style={{ marginLeft: "auto", flex: "none" }}
					onClick={() => {
						logout();
						navigate("/login");
					}}
				>
					<LogOutIcon size={16} />
				</button>
			</div>
		</aside>
	);
}
