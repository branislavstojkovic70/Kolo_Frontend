import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import {
	disputesApi,
	MAX_PAGE_SIZE,
	ordersApi,
	statsApi,
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
	vesting: (vestedAt) => `Clearing — available ${vestedAt ? formatDate(vestedAt) : "soon"}`,
	disputed: () => "On hold",
	withdrawing: () => "On its way to you",
	withdrawn: () => "Paid out",
	unavailable: () => "Not available yet",
};

function BucketCard({
	label,
	value,
	caption,
}: {
	label: string;
	value: number;
	caption: string;
}) {
	return (
		<div className="wcard" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
			<span className="text-muted" style={{ fontSize: 14 }}>
				{label}
			</span>
			<span style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2 }}>{money(value)}</span>
			<span className="text-muted" style={{ fontSize: 13 }}>
				{caption}
			</span>
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

	/**
	 * What the buyer kept versus the regular price. The backend owns this sum —
	 * it works from each order's retail snapshot and already leaves out refunds,
	 * so nothing here recomputes it.
	 */
	const savingsQ = useAsync(() => statsApi.savings(), []);

	const balance = balanceQ.data;
	const available = usd(balance?.available ?? 0);
	const savings = savingsQ.data;

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
			setBusy(false);
		}
	};

	return (
		<Page title="Wallet" sub="Your money on Kolo — what's ready, what's still clearing, what's been paid out.">
			<div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
				<BlockAvatar name={user.username ?? user.email} imageUrl={user.imageUrl} size={56} fontSize={22} />
				{/* `minWidth: 0` so a long e-mail breaks inside the block instead of
				    widening the row past the viewport. */}
				<div style={{ minWidth: 0 }}>
					<div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
						<h2 style={{ margin: 0 }}>{user.username ?? user.email}</h2>
						{isAdmin && <span className="tag tag-neutral">Admin</span>}
					</div>
					<div className="text-muted" style={{ fontSize: 14, marginTop: 2 }}>
						{user.email} · member since {formatDate(user.createdAt)}
					</div>
				</div>
				{/* `mobile-full` drops the auto margin below 744px, so the handle and
				    its Edit button own a left-aligned row of their own once the
				    identity block has taken the first one. */}
				<div className="mobile-full" style={{ marginLeft: "auto", minWidth: 0 }}>
					<div className="text-muted" style={{ fontSize: 13 }}>
						Chat handle for resolution requests
					</div>
					<div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
						<span style={{ fontSize: 15 }}>
							{user.telegramUsername ? `@${user.telegramUsername}` : "Not set"}
						</span>
						<button
							className="btn btn-ghost btn-sm"
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
				<div
					className="card"
					style={{ flexDirection: "row", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}
				>
					{/* 240px is a preference, not a floor: it shrinks with the card and
					    goes full-width under 744px via `mobile-full`. */}
					<div className="field mobile-full" style={{ flex: "0 1 240px", minWidth: 0, maxWidth: "100%" }}>
						<label htmlFor="pf-name">Display name</label>
						<input
							id="pf-name"
							className="input"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
						/>
					</div>
					<div className="field mobile-full" style={{ flex: "0 1 240px", minWidth: 0, maxWidth: "100%" }}>
						<label htmlFor="pf-chat">Chat handle (without @)</label>
						<input
							id="pf-chat"
							className="input"
							value={telegram}
							onChange={(e) => setTelegram(e.target.value)}
						/>
					</div>
					<button className="btn btn-primary" onClick={saveProfile} disabled={busy}>
						Save
					</button>
					<button className="btn btn-secondary" onClick={() => setEditing(false)} disabled={busy}>
						Cancel
					</button>
				</div>
			)}

			{/* ── the money surface ─────────────────────────────────────────── */}
			{/* Radius and padding now live on `.wallet-scope` in the sheet, where
			    they can shrink with the viewport. */}
			<div
				className="wallet-scope"
				style={{
					display: "flex",
					flexDirection: "column",
					gap: 16,
				}}
			>
				<div
					className="wcard"
					style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}
				>
					<div>
						<div className="text-muted" style={{ fontSize: 15 }}>
							Ready to withdraw
						</div>
						<div className="wallet-figure" style={{ marginTop: 4 }}>
							$<CountUp to={available} dec={2} />
						</div>
						<div className="text-muted" style={{ fontSize: 14, marginTop: 6 }}>
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
						<button
							className="btn btn-primary"
							style={{ whiteSpace: "nowrap" }}
							onClick={withdraw}
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
					</div>
				</div>

				{payoutOpen && (
					<div className="wcard" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
						<h2 className="section-head">Payout details</h2>
						<div className="text-muted" style={{ fontSize: 14 }}>
							Where should we send your money? Double-check it — transfers can't be reversed.
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

				{/* The sheet's three fixed columns only fold at 744px, which leaves
				    three cramped cards across a tablet. auto-fit measures the card
				    rather than the viewport, and the `min()` stops the track from
				    insisting on 220px inside a 304px phone column. */}
				<div
					className="balance-grid"
					style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))" }}
				>
					<BucketCard
						label="Clearing"
						value={usd(balance?.vesting ?? 0)}
						caption={
							balance?.nextVestingAt
								? `Available ${formatDate(balance.nextVestingAt)}`
								: "Nothing clearing right now"
						}
					/>
					<BucketCard
						label="On hold"
						value={usd(balance?.disputed ?? 0)}
						caption={
							usd(balance?.disputed ?? 0) > 0
								? "Paused until a resolution request is settled"
								: "No orders in resolution"
						}
					/>
					<BucketCard
						label="On its way"
						value={usd(balance?.withdrawing ?? 0)}
						caption={`${money(balance?.withdrawn ?? 0)} paid out so far`}
					/>
				</div>

				<div className="wcard" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
					<h2 className="section-head">Order by order</h2>
					<AsyncPanel
						loading={rowsQ.loading}
						error={rowsQ.error}
						isEmpty={(rowsQ.data ?? []).length === 0}
						emptyMessage="Nothing here yet — your first sale shows up in this table."
					>
						{/* Four columns inside a card is already tight on a phone, so this
						    one reflows to labelled card rows rather than scrolling. */}
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
				</div>
			</div>

			{/* ── buyer savings: the one loud number in the app ─────────────── */}
			{savings && savings.orderCount > 0 && (
				<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
					<div className="deal-card" style={{ padding: "clamp(18px, 5vw, 28px)" }}>
						<div style={{ fontSize: 17, fontWeight: 600 }}>You've saved</div>
						<div
							style={{
								display: "flex",
								alignItems: "baseline",
								gap: 16,
								flexWrap: "wrap",
								marginTop: 6,
							}}
						>
							<span className="savings-hero">{money(savings.totalSavedUsd)}</span>
							<span style={{ fontSize: 17, fontWeight: 600 }}>
								{savings.savedPercent}% off the regular price
							</span>
						</div>
						<div style={{ fontSize: 15, marginTop: 10, color: "var(--body-soft)" }}>
							Across {savings.orderCount} {savings.orderCount === 1 ? "order" : "orders"} —{" "}
							{money(savings.totalSpentUsd)} paid instead of {money(savings.totalRetailUsd)}.
						</div>
					</div>

					<div className="table-wrap">
						<table className="table table-cards">
							<thead>
								<tr>
									<th>Item</th>
									<th>You paid</th>
									<th>Regular</th>
									<th>Saved</th>
									<th>Bought</th>
								</tr>
							</thead>
							<tbody>
								{savings.items.map((item) => (
									<tr
										key={item.orderId}
										className="row-click"
										onClick={() => navigate(`/orders/${item.orderId}`)}
										style={{ fontSize: 14 }}
									>
										<td data-label="" style={{ fontSize: 14, fontWeight: 600 }}>
											<Link
												to={`/orders/${item.orderId}`}
												className="link-plain"
												style={{ display: "block" }}
												onClick={(e) => e.stopPropagation()}
											>
												{item.productName}
											</Link>
										</td>
										<td data-label="You paid" style={{ fontSize: 14 }}>
											{money(item.paidUsd)}
										</td>
										<td className="price-was" data-label="Regular" style={{ fontSize: 14 }}>
											{money(item.retailUsd)}
										</td>
										<td data-label="Saved" style={{ fontSize: 14, fontWeight: 600 }}>
											{money(item.savedUsd)}
										</td>
										<td
											className="text-muted"
											data-label="Bought"
											style={{ fontSize: 14, whiteSpace: "nowrap" }}
										>
											{item.purchasedAt ? formatDate(item.purchasedAt) : "—"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Same reasoning one level up: a half-width Transfers list is unreadable
			    on a tablet, so the pair goes single file as soon as a column would
			    drop under 360px instead of waiting for the 744px breakpoint. */}
			<div
				className="layout-two"
				style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))" }}
			>
				<div className="card" style={{ padding: 20, gap: 14 }}>
					<h2 className="section-head">Transfers</h2>
					<AsyncPanel
						loading={withdrawalsQ.loading}
						error={withdrawalsQ.error}
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
				</div>

				<div className="card" style={{ padding: 20, gap: 10 }}>
					<h2 className="section-head">Your account</h2>
					{[
						{ label: "Bought", value: String(statsQ.data?.purchases.length ?? "—") },
						{ label: "Sold", value: String(statsQ.data?.sales.length ?? "—") },
						{
							label: "Requests decided against you",
							value: String(statsQ.data ? disputesLost : "—"),
							color: disputesLost > 0 ? "var(--error)" : undefined,
						},
						{ label: "Paid out to date", value: money(balance?.withdrawn ?? 0) },
						{ label: "Member for", value: `${memberMonths} month${memberMonths === 1 ? "" : "s"}` },
					].map((row, i, all) => (
						<div
							key={row.label}
							style={{
								display: "flex",
								justifyContent: "space-between",
								gap: 12,
								fontSize: 15,
								padding: "8px 0",
								borderBottom: i === all.length - 1 ? undefined : "1px solid var(--hairline-soft)",
							}}
						>
							<span className="text-muted">{row.label}</span>
							<span style={{ color: row.color }}>{row.value}</span>
						</div>
					))}
					<div className="text-muted" style={{ fontSize: 14, paddingTop: 4 }}>
						Every sale clears for {platform?.vestingDays ?? "—"} days before it can be withdrawn.
						That window is what makes Buyer Protection possible.
					</div>
				</div>
			</div>
		</Page>
	);
}
