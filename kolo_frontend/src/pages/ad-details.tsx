import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { listingsApi, ordersApi } from "../api";
import AsyncPanel from "../components/async-panel";
import BlockAvatar from "../components/block-avatar";
import { ArrowLeftIcon, CheckIcon, LockIcon, PauseIcon, PlayIcon, TrashIcon } from "../components/icons";
import Page from "../components/page";
import { useAsync } from "../hooks/use-async";
import { useAuth } from "../hooks/use-auth";
import { formatDate } from "../utils/format";
import { fmtUsd, usd } from "../utils/money";
import { feeLabel, previewFee, usePlatformConfig } from "../hooks/use-platform-config";
import type { PlatformConfig } from "../api";

const mono: React.CSSProperties = { fontFamily: "var(--font-mono)" };

// Both lists quote platform rules, so they are built from the config rather
// than written out — a changed env must never leave stale copy on the page.
const guarantees = (platform: PlatformConfig | undefined) => [
	"Funds held in Kolo escrow",
	"Admin arbitration on disputes",
	"Delivery unlocks after payment",
	"Pay in 100+ crypto assets",
	`${feeLabel(platform)} flat platform fee`,
	platform ? `${platform.disputeWindowDays}-day dispute window` : "Dispute window",
];

const escrowFlow = (platform: PlatformConfig | undefined) => [
	"Pay in any crypto · funds lock in Kolo escrow",
	"Delivery details unlock instantly on the order",
	platform
		? `You confirm · or open a dispute within ${platform.disputeWindowDays} days`
		: "You confirm · or open a dispute",
	platform
		? `Funds vest ${platform.vestingDays} days, then release to the seller`
		: "Funds vest, then release to the seller",
];

