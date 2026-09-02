import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { disputesApi, MAX_PAGE_SIZE, ordersApi, usersApi, walletApi, type WalletBucket } from "../api";
import AsyncPanel from "../components/async-panel";
import BlockAvatar from "../components/block-avatar";
import CountUp from "../components/count-up";
import { BanknoteIcon, HourglassIcon, LockIcon } from "../components/icons";
import Page from "../components/page";
import StatusTag from "../components/status-tag";
import { useAsync } from "../hooks/use-async";
import { useAuth } from "../hooks/use-auth";
import { useNow } from "../hooks/use-now";
import { withdrawalStatusTag } from "../lib/order-ui";
import { formatDate } from "../utils/format";
import { fmtUsd, sumUsd, usd } from "../utils/money";

const NETWORKS = ["TRC20", "BEP20", "ERC20", "TON", "SOL"];

const mono: React.CSSProperties = { fontFamily: "var(--font-mono)" };
const monoLabel: React.CSSProperties = { ...mono, fontSize: 10.5, letterSpacing: "0.12em" };
const VESTING_DAYS_MS = 30 * 24 * 60 * 60 * 1000;


const bucketTag: Record<WalletBucket, { label: string; color: string }> = {
	available: { label: "Available", color: "var(--ok)" },
	vesting: { label: "Vesting", color: "var(--warn)" },
	disputed: { label: "Frozen", color: "var(--bad)" },
	withdrawing: { label: "Withdrawing", color: "var(--color-accent)" },
	withdrawn: { label: "Withdrawn", color: "var(--color-neutral-600)" },
};

function vestingProgress(vestedAt: string | null): number {
	if (!vestedAt) return 0;
	const end = new Date(vestedAt).getTime();
	const start = end - VESTING_DAYS_MS;
	return Math.min(1, Math.max(0.04, (Date.now() - start) / VESTING_DAYS_MS));
}

function BalanceCard({
	label,
	icon,
	value,
	color,
	caption,
	delay,
}: {
	label: string;
	icon: React.ReactNode;
	value: number;
	color?: string;
	caption: string;
	delay: number;
}) {
	return (
		<div className="card elev-sm wcard" style={{ padding: 16, gap: 6, animation: `fadeUp .45s ease ${delay}s both` }}>
			<div style={{ display: "flex", alignItems: "center" }}>
				<span className="text-muted" style={monoLabel}>
					{label}
				</span>
				<span className="text-muted" style={{ marginLeft: "auto", display: "flex" }}>
					{icon}
				</span>
			</div>
			<div style={{ ...mono, fontSize: 34, fontWeight: 600, lineHeight: 1, color }}>
				<CountUp to={value} dec={2} />{" "}
				<span className="text-muted" style={{ fontSize: 13, fontWeight: 400 }}>
					USDT
				</span>
			</div>
			<div className="text-muted" style={{ fontSize: 12 }}>
				{caption}
			</div>
		</div>
	);
}

