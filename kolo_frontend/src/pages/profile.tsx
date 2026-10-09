import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import {
	disputesApi,
	MAX_PAGE_SIZE,
	ordersApi,
	usersApi,
	walletApi,
	type WalletBucket,
} from "../api";
import AsyncPanel from "../components/async-panel";
import BlockAvatar from "../components/block-avatar";
import CountUp from "../components/count-up";
import Page from "../components/page";
import StatusTag from "../components/status-tag";
import { useAsync } from "../hooks/use-async";
import { useAuth } from "../hooks/use-auth";
import { useNow } from "../hooks/use-now";
import { withdrawalStatusTag } from "../lib/order-ui";
import { formatDate } from "../utils/format";
import { money, usd } from "../utils/money";
import { usePlatformConfig } from "../hooks/use-platform-config";

/** Bucket wording is a UI rename only — the API keys never change. */
const bucketTag: Record<WalletBucket, { label: string; color: string }> = {
	available: { label: "Ready", color: "var(--success)" },
	vesting: { label: "Clearing", color: "var(--caution)" },
	disputed: { label: "On hold", color: "var(--error)" },
	withdrawing: { label: "On its way", color: "var(--accent)" },
	withdrawn: { label: "Paid out", color: "var(--muted)" },
	unavailable: { label: "Not available", color: "var(--muted)" },
};

/** The one-line explanation under each wallet row, by bucket. */
const bucketCaption: Record<WalletBucket, (vestedAt: string | null) => string> = {
	available: () => "Ready to withdraw",
	vesting: (vestedAt) => `Clearing, available ${vestedAt ? formatDate(vestedAt) : "soon"}`,
	disputed: () => "On hold",
	withdrawing: () => "On its way to you",
	withdrawn: () => "Paid out",
	unavailable: () => "Not available yet",
};

/**
 * Where every dollar on the platform currently sits, as one proportional bar
 * with a legend — the shape every serious money product (Wise, Mercury) uses
 * instead of a row of equal stat cards. Colours are the same status colours
 * the rest of the app already speaks.
 */
function BalanceBreakdown({
	segments,
}: {
	segments: { label: string; value: number; color: string; note?: string }[];
}) {
	const total = segments.reduce((sum, s) => sum + s.value, 0);
	const live = segments.filter((s) => s.value > 0);

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
			<div
				role="img"
				aria-label={segments.map((s) => `${s.label} ${money(s.value)}`).join(", ")}
				style={{
					display: "flex",
					gap: 3,
					height: 10,
					borderRadius: "var(--r-pill)",
					overflow: "hidden",
				}}
			>
				{total > 0 ? (
					live.map((s) => (
						<span
							key={s.label}
							style={{
								// 4% floor so a $5 sliver next to $400 stays visible.
								flex: `${Math.max((s.value / total) * 100, 4)} 0 0`,
								background: s.color,
								borderRadius: 2,
							}}
						/>
					))
				) : (
					<span style={{ flex: 1, background: "var(--surface-strong)" }} />
				)}
			</div>
			<div style={{ display: "flex", gap: "10px 22px", flexWrap: "wrap" }}>
				{segments.map((s) => (
					<span
						key={s.label}
						style={{ display: "inline-flex", alignItems: "baseline", gap: 7, fontSize: 14 }}
					>
						<span
							aria-hidden="true"
							style={{
								width: 8,
								height: 8,
								borderRadius: 2,
								background: s.value > 0 ? s.color : "var(--surface-strong)",
								alignSelf: "center",
								flex: "none",
							}}
						/>
						<span className="text-muted">{s.label}</span>
						<span style={{ fontWeight: 600 }}>{money(s.value)}</span>
						{s.note && (
							<span className="text-muted" style={{ fontSize: 13 }}>
								{s.note}
							</span>
						)}
					</span>
				))}
			</div>
		</div>
	);
}