export default function AdDetails() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const platform = usePlatformConfig();
	const { user } = useAuth();
	const [imageFailed, setImageFailed] = useState(false);
	const [coverDraft, setCoverDraft] = useState<string>();
	const [busy, setBusy] = useState(false);

	const { data: ad, loading, error, reload } = useAsync(
		() => (id ? listingsApi.get(id) : Promise.reject(new Error("Missing listing id"))),
		[id]
	);
	const { data: catalogue } = useAsync(() => listingsApi.list({ limit: 100 }), []);

	const moreFromSeller = useMemo(
		() =>
			(catalogue?.items ?? [])
				.filter((l) => l.sellerId === ad?.sellerId && l.id !== ad?.id)
				.slice(0, 3),
		[catalogue, ad]
	);

	const isOwnAd = !!user && user.id === ad?.sellerId;
	const price = usd(ad?.priceUsd ?? 0);
	const fee = previewFee(platform, price);

	const handleOrder = async () => {
		if (!ad) return;
		setBusy(true);
		try {
			const created = await ordersApi.create(ad.id);
			toast.success("Order created — invoice ready");
			navigate(`/orders/${created.order.id}`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not create the order");
		} finally {
			setBusy(false);
		}
	};

	const handleToggleStatus = async () => {
		if (!ad) return;
		setBusy(true);
		try {
			await listingsApi.update(ad.id, { status: ad.status === "ACTIVE" ? "PAUSED" : "ACTIVE" });
			toast.success(ad.status === "ACTIVE" ? "Listing paused" : "Listing is live again");
			reload();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Update failed");
		} finally {
			setBusy(false);
		}
	};

	/** Cover art is the one listing field editable in place — sellers swap the URL. */
	const handleSaveCover = async () => {
		if (!ad || coverDraft === undefined) return;
		setBusy(true);
		try {
			await listingsApi.update(ad.id, { imageUrl: coverDraft.trim() });
			toast.success(coverDraft.trim() ? "Cover image updated" : "Cover image removed");
			setCoverDraft(undefined);
			setImageFailed(false);
			reload();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Update failed");
		} finally {
			setBusy(false);
		}
	};

	const handleDelete = async () => {
		if (!ad || !window.confirm("Delete this listing? Buyers will no longer see it.")) return;
		setBusy(true);
		try {
			await listingsApi.remove(ad.id);
			toast.success("Listing deleted");
			navigate("/ads");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Delete failed");
			setBusy(false);
		}
	};

	return (
		<Page title="Service" sub="Subscription services · escrow protected · any crypto">
			<div>
				<button
					className="btn btn-ghost"
					onClick={() => navigate("/ads")}
					style={{ marginLeft: -6, whiteSpace: "nowrap" }}
				>
					<ArrowLeftIcon size={14} />
					Back to marketplace
				</button>
			</div>

			<AsyncPanel loading={loading} error={error} isEmpty={!ad} emptyMessage="Listing not found">
				{ad && (
					<div className="layout-detail">
						<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
							{/* Cover art, when the seller supplied a URL that actually loads. */}
							{ad.imageUrl && !imageFailed && (
								<img
									src={ad.imageUrl}
									alt=""
									onError={() => setImageFailed(true)}
									style={{
										width: "100%",
										maxHeight: 320,
										objectFit: "cover",
										border: "1px solid var(--color-divider)",
										animation: "fadeUp .45s ease both",
									}}
								/>
							)}
							<div>
								<div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.14em", color: "var(--color-accent)" }}>
									{(ad.category ?? "SERVICE").toUpperCase()} · LISTED {formatDate(ad.createdAt).toUpperCase()}
								</div>
								<h2 style={{ fontSize: 27, margin: "6px 0 10px" }}>{ad.title}</h2>
								<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
									<BlockAvatar name={ad.seller.username} imageUrl={ad.seller.imageUrl} size={24} fontSize={11} />
									<span style={{ fontSize: 14, fontWeight: 600 }}>{ad.seller.username ?? "Seller"}</span>
									{ad.status !== "ACTIVE" && (
										<span
											className="tag tag-status"
											style={{ background: "var(--warn)", fontSize: 10.5 }}
										>
											{ad.status === "PAUSED" ? "Paused" : ad.status}
										</span>
									)}
									<span className="text-muted" style={{ fontSize: 13 }}>
										· escrow protected · admin arbitration
									</span>
								</div>
							</div>

							<div>
								<h6 style={{ marginBottom: 8 }}>What you get</h6>
								{ad.description.split(/\n{2,}/).map((paragraph, i, all) => (
									<p
										key={i}
										style={{ fontSize: 15, maxWidth: "64ch", marginBottom: i === all.length - 1 ? 0 : undefined }}
									>
										{paragraph}
									</p>
								))}
							</div>

							<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "8px 24px", maxWidth: 640 }}>
								{guarantees(platform).map((item) => (
									<div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
										<CheckIcon size={14} strokeWidth={2.5} style={{ color: "var(--color-accent)", flex: "none" }} />
										{item}
									</div>
								))}
							</div>

							{moreFromSeller.length > 0 && (
								<>
									<div style={{ height: 2, background: "var(--color-divider)" }} />
									<div>
										<h6 style={{ marginBottom: 10 }}>More from this seller</h6>
										<div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 640 }}>
											{moreFromSeller.map((l) => (
												<div
													key={l.id}
													className="row-click"
													onClick={() => navigate(`/ads/${l.id}`)}
													style={{ borderLeft: "2px solid var(--color-divider)", padding: "2px 0 2px 14px" }}
												>
													<div style={{ fontSize: 14, fontWeight: 600 }}>{l.title}</div>
													<div className="text-muted" style={{ ...mono, fontSize: 12 }}>
														{fmtUsd(l.priceUsd)} USDT · {(l.category ?? "service").toLowerCase()} · listed{" "}
														{formatDate(l.createdAt)}
													</div>
												</div>
											))}
										</div>
									</div>
								</>
							)}
						</div>

						<div
							className="card elev-md"
							style={{ position: "sticky", top: 0, padding: 18, gap: 14, animation: "fadeUp .45s ease .1s both" }}
						>
							<div>
								<span style={{ ...mono, fontSize: 28, fontWeight: 600 }}>{fmtUsd(ad.priceUsd)}</span>
								<span className="text-muted" style={{ fontSize: 13 }}>
									{" "}
									USDT · any crypto
								</span>
							</div>
							<div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
								<div style={{ display: "flex", justifyContent: "space-between" }}>
									<span className="text-muted">Category</span>
									<span style={mono}>{ad.category ?? "Service"}</span>
								</div>
								<div style={{ display: "flex", justifyContent: "space-between" }}>
									<span className="text-muted">Delivery</span>
									<span style={mono}>After payment confirms</span>
								</div>
								<div style={{ display: "flex", justifyContent: "space-between" }}>
									<span className="text-muted">Kolo fee ({feeLabel(platform)})</span>
									<span style={mono}>{fmtUsd(fee)} USDT</span>
								</div>
								<div style={{ display: "flex", justifyContent: "space-between" }}>
									<span className="text-muted">Seller receives</span>
									<span style={mono}>{fmtUsd(price - fee)} USDT</span>
								</div>
								<div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
									<span className="text-muted">Seller accepts</span>
									<span style={{ ...mono, fontSize: 12, textAlign: "right" }}>100+ assets via OxaPay</span>
								</div>
							</div>
							<div style={{ height: 2, background: "var(--color-divider)" }} />
							<div>
								<h6 style={{ marginBottom: 10 }}>Escrow flow</h6>
								<div style={{ display: "flex", flexDirection: "column" }}>
									{escrowFlow(platform).map((step, i) => (
										<div key={step} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
											<span
												style={{
													width: 8,
													height: 8,
													flex: "none",
													marginTop: 4,
													...(i === escrowFlow(platform).length - 1
														? { border: "1.5px solid var(--color-accent)" }
														: { background: "var(--color-accent)" }),
												}}
											/>
											<span style={{ fontSize: 13, paddingBottom: i === escrowFlow(platform).length - 1 ? 0 : 10 }}>
												{step}
											</span>
										</div>
									))}
								</div>
							</div>
							{isOwnAd ? (
								<>
									<div className="text-muted" style={{ fontSize: 13 }}>
										This is your listing — buyers see it {ad.status === "ACTIVE" ? "right now" : "only once you re-activate it"}.
									</div>
									<div className="field">
										<label htmlFor="ad-cover">Cover image URL</label>
										<input
											id="ad-cover"
											className="input"
											style={{ ...mono, fontSize: 12 }}
											type="url"
											value={coverDraft ?? ad.imageUrl ?? ""}
											onChange={(e) => setCoverDraft(e.target.value)}
											placeholder="https://example.com/cover.jpg"
										/>
										{coverDraft !== undefined && coverDraft !== (ad.imageUrl ?? "") && (
											<button
												className="btn btn-secondary btn-block"
												style={{ marginTop: 8 }}
												onClick={handleSaveCover}
												disabled={busy}
											>
												<CheckIcon size={14} />
												Save cover image
											</button>
										)}
									</div>
									<button className="btn btn-secondary btn-block" onClick={handleToggleStatus} disabled={busy}>
										{ad.status === "ACTIVE" ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
										{ad.status === "ACTIVE" ? "Pause listing" : "Activate listing"}
									</button>
									<button
										className="btn btn-secondary btn-block"
										onClick={handleDelete}
										disabled={busy}
										style={{ color: "var(--bad)", borderColor: "var(--bad)" }}
									>
										<TrashIcon size={14} />
										Delete listing
									</button>
								</>
							) : (
								<button className="btn btn-primary btn-block" onClick={handleOrder} disabled={busy || ad.status !== "ACTIVE"}>
									{busy ? "Creating order…" : `Order · ${fmtUsd(ad.priceUsd)} USDT · any crypto`}
								</button>
							)}
							<div className="text-muted" style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12 }}>
								<LockIcon size={13} style={{ flex: "none", marginTop: 1 }} />
								<span>Held by Kolo escrow through the vesting period. Admin arbitration if anything goes wrong.</span>
							</div>
						</div>
					</div>
				)}
			</AsyncPanel>
		</Page>
	);
}