export default function Profile() {
	const { user, isAdmin, refresh } = useAuth();
	const [editing, setEditing] = useState(false);
	const [username, setUsername] = useState("");
	const [telegram, setTelegram] = useState("");
	const [address, setAddress] = useState("");
	const [network, setNetwork] = useState(NETWORKS[0]);
	const [busy, setBusy] = useState(false);

	const now = useNow();
	const balanceQ = useAsync(() => walletApi.balance(), []);
	const rowsQ = useAsync(() => walletApi.orders(), []);
	const withdrawalsQ = useAsync(() => walletApi.withdrawals(), []);
	const statsQ = useAsync(async () => {
		const [purchases, sales, disputes] = await Promise.all([
			ordersApi.purchases({ limit: MAX_PAGE_SIZE }),
			ordersApi.sales({ limit: MAX_PAGE_SIZE }),
			disputesApi.mine({ limit: MAX_PAGE_SIZE }),
		]);
		return { purchases: purchases.items, sales: sales.items, disputes: disputes.items };
	}, []);

	const balance = balanceQ.data;
	const available = usd(balance?.available ?? 0);
	const heldTotal = balance ? sumUsd(balance.vesting, balance.disputed) : 0;

	const memberMonths = useMemo(() => {
		if (!user) return 0;
		return Math.max(
			1,
			Math.round((now - new Date(user.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000))
		);
	}, [user, now]);

	const disputesLost = useMemo(() => {
		if (!statsQ.data || !user) return 0;
		return statsQ.data.disputes.filter(
			(d) =>
				(d.status === "RESOLVED_BUYER" && d.order.sellerId === user.id) ||
				(d.status === "RESOLVED_SELLER" && d.order.buyerId === user.id)
		).length;
	}, [statsQ.data, user]);

	if (!user) return null;

	const reloadWallet = () => {
		balanceQ.reload();
		rowsQ.reload();
		withdrawalsQ.reload();
	};

	const saveProfile = async () => {
		setBusy(true);
		try {
			await usersApi.updateMe({
				...(username.trim() ? { username: username.trim() } : {}),
				...(telegram.trim() ? { telegramUsername: telegram.trim().replace(/^@/, "") } : {}),
			});
			await refresh();
			toast.success("Profile updated");
			setEditing(false);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Update failed");
		} finally {
			setBusy(false);
		}
	};

	const withdraw = async () => {
		if (address.trim().length < 10) return toast.error("Enter a valid wallet address");
		setBusy(true);
		try {
			const result = await walletApi.withdraw({ address: address.trim(), network });
			toast.success(`Payout of ${fmtUsd(result.amountUsd)} USDT accepted`);
			setAddress("");
			reloadWallet();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Withdrawal failed");
		} finally {
			setBusy(false);
		}
	};

	return (
		<Page title="Wallet" sub="Escrow · vesting · payouts">
			<div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
				<BlockAvatar name={user.username ?? user.email} imageUrl={user.imageUrl} size={52} fontSize={22} />
				<div>
					<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
						<h4 style={{ margin: 0 }}>{user.username ?? user.email}</h4>
						<span className="tag" style={{ background: "var(--color-accent)", color: "var(--color-bg)", fontWeight: 600 }}>
							{isAdmin ? "Admin" : "Seller"}
						</span>
						<span className="tag" style={{ whiteSpace: "nowrap", border: "1px solid var(--ok)", color: "var(--ok)", background: "transparent" }}>
							Active
						</span>
					</div>
					<div className="text-muted" style={{ ...mono, fontSize: 13, marginTop: 3 }}>
						{user.email} · member since {formatDate(user.createdAt)}
					</div>
				</div>
				<div style={{ marginLeft: "auto", textAlign: "left" }}>
					<div className="text-muted" style={monoLabel}>
						TELEGRAM · FOR DISPUTE CHATS
					</div>
					<div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
						<span style={{ ...mono, fontSize: 13 }}>
							{user.telegramUsername ? `@${user.telegramUsername}` : "not set"}
						</span>
						<button
							className="btn btn-ghost"
							style={{ fontSize: 13 }}
							onClick={() => {
								setUsername(user.username ?? "");
								setTelegram(user.telegramUsername ?? "");
								setEditing((v) => !v);
							}}
						>
							Edit profile
						</button>
					</div>
				</div>
			</div>

			{editing && (
				<div className="card elev-sm" style={{ padding: 16, flexDirection: "row", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
					<div className="field" style={{ width: 220 }}>
						<label>Display name</label>
						<input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
					</div>
					<div className="field" style={{ width: 220 }}>
						<label>Telegram handle · without @</label>
						<input className="input" style={mono} value={telegram} onChange={(e) => setTelegram(e.target.value)} />
					</div>
					<button className="btn btn-primary" onClick={saveProfile} disabled={busy}>
						Save
					</button>
					<button className="btn btn-secondary" onClick={() => setEditing(false)} disabled={busy}>
						Cancel
					</button>
				</div>
			)}

			<div className="balance-grid">
				<BalanceCard
					label="IN ESCROW"
					icon={<LockIcon size={14} />}
					value={heldTotal}
					caption={
						usd(balance?.disputed ?? 0) > 0
							? `includes ${fmtUsd(balance?.disputed ?? 0)} frozen by disputes`
							: "held until vesting completes"
					}
					delay={0}
				/>
				<BalanceCard
					label="VESTING"
					icon={<HourglassIcon size={14} />}
					value={usd(balance?.vesting ?? 0)}
					color="var(--warn)"
					caption={balance?.nextVestingAt ? `Next release ${formatDate(balance.nextVestingAt)}` : "Nothing vesting right now"}
					delay={0.07}
				/>
				<BalanceCard
					label="AVAILABLE"
					icon={<BanknoteIcon size={14} />}
					value={available}
					color="var(--ok)"
					caption="Ready to withdraw"
					delay={0.14}
				/>
			</div>

			<div className="card" style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
				<h6 style={{ margin: 0, flex: "none" }}>Withdraw</h6>
				<input
					className="input"
					style={{ width: 280, maxWidth: "100%", flex: "none", ...mono }}
					placeholder="Destination wallet address"
					value={address}
					onChange={(e) => setAddress(e.target.value)}
				/>
				<select className="input" style={{ width: 110, flex: "none", ...mono }} value={network} onChange={(e) => setNetwork(e.target.value)}>
					{NETWORKS.map((n) => (
						<option key={n}>{n}</option>
					))}
				</select>
				<button className="btn btn-primary" style={{ whiteSpace: "nowrap" }} onClick={withdraw} disabled={busy || available < 1}>
					Withdraw {fmtUsd(available)} USDT
				</button>
				<span className="text-muted" style={{ fontSize: 12, marginLeft: "auto" }}>
					Pays out the whole available bucket · min 1 USDT · orders still vesting stay untouched
				</span>
			</div>

			<div className="card" style={{ padding: "16px 18px", gap: 10 }}>
				<h6 style={{ margin: 0 }}>Vesting entries</h6>
				<AsyncPanel
					loading={rowsQ.loading}
					error={rowsQ.error}
					isEmpty={(rowsQ.data ?? []).length === 0}
					emptyMessage="No escrowed orders yet"
				>
					<div className="table-wrap">
					<table className="table">
						<thead>
							<tr>
								<th>Order</th>
								<th>Amount</th>
								<th>Releases</th>
								<th>Progress</th>
								<th>Status</th>
							</tr>
						</thead>
						<tbody>
							{(rowsQ.data ?? []).map((row) => {
								const tag = bucketTag[row.bucket];
								const pct =
									row.bucket === "vesting" || row.bucket === "disputed"
										? vestingProgress(row.vestedAt)
										: 1;
								return (
									<tr key={row.orderId}>
										<td>
											<div style={{ fontWeight: 600, fontSize: 14 }}>{row.title}</div>
											<div className="text-muted" style={{ ...mono, fontSize: 12 }}>
												{row.orderId}
											</div>
										</td>
										<td style={{ ...mono, fontSize: 13.5 }}>{fmtUsd(row.amount)} USDT</td>
										<td className="text-muted" style={{ ...mono, fontSize: 13.5 }}>
											{row.vestedAt ? formatDate(row.vestedAt) : "—"}
										</td>
										<td>
											<div
												style={{
													width: 120,
													height: 6,
													background: "color-mix(in srgb, var(--color-text) 12%, transparent)",
													position: "relative",
													overflow: "hidden",
												}}
											>
												<div
													style={{
														height: 6,
														width: `${Math.round(pct * 100)}%`,
														background: tag.color,
														animation: "growBar .8s ease .2s both",
														transformOrigin: "left",
													}}
												/>
												<span
													style={{
														position: "absolute",
														inset: 0,
														background:
															"linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%)",
														animation: "sheen 2.6s ease-in-out infinite",
													}}
												/>
											</div>
										</td>
										<td>
											<StatusTag label={tag.label} color={tag.color} />
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
					</div>
				</AsyncPanel>
			</div>

			<div className="layout-two">
				<div className="card" style={{ padding: 18, gap: 12 }}>
					<h6 style={{ margin: 0 }}>Withdrawals</h6>
					<AsyncPanel
						loading={withdrawalsQ.loading}
						error={withdrawalsQ.error}
						isEmpty={(withdrawalsQ.data ?? []).length === 0}
						emptyMessage="No payouts yet"
					>
						<div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
							{(withdrawalsQ.data ?? []).map((w) => {
								const tag = withdrawalStatusTag(w.status);
								return (
									<div
										key={w.id}
										style={{
											display: "flex",
											alignItems: "center",
											gap: 12,
											padding: "8px 10px",
											borderLeft: `3px solid ${tag.color}`,
											background: "var(--color-neutral-100)",
											flexWrap: "wrap",
										}}
									>
										<span style={{ ...mono, fontSize: 13.5, fontWeight: 600, width: 110 }}>
											{fmtUsd(w.amountUsd)} {w.currency}
										</span>
										<span className="text-muted" style={{ ...mono, fontSize: 12 }}>
											{w.network} · {w.address.slice(0, 8)}…{w.address.slice(-4)} · {w.orderCount} orders
										</span>
										<span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
											<span className="text-muted" style={{ ...mono, fontSize: 12 }}>
												{formatDate(w.createdAt)}
											</span>
											<StatusTag label={tag.label} color={tag.color} fontSize={10} />
										</span>
									</div>
								);
							})}
						</div>
					</AsyncPanel>
					<div className="text-muted" style={{ fontSize: 13, borderTop: "2px solid var(--color-divider)", paddingTop: 10 }}>
						Each payout bundles every order that individually finished vesting. Failed payouts unlink
						their orders — the money returns to your available bucket.
					</div>
				</div>

				<div className="card" style={{ padding: 18, gap: 10 }}>
					<h6 style={{ margin: 0 }}>Account</h6>
					{[
						{ label: "Purchases", value: String(statsQ.data?.purchases.length ?? "—") },
						{ label: "Sales", value: String(statsQ.data?.sales.length ?? "—") },
						{
							label: "Disputes lost",
							value: String(statsQ.data ? disputesLost : "—"),
							color: disputesLost > 0 ? "var(--bad)" : "var(--ok)",
						},
						{ label: "Withdrawn to date", value: `${fmtUsd(balance?.withdrawn ?? 0)} USDT` },
						{ label: "Member for", value: `${memberMonths} month${memberMonths === 1 ? "" : "s"}` },
					].map((row, i, all) => (
						<div
							key={row.label}
							style={{
								display: "flex",
								justifyContent: "space-between",
								fontSize: 14,
								padding: "6px 0",
								borderBottom: i === all.length - 1 ? undefined : "1px solid var(--color-divider)",
							}}
						>
							<span className="text-muted">{row.label}</span>
							<span style={{ ...mono, color: row.color }}>{row.value}</span>
						</div>
					))}
					<div className="text-muted" style={{ fontSize: 13, borderTop: "2px solid var(--color-divider)", paddingTop: 10 }}>
						Every sale vests 30 days in escrow before payout. Losing a dispute refunds the buyer from
						escrow immediately — deliver well and the money always releases on schedule.
					</div>
				</div>
			</div>
		</Page>
	);
}
