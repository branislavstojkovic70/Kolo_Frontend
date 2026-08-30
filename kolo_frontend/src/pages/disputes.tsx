import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { adminApi, disputesApi, type Dispute } from "../api";
import AsyncPanel from "../components/async-panel";
import { PaperclipIcon, SendIcon } from "../components/icons";
import Page from "../components/page";
import StatusTag from "../components/status-tag";
import { useAsync } from "../hooks/use-async";
import { useAuth } from "../hooks/use-auth";
import { disputeStatusTag } from "../lib/order-ui";
import { formatDate, formatRelative, shortRef } from "../utils/format";
import { fmtUsd } from "../utils/money";

const mono: React.CSSProperties = { fontFamily: "var(--font-mono)" };

const roleColor = {
	BUYER: "var(--color-neutral-600)",
	SELLER: "var(--warn)",
	ADMIN: "var(--color-accent)",
} as const;

function MessagePlate({
	role,
	name,
	time,
	children,
	delay = 0,
}: {
	role: keyof typeof roleColor;
	name: string;
	time?: string;
	children: React.ReactNode;
	delay?: number;
}) {
	return (
		<div
			style={{
				borderLeft: `2px solid ${roleColor[role]}`,
				background: role === "ADMIN" ? "var(--color-accent-100)" : "var(--color-neutral-100)",
				padding: "11px 14px",
				animation: `fadeUp .4s ease ${delay.toFixed(2)}s both`,
			}}
		>
			<div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", lineHeight: 1.4 }}>
				<span style={{ whiteSpace: "nowrap", flex: "none", ...mono, fontSize: 9.5, letterSpacing: "0.12em", color: roleColor[role] }}>
					{role}
				</span>
				<span style={{ whiteSpace: "nowrap", flex: "none", fontSize: 12.5, fontWeight: 600 }}>{name}</span>
				{time && (
					<span className="text-muted" style={{ whiteSpace: "nowrap", marginLeft: "auto", ...mono, fontSize: 10.5 }}>
						{time}
					</span>
				)}
			</div>
			<div style={{ fontSize: 13, lineHeight: 1.5, marginTop: 5 }}>{children}</div>
		</div>
	);
}

