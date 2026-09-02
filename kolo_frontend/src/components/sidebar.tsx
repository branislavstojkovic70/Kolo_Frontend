import { useLocation, useNavigate } from "react-router-dom";
import { walletApi } from "../api";
import { useAsync } from "../hooks/use-async";
import { useAuth } from "../hooks/use-auth";
import { formatDate } from "../utils/format";
import { fmtUsd, sumUsd, usd } from "../utils/money";
import BlockAvatar from "./block-avatar";
import { usePlatformConfig } from "../hooks/use-platform-config";
import {
	BellIcon,
	FileTextIcon,
	LogOutIcon,
	ShieldAlertIcon,
	ShieldCheckIcon,
	StoreIcon,
	WalletIcon,
} from "./icons";

type Section = "market" | "orders" | "disputes" | "notifs" | "wallet" | "admin";

function sectionOf(pathname: string): Section {
	if (pathname.startsWith("/orders")) return "orders";
	if (pathname.startsWith("/disputes")) return "disputes";
	if (pathname.startsWith("/notifications")) return "notifs";
	if (pathname.startsWith("/profile")) return "wallet";
	if (pathname.startsWith("/admin")) return "admin";
	return "market";
}

const monoLabel: React.CSSProperties = {
	fontFamily: "var(--font-mono)",
	fontSize: 10.5,
	letterSpacing: "0.12em",
};

interface SidebarProps {
	unreadCount: number;
	/** Drawer state on narrow viewports; ignored on desktop. */
	open?: boolean;
	onNavigate?: () => void;
}