export default function Profile() {
	const platform = usePlatformConfig();
	const { user, isAdmin, refresh } = useAuth();
	const [editing, setEditing] = useState(false);
	const [payoutOpen, setPayoutOpen] = useState(false);
	const [username, setUsername] = useState("");
	const [telegram, setTelegram] = useState("");
	const [address, setAddress] = useState("");
	// Networks and currencies come from GET /api/config, not from a list here.
	const [network, setNetwork] = useState("");
	const [currency, setCurrency] = useState("");
	const [busy, setBusy] = useState(false);
	// A withdrawal empties the whole available bucket and can't be reversed, so
	// the button arms first and pays out only after the destination is read back.
	const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);
	// Which view of the ledger is open: the per-order activity or the transfers.
	const [tab, setTab] = useState<"orders" | "transfers">("orders");

	const now = useNow();
	const navigate = useNavigate();
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

	// First click: validate and arm. The destination panel opens if the address
	// is missing, so the fix is on screen instead of behind another button.
	const startWithdraw = () => {
		if (address.trim().length < 10) {
			setPayoutOpen(true);
			return toast.error("Add the account you want to be paid into");
		}
		if (platform && available < usd(platform.minWithdrawalUsd)) {
			return toast.error(`The smallest transfer is ${money(platform.minWithdrawalUsd)}`);
		}
		setConfirmingWithdraw(true);
	};

	const withdraw = async () => {
		if (address.trim().length < 10) return toast.error("Add the account you want to be paid into");
		if (platform && available < usd(platform.minWithdrawalUsd)) {
			return toast.error(`The smallest transfer is ${money(platform.minWithdrawalUsd)}`);
		}
		setBusy(true);
		try {
			const result = await walletApi.withdraw({
				address: address.trim(),
				network: network || (platform?.payoutNetworks[0] ?? ""),
				currency: currency || platform?.payoutCurrencies[0],
			});
			toast.success(`${money(result.amountUsd)} is on its way`);
			setAddress("");
			reloadWallet();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "That transfer didn't go through");
		} finally {
			setConfirmingWithdraw(false);
			setBusy(false);
		}
	};

	return (
		<Page title="Wallet" sub="Your money on Kolo: what's ready, what's still clearing, what's been paid out.">
			{/* ── the money statement ──────────────────────────────────────────
			    No card around it: the figure IS the page, the way a bank statement
			    leads with the balance. Whitespace and the breakdown bar do the
			    work that borders and grounds used to pretend to do. */}
			<section style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
				<div style={{ display: "flex", alignItems: "flex-end", gap: "16px 32px", flexWrap: "wrap" }}>
					<div style={{ minWidth: 0 }}>
						<div className="text-muted" style={{ fontSize: 15 }}>
							Ready to withdraw
						</div>
						<div
							style={{
								fontSize: "clamp(36px, 7vw, 52px)",
								fontWeight: 700,
								lineHeight: 1.05,
								letterSpacing: "-0.02em",
								marginTop: 4,
							}}
						>
							$<CountUp to={available} dec={2} />
						</div>
						<div className="text-muted" style={{ fontSize: 14, marginTop: 8 }}>
							{platform
								? `Transfers go out in full, from ${money(platform.minWithdrawalUsd)} upwards.`
								: "Transfers go out in full."}
						</div>
					</div>
					{/* `mobile-full` drops the fixed 200px and the auto margin below
					    744px, so the withdraw button owns its own row in the card. */}
					<div
						className="mobile-full"
						style={{
							marginLeft: "auto",
							display: "flex",
							flexDirection: "column",
							gap: 8,
							minWidth: 200,
							maxWidth: "100%",
						}}
					>
						{!confirmingWithdraw ? (
							<>
								<button
									className="btn btn-primary"
									style={{ whiteSpace: "nowrap" }}
									onClick={startWithdraw}
									disabled={busy || available < usd(platform?.minWithdrawalUsd ?? 0)}
								>
									Withdraw {money(available)}
								</button>
								<button
									className="btn btn-ghost btn-sm"
									style={{ alignSelf: "center" }}
									onClick={() => setPayoutOpen((v) => !v)}
								>
									{payoutOpen ? "Hide payout details" : "Payout details"}
								</button>
							</>
						) : (
							<>
								<div style={{ fontSize: 13, color: "var(--body-soft)" }}>
									{money(available)} as {currency || platform?.payoutCurrencies[0]} over{" "}
									{network || platform?.payoutNetworks[0]} to …{address.trim().slice(-6)}. Transfers
									can't be reversed.
								</div>
								<button className="btn btn-primary" onClick={withdraw} disabled={busy}>
									Confirm transfer
								</button>
								<button
									className="btn btn-secondary"
									onClick={() => setConfirmingWithdraw(false)}
									disabled={busy}
								>
									Cancel
								</button>
							</>
						)}
					</div>

				</div>

				{/* Every dollar, one bar, straight on the canvas. */}
				<BalanceBreakdown
					segments={[
						{ label: "Ready", value: available, color: "var(--success)" },
						{
							label: "Clearing",
							value: usd(balance?.vesting ?? 0),
							color: "var(--caution)",
							note:
								usd(balance?.vesting ?? 0) > 0 && balance?.nextVestingAt
									? `next ${formatDate(balance.nextVestingAt)}`
									: undefined,
						},
						{ label: "On hold", value: usd(balance?.disputed ?? 0), color: "var(--error)" },
						{
							label: "On its way",
							value: usd(balance?.withdrawing ?? 0),
							color: "var(--accent)",
						},
					]}
				/>

				{payoutOpen && (
					<div className="poster" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
						<h2 className="section-head">Payout details</h2>
						<div className="text-muted" style={{ fontSize: 14 }}>
							Where should we send your money? Double-check it. Transfers can't be reversed.
						</div>
						<div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
							{/* Basis, not a floor, on all three: the row keeps its desktop
							    proportions and still fits a tablet-width card. */}
							<div className="field mobile-full" style={{ flex: "1 1 260px", minWidth: 0 }}>
								<label htmlFor="pf-address">Destination account</label>
								<input
									id="pf-address"
									className="input"
									placeholder="Paste your payout address"
									value={address}
									onChange={(e) => setAddress(e.target.value)}
								/>
							</div>
							<div className="field mobile-full" style={{ flex: "0 1 150px", minWidth: 0, maxWidth: "100%" }}>
								<label htmlFor="pf-network">Network</label>
								<select
									id="pf-network"
									className="input"
									value={network || (platform?.payoutNetworks[0] ?? "")}
									onChange={(e) => setNetwork(e.target.value)}
								>
									{(platform?.payoutNetworks ?? []).map((n) => (
										<option key={n}>{n}</option>
									))}
								</select>
							</div>
							<div className="field mobile-full" style={{ flex: "0 1 140px", minWidth: 0, maxWidth: "100%" }}>
								<label htmlFor="pf-currency">Currency</label>
								<select
									id="pf-currency"
									className="input"
									value={currency || (platform?.payoutCurrencies[0] ?? "")}
									onChange={(e) => setCurrency(e.target.value)}
								>
									{(platform?.payoutCurrencies ?? []).map((c) => (
										<option key={c}>{c}</option>
									))}
								</select>
							</div>
						</div>
					</div>
				)}
			</section>

			{/* ── the account, always in view: who you are and your record sit
			    right under the money, not behind a tab. */}
			<section
				style={{
					borderTop: "1px solid var(--hairline-soft)",
					paddingTop: 22,
					display: "flex",
					flexDirection: "column",
					gap: 16,
					minWidth: 0,
				}}
			>
				<h2 className="section-head">Account</h2>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
							gap: "24px 48px",
							alignItems: "start",
						}}
					>
						<div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
							<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
								<BlockAvatar
									name={user.username ?? user.email}
									imageUrl={user.imageUrl}
									size={48}
									fontSize={18}
								/>
								<div style={{ minWidth: 0 }}>
									<div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
										<span style={{ fontSize: 17, fontWeight: 600 }}>{user.username ?? user.email}</span>
										{isAdmin && <span className="tag tag-neutral">Admin</span>}
									</div>
									<div
										className="text-muted"
										style={{ fontSize: 13, marginTop: 2, overflowWrap: "anywhere" }}
									>
										{user.email}
									</div>
								</div>
							</div>

							{!editing ? (
								<div>
									<div className="text-muted" style={{ fontSize: 13 }}>
										Chat handle for resolution requests
									</div>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: 8,
											marginTop: 2,
											flexWrap: "wrap",
										}}
									>
										<span style={{ fontSize: 15 }}>
											{user.telegramUsername ? `@${user.telegramUsername}` : "Not set"}
										</span>
										<button
											className="btn btn-ghost btn-sm"
											onClick={() => {
												setUsername(user.username ?? "");
												setTelegram(user.telegramUsername ?? "");
												setEditing(true);
											}}
										>
											Edit profile
										</button>
									</div>
								</div>
							) : (
								<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
									<div className="field">
										<label htmlFor="pf-name">Display name</label>
										<input
											id="pf-name"
											className="input"
											value={username}
											onChange={(e) => setUsername(e.target.value)}
										/>
									</div>
									<div className="field">
										<label htmlFor="pf-chat">Chat handle (without @)</label>
										<input
											id="pf-chat"
											className="input"
											value={telegram}
											onChange={(e) => setTelegram(e.target.value)}
										/>
									</div>
									<div style={{ display: "flex", gap: 10 }}>
										<button
											className="btn btn-primary"
											style={{ flex: 1 }}
											onClick={saveProfile}
											disabled={busy}
										>
											Save
										</button>
										<button
											className="btn btn-secondary"
											style={{ flex: 1 }}
											onClick={() => setEditing(false)}
											disabled={busy}
										>
											Cancel
										</button>
									</div>
								</div>
							)}

							<div className="text-muted" style={{ fontSize: 13 }}>
								Every sale clears for {platform?.vestingDays ?? "…"} days before it can be withdrawn.
								That window is what makes Buyer Protection possible.
							</div>
						</div>

						<div style={{ minWidth: 0 }}>
							{[
								{ label: "Bought", value: String(statsQ.data?.purchases.length ?? "…") },
								{ label: "Sold", value: String(statsQ.data?.sales.length ?? "…") },
								{
									label: "Requests decided against you",
									value: String(statsQ.data ? disputesLost : "…"),
									color: disputesLost > 0 ? "var(--error)" : undefined,
								},
								{ label: "Paid out to date", value: money(balance?.withdrawn ?? 0) },
								{
									label: "Member for",
									value: `${memberMonths} month${memberMonths === 1 ? "" : "s"}`,
								},
							].map((row, i) => (
								<div
									key={row.label}
									style={{
										display: "flex",
										justifyContent: "space-between",
										gap: 12,
										fontSize: 14,
										padding: "10px 0",
										borderTop: i === 0 ? undefined : "1px solid var(--hairline-soft)",
									}}
								>
									<span className="text-muted">{row.label}</span>
									<span style={{ color: row.color, fontWeight: 600 }}>{row.value}</span>
								</div>
							))}
						</div>
					</div>
			</section>

			{/* ── one ledger, three views, on the canvas ──────────────────────
			    A hairline and the segmented control separate it from the
			    statement above; the tables carry their own hairlines. No box. */}
			<section
				style={{
					borderTop: "1px solid var(--hairline-soft)",
					paddingTop: 22,
					display: "flex",
					flexDirection: "column",
					gap: 18,
					minWidth: 0,
				}}
			>
				<div className="seg" style={{ alignSelf: "flex-start" }}>
					<label className="seg-opt">
						<input type="radio" name="wtab" checked={tab === "orders"} onChange={() => setTab("orders")} />
						Order by order
					</label>
					<label className="seg-opt">
						<input
							type="radio"
							name="wtab"
							checked={tab === "transfers"}
							onChange={() => setTab("transfers")}
						/>
						Transfers
					</label>
				</div>

				{tab === "orders" && (
					<AsyncPanel
						loading={rowsQ.loading}
						error={rowsQ.error}
						onRetry={rowsQ.reload}
						isEmpty={(rowsQ.data ?? []).length === 0}
						emptyMessage="Nothing here yet. Your first sale shows up in this table."
					>
						{/* Four columns is already tight on a phone, so this one reflows
						    to labelled card rows rather than scrolling. */}
						<div className="table-wrap">
							<table className="table table-cards">
								<thead>
									<tr>
										<th>Order</th>
										<th>Amount</th>
										<th>When</th>
										<th>Status</th>
									</tr>
								</thead>
								<tbody>
									{(rowsQ.data ?? []).map((row) => {
										const tag = bucketTag[row.bucket];
										return (
											<tr
												key={row.orderId}
												className="row-click"
												onClick={() => navigate(`/orders/${row.orderId}`)}
											>
												<td data-label="">
													{/* The row's onClick is a mouse convenience; the link is
													    the real, keyboard-reachable navigation. */}
													<Link
														to={`/orders/${row.orderId}`}
														className="link-plain"
														style={{ display: "block" }}
														onClick={(e) => e.stopPropagation()}
													>
														<div style={{ fontWeight: 600, fontSize: 15 }}>{row.title}</div>
													</Link>
												</td>
												<td data-label="Amount" style={{ fontSize: 15, whiteSpace: "nowrap" }}>
													{money(row.amount)}
												</td>
												<td className="text-muted" data-label="When" style={{ fontSize: 14 }}>
													{bucketCaption[row.bucket](row.vestedAt)}
												</td>
												<td data-label="Status">
													<StatusTag label={tag.label} color={tag.color} />
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</AsyncPanel>
				)}

				{tab === "transfers" && (
					<>
						<AsyncPanel
							loading={withdrawalsQ.loading}
							error={withdrawalsQ.error}
							onRetry={withdrawalsQ.reload}
							isEmpty={(withdrawalsQ.data ?? []).length === 0}
							emptyMessage="No transfers yet."
						>
							<div style={{ display: "flex", flexDirection: "column" }}>
								{(withdrawalsQ.data ?? []).map((w) => {
									const tag = withdrawalStatusTag(w.status);
									return (
										<div
											key={w.id}
											style={{
												display: "flex",
												alignItems: "center",
												gap: 12,
												padding: "12px 0",
												borderBottom: "1px solid var(--hairline-soft)",
												flexWrap: "wrap",
											}}
										>
											<span style={{ fontSize: 16, fontWeight: 600, minWidth: 90 }}>
												{money(w.amountUsd)}
											</span>
											{/* Shrinkable, so the count and date break inside the row
											    instead of shoving the status chip off the card. */}
											<span className="text-muted" style={{ fontSize: 14, minWidth: 0 }}>
												{w.orderCount} {w.orderCount === 1 ? "order" : "orders"} · {formatDate(w.createdAt)}
											</span>
											<span style={{ marginLeft: "auto" }}>
												<StatusTag label={tag.label} color={tag.color} />
											</span>
										</div>
									);
								})}
							</div>
						</AsyncPanel>
						<div className="text-muted" style={{ fontSize: 14 }}>
							Each transfer bundles every order that has finished clearing. If one fails, the money
							goes straight back to your ready balance.
						</div>
					</>
				)}

			</section>

		</Page>
	);
}