export default function Disputes() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { isAdmin } = useAuth();
	const [note, setNote] = useState("");
	const [busy, setBusy] = useState(false);

	const list = useAsync(() => disputesApi.mine(), []);
	const selectedId = id ?? list.data?.[0]?.id;
	const detail = useAsync<Dispute | undefined>(
		() => (selectedId ? disputesApi.get(selectedId) : Promise.resolve(undefined)),
		[selectedId]
	);

	const openCount = useMemo(() => (list.data ?? []).filter((d) => d.status === "OPEN").length, [list.data]);
	const dispute = detail.data;

	const resolve = async (winner: "BUYER" | "SELLER") => {
		if (!dispute) return;
		setBusy(true);
		try {
			await adminApi.resolveDispute(dispute.id, winner, note.trim() || undefined);
			toast.success(`Resolved for the ${winner.toLowerCase()}`);
			setNote("");
			detail.reload();
			list.reload();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not resolve");
		} finally {
			setBusy(false);
		}
	};

	return (
		<Page title="Disputes" sub="Admin-arbitrated · evidence + Telegram chat">
			<AsyncPanel
				loading={list.loading}
				error={list.error}
				isEmpty={(list.data ?? []).length === 0}
				emptyMessage="No disputes — that's a good thing"
			>
				<div style={{ display: "grid", gridTemplateColumns: "minmax(240px,320px) minmax(0,1fr)", gap: 22, alignItems: "start" }}>
					<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
						<div className="text-muted" style={{ ...mono, fontSize: 11, letterSpacing: "0.1em" }}>
							{list.data?.length ?? 0} DISPUTES · {openCount} OPEN
						</div>
						{(list.data ?? []).map((entry, index) => {
							const chip = disputeStatusTag(entry.status);
							const selected = entry.id === selectedId;
							return (
								<div
									key={entry.id}
									className="row-click"
									onClick={() => navigate(`/disputes/${entry.id}`)}
									style={{
										padding: "14px 16px",
										borderLeft: `3px solid ${selected ? "var(--color-accent)" : "var(--color-divider)"}`,
										background: selected ? "var(--color-neutral-100)" : "transparent",
										display: "flex",
										flexDirection: "column",
										gap: 8,
										transition: "background-color .15s ease, border-color .15s ease",
										animation: `fadeUp .4s ease ${(index * 0.06).toFixed(2)}s both`,
									}}
								>
									<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
										<StatusTag label={chip.label} color={chip.color} fontSize={10} />
										<span className="text-muted" style={{ marginLeft: "auto", ...mono, fontSize: 10 }}>
											{formatRelative(entry.createdAt).toUpperCase()}
										</span>
									</div>
									<div
										style={{
											fontSize: 13.5,
											fontWeight: 600,
											lineHeight: 1.4,
											display: "-webkit-box",
											WebkitLineClamp: 2,
											WebkitBoxOrient: "vertical",
											overflow: "hidden",
										}}
									>
										{entry.reason}
									</div>
									<div className="text-muted" style={{ display: "flex", gap: 7, ...mono, fontSize: 10, letterSpacing: "0.08em" }}>
										<span>{shortRef(entry.orderId)}</span>
										<span>·</span>
										<span>{fmtUsd(entry.order.amountUsd)} USDT</span>
									</div>
								</div>
							);
						})}
						<div className="card" style={{ padding: 14, gap: 6 }}>
							<h6 style={{ margin: 0 }}>How arbitration works</h6>
							<div className="text-muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
								Opening a dispute freezes the order's escrow — even after vesting. A Telegram group is
								created with the admins; buyer and seller join via invite link and post evidence there.
								The admin then resolves for one side and the winner withdraws the escrow.
							</div>
						</div>
					</div>

					<div className="card elev-sm" style={{ padding: 0, gap: 0 }}>
						{dispute ? (
							<>
								<div style={{ padding: "18px 20px", borderBottom: "2px solid var(--color-divider)" }}>
									<div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
										<StatusTag {...disputeStatusTag(dispute.status)} />
										<span
											className="text-muted row-click"
											onClick={() => navigate(`/orders/${dispute.orderId}`)}
											style={{ whiteSpace: "nowrap", flex: "none", ...mono, fontSize: 10.5, border: "1px solid var(--color-divider)", padding: "2px 8px" }}
										>
											{dispute.orderId}
										</span>
										<span className="text-muted" style={{ whiteSpace: "nowrap", ...mono, fontSize: 10, letterSpacing: "0.08em" }}>
											OPENED {formatDate(dispute.createdAt).toUpperCase()} · BY BUYER
										</span>
									</div>
									<h4 style={{ margin: "12px 0 0", fontSize: 19, lineHeight: 1.3 }}>{dispute.reason}</h4>
									<div className="text-muted" style={{ display: "flex", gap: 16, marginTop: 12, ...mono, fontSize: 9.5, letterSpacing: "0.1em" }}>
										<span style={{ display: "flex", alignItems: "center", gap: 5 }}>
											<span style={{ width: 8, height: 8, background: roleColor.BUYER }} />
											BUYER
										</span>
										<span style={{ display: "flex", alignItems: "center", gap: 5 }}>
											<span style={{ width: 8, height: 8, background: roleColor.SELLER }} />
											SELLER
										</span>
										<span style={{ display: "flex", alignItems: "center", gap: 5 }}>
											<span style={{ width: 8, height: 8, background: roleColor.ADMIN }} />
											ADMIN ARBITRATOR
										</span>
									</div>
								</div>

								<div style={{ maxHeight: 400, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
									<MessagePlate role="BUYER" name="Dispute opened" time={formatDate(dispute.createdAt)} delay={0}>
										{dispute.reason}
										<div
											style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, border: "1px solid var(--color-divider)", padding: "4px 8px" }}
										>
											<PaperclipIcon size={12} />
											<span style={{ ...mono, fontSize: 11 }}>
												{fmtUsd(dispute.order.sellerAmountUsd)} USDT frozen in escrow
											</span>
										</div>
									</MessagePlate>

									<MessagePlate role="ADMIN" name="Kolo Arbitration" delay={0.07}>
										{dispute.telegramInviteLink
											? "A private Telegram group was opened for this dispute. Post your evidence and replies there — the admins moderate it and both parties can join with the invite link below."
											: "The dispute is registered and the escrow is frozen. The Telegram evidence group is still being created — check back shortly."}
									</MessagePlate>

									{dispute.status !== "OPEN" && (
										<div
											style={{ borderLeft: "3px solid var(--color-accent)", background: "var(--color-accent-100)", padding: "12px 14px", animation: "fadeUp .4s ease .3s both" }}
										>
											<div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.12em", color: "var(--color-accent)" }}>
												ADMIN DECISION · FINAL{dispute.resolvedAt ? ` · ${formatDate(dispute.resolvedAt).toUpperCase()}` : ""}
											</div>
											<div style={{ fontSize: 13, lineHeight: 1.5, marginTop: 5, color: "var(--color-accent-800)" }}>
												{dispute.resolutionNote ??
													(dispute.status === "RESOLVED_BUYER"
														? `Resolved in the buyer's favour · ${fmtUsd(dispute.order.sellerAmountUsd)} USDT refunded from escrow, withdrawable by the buyer immediately.`
														: "Resolved in the seller's favour · escrow returns to the normal vesting schedule.")}
											</div>
										</div>
									)}

									{isAdmin && dispute.status === "OPEN" && (
										<div className="card elev-sm" style={{ padding: 14, gap: 10 }}>
											<h6 style={{ margin: 0 }}>Resolve · admin only</h6>
											<input
												className="input"
												value={note}
												onChange={(e) => setNote(e.target.value)}
												placeholder="Resolution note (optional, shown to both parties)"
											/>
											<div style={{ display: "flex", gap: 8 }}>
												<button className="btn btn-primary" disabled={busy} onClick={() => resolve("BUYER")}>
													Buyer wins · refund
												</button>
												<button className="btn btn-secondary" disabled={busy} onClick={() => resolve("SELLER")}>
													Seller wins · release
												</button>
											</div>
										</div>
									)}
								</div>

								<div style={{ display: "flex", gap: 8, padding: "14px 18px", borderTop: "2px solid var(--color-divider)", alignItems: "center" }}>
									{dispute.telegramInviteLink ? (
										<>
											<a
												className="btn btn-primary"
												style={{ whiteSpace: "nowrap" }}
												href={dispute.telegramInviteLink}
												target="_blank"
												rel="noreferrer"
											>
												<SendIcon size={14} />
												Join dispute chat on Telegram
											</a>
											<span className="text-muted" style={{ fontSize: 11 }}>
												Evidence, replies and the admin's questions all happen in the group.
											</span>
										</>
									) : (
										<span className="text-muted" style={{ fontSize: 11 }}>
											Telegram group not available yet — the escrow is frozen regardless, and an admin
											will follow up here.
										</span>
									)}
								</div>
							</>
						) : (
							<div style={{ padding: 40 }}>
								<AsyncPanel loading={detail.loading} error={detail.error} isEmpty emptyMessage="Select a dispute">
									<span />
								</AsyncPanel>
							</div>
						)}
					</div>
				</div>
			</AsyncPanel>
		</Page>
	);
}