export default function Sidebar({ unreadCount, open = false, onNavigate }: SidebarProps) {
	const platform = usePlatformConfig();
	const { user, isAdmin, logout } = useAuth();
	const navigate = useNavigate();
	const active = sectionOf(useLocation().pathname);
	const { data: balance } = useAsync(() => walletApi.balance(), []);

	const held = balance ? sumUsd(balance.vesting, balance.disputed) : undefined;
	const releasedShare = balance
		? usd(balance.available) / Math.max(usd(balance.available) + usd(held ?? 0), 0.01)
		: 0;
	const segmentsOn = balance ? Math.round(releasedShare * 12) : 0;

	const item = (section: Section, label: string, icon: React.ReactNode, to: string, badge?: number) => (
		<button
			className={`snav${active === section ? " active" : ""}`}
			onClick={() => {
				navigate(to);
				onNavigate?.();
			}}
		>
			{icon}
			{label}
			{badge !== undefined && badge > 0 && (
				<span
					style={{
						marginLeft: "auto",
						fontFamily: "var(--font-mono)",
						fontSize: 10.5,
						fontWeight: 600,
						background: active === section ? "var(--color-bg)" : "var(--color-accent)",
						color: active === section ? "var(--color-text)" : "var(--color-bg)",
						padding: "1px 6px",
						animation: "pulseDot 2.4s ease-in-out infinite",
					}}
				>
					{badge}
				</span>
			)}
		</button>
	);

	return (
		<aside
			className={`app-sidebar${open ? " open" : ""}`}
			style={{
				width: 288,
				flex: "none",
				display: "flex",
				flexDirection: "column",
				borderRight: "2px solid var(--color-divider)",
				padding: "20px 14px 14px",
				overflowY: "auto",
			}}
		>
			<div style={{ padding: "2px 10px 18px" }}>
				<div
					className="row-click"
					title="Kolo marketplace"
					onClick={() => {
						navigate("/ads");
						onNavigate?.();
					}}
					style={{
						fontFamily: "var(--font-heading)",
						fontWeight: 800,
						fontSize: 27,
						letterSpacing: "-0.02em",
						color: "var(--color-accent)",
						lineHeight: 1,
						width: "fit-content",
					}}
				>
					Kolo
				</div>
				<div
					style={{
						height: 3,
						width: 46,
						background: "var(--color-accent)",
						marginTop: 7,
						animation: "growBar .9s cubic-bezier(.2,.8,.2,1) .15s both",
						transformOrigin: "left",
					}}
				/>
				<div className="text-muted" style={{ ...monoLabel, fontSize: 10, letterSpacing: "0.14em", marginTop: 6 }}>
					DIGITAL SERVICES · CRYPTO ESCROW
				</div>
			</div>

			<nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
				{item("market", "Marketplace", <StoreIcon size={17} />, "/ads")}
				{item("orders", "Orders", <FileTextIcon size={17} />, "/orders")}
				{item("disputes", "Disputes", <ShieldAlertIcon size={17} />, "/disputes")}
				{item("notifs", "Notifications", <BellIcon size={17} />, "/notifications", unreadCount)}
				{item("wallet", "Wallet & profile", <WalletIcon size={17} />, "/profile")}
				{isAdmin && item("admin", "Arbitration", <ShieldCheckIcon size={17} />, "/admin")}
			</nav>

			<div style={{ height: 2, background: "var(--color-divider)", margin: "16px 10px" }} />

			<div style={{ padding: "0 10px" }}>
				<div className="text-muted" style={monoLabel}>
					WALLET
				</div>
				<div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginTop: 8 }}>
					<span className="text-muted">In escrow</span>
					<span style={{ fontFamily: "var(--font-mono)" }}>{held !== undefined ? fmtUsd(held) : "—"}</span>
				</div>
				<div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginTop: 5 }}>
					<span className="text-muted">Vesting</span>
					<span style={{ fontFamily: "var(--font-mono)" }}>{balance ? fmtUsd(balance.vesting) : "—"}</span>
				</div>
				<div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginTop: 5 }}>
					<span className="text-muted">Available</span>
					<span style={{ fontFamily: "var(--font-mono)", color: "var(--ok)" }}>
						{balance ? fmtUsd(balance.available) : "—"}
					</span>
				</div>
			</div>

			<div style={{ height: 2, background: "var(--color-divider)", margin: "16px 10px" }} />

			<div style={{ padding: "0 10px" }}>
				<div className="text-muted" style={monoLabel}>
					ESCROW RELEASE
				</div>
				<div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 8 }}>
					<span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 600 }}>
						{balance ? Math.round(releasedShare * 100) : "—"}
					</span>
					<span className="text-muted" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
						% released
					</span>
				</div>
				<div style={{ display: "flex", gap: 3, margin: "8px 0 7px" }}>
					{Array.from({ length: 12 }, (_, i) => (
						<span
							key={i}
							style={{
								flex: 1,
								height: 6,
								background:
									i < segmentsOn
										? "var(--color-accent)"
										: "color-mix(in srgb, var(--color-text) 15%, transparent)",
								animation: `growBar .5s ease ${(i * 0.04).toFixed(2)}s both`,
								transformOrigin: "left",
							}}
						/>
					))}
				</div>
				<div className="text-muted" style={{ fontSize: 12 }}>
					{balance?.nextVestingAt
						? `Next release ${formatDate(balance.nextVestingAt)}`
						: platform
							? `Funds vest ${platform.vestingDays} days per order`
							: "Funds vest per order"}
				</div>
			</div>

			<div style={{ flex: 1 }} />

			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 10,
					padding: "14px 10px 4px",
					borderTop: "2px solid var(--color-divider)",
					marginTop: 16,
				}}
			>
				<BlockAvatar name={user?.username ?? user?.email} imageUrl={user?.imageUrl} />
				<div style={{ minWidth: 0 }}>
					<div
						style={{
							fontSize: 14,
							fontWeight: 600,
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
						}}
					>
						{user?.username ?? user?.email}
					</div>
					<div className="text-muted" style={{ ...monoLabel, fontSize: 10, letterSpacing: "0.1em" }}>
						{isAdmin ? "ADMIN" : "SELLER"} · ACTIVE
					</div>
				</div>
				<button
					className="btn btn-icon btn-secondary"
					title="Log out"
					style={{ marginLeft: "auto", flex: "none" }}
					onClick={() => {
						logout();
						navigate("/login");
					}}
				>
					<LogOutIcon size={15} />
				</button>
			</div>
		</aside>
	);
}
