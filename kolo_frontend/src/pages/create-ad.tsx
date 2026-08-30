import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { listingsApi } from "../api";
import { ArrowLeftIcon, ShieldCheckIcon } from "../components/icons";
import Page from "../components/page";
import { useAsync } from "../hooks/use-async";
import { FEE_PERCENT, fmtUsd } from "../utils/money";

const mono: React.CSSProperties = { fontFamily: "var(--font-mono)" };

const rowBetween: React.CSSProperties = {
	display: "flex",
	justifyContent: "space-between",
	fontSize: 14,
};

export default function CreateAd() {
	const navigate = useNavigate();
	const [title, setTitle] = useState("");
	const [category, setCategory] = useState("");
	const [price, setPrice] = useState("");
	const [description, setDescription] = useState("");
	const [deliveryInfo, setDeliveryInfo] = useState("");
	const [busy, setBusy] = useState(false);

	const { data: catalogue } = useAsync(() => listingsApi.list({ limit: 100 }), []);
	const knownCategories = useMemo(() => {
		const set = new Set(["Streaming", "VPN", "IPTV", "Software", "Gaming", "Music"]);
		for (const listing of catalogue?.items ?? []) {
			if (listing.category) set.add(listing.category);
		}
		return [...set].sort();
	}, [catalogue]);

	const priceNum = parseFloat(price) || 0;
	const fee = (priceNum * FEE_PERCENT) / 100;

	const submit = async (asDraft: boolean) => {
		if (title.trim().length < 3) return toast.error("Title needs at least 3 characters");
		if (description.trim().length < 10) return toast.error("Description needs at least 10 characters");
		if (!(priceNum > 0)) return toast.error("Set a price in USDT");

		setBusy(true);
		try {
			const listing = await listingsApi.create({
				title: title.trim(),
				description: description.trim(),
				category: category.trim() || undefined,
				priceUsd: Math.round(priceNum * 100) / 100,
				deliveryInfo: deliveryInfo.trim() || undefined,
			});
			if (asDraft) {
				await listingsApi.update(listing.id, { status: "PAUSED" });
				toast.success("Saved as draft — activate it when you're ready");
			} else {
				toast.success("Your ad is live");
			}
			navigate(`/ads/${listing.id}`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not save the listing");
			setBusy(false);
		}
	};

	return (
		<Page title="Post an ad" sub={`List a service · ${FEE_PERCENT}% fee · escrow protected`}>
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

			<div className="layout-form">
				<div className="card" style={{ padding: 18, gap: 14 }}>
					<h5 style={{ margin: 0 }}>Service details</h5>
					<div className="field">
						<label htmlFor="ad-title">Title</label>
						<input
							id="ad-title"
							className="input"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="e.g. Netflix Premium 4K · private slot, 12 months"
						/>
					</div>
					<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
						<div className="field">
							<label htmlFor="ad-category">Category</label>
							<input
								id="ad-category"
								className="input"
								list="ad-categories"
								value={category}
								onChange={(e) => setCategory(e.target.value)}
								placeholder="Streaming, VPN, Software…"
							/>
							<datalist id="ad-categories">
								{knownCategories.map((c) => (
									<option key={c} value={c} />
								))}
							</datalist>
						</div>
						<div className="field">
							<label htmlFor="ad-price">Price (USDT)</label>
							<input
								id="ad-price"
								className="input"
								style={mono}
								value={price}
								onChange={(e) => setPrice(e.target.value)}
								placeholder="0.00"
								inputMode="decimal"
							/>
						</div>
					</div>
					<div className="field">
						<label htmlFor="ad-description">Description</label>
						<textarea
							id="ad-description"
							className="input"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="What exactly does the buyer get, how is it delivered (invite, key, credentials), and what does the warranty cover…"
						/>
					</div>
					<div className="field">
						<label htmlFor="ad-delivery">
							Delivery info · revealed to the buyer only after payment confirms
						</label>
						<textarea
							id="ad-delivery"
							className="input"
							style={mono}
							value={deliveryInfo}
							onChange={(e) => setDeliveryInfo(e.target.value)}
							placeholder="Credentials, redeem codes or step-by-step instructions. Kept encrypted-at-rest and never shown before payment."
						/>
					</div>
					<div className="field">
						<label>Cover image · shown on your marketplace card</label>
						<div
							className="grid-plate"
							style={{
								height: 170,
								position: "relative",
								border: "1px solid var(--color-divider)",
								display: "grid",
								placeItems: "center",
							}}
						>
							<span className="text-muted" style={{ ...mono, fontSize: 10.5, letterSpacing: "0.12em" }}>
								SELLER ARTWORK · UPLOADS COMING SOON
							</span>
						</div>
					</div>
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
					<div className="card elev-md" style={{ padding: 18, gap: 10 }}>
						<h6 style={{ margin: 0 }}>Listing preview</h6>
						<div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 17, lineHeight: 1.3 }}>
							{title || "Your service title appears here"}
						</div>
						<div className="text-muted" style={{ ...mono, fontSize: 12, letterSpacing: "0.1em" }}>
							{(category || "CATEGORY").toUpperCase()} · ESCROW PROTECTED
						</div>
						<div style={{ ...mono, fontSize: 20, fontWeight: 600 }}>
							{fmtUsd(priceNum)}{" "}
							<span className="text-muted" style={{ fontSize: 12, fontWeight: 400 }}>
								USDT
							</span>
						</div>
						<div className="text-muted" style={{ ...mono, fontSize: 11, letterSpacing: "0.06em" }}>
							ACCEPTS: 100+ ASSETS VIA OXAPAY
						</div>
						<div style={{ height: 2, background: "var(--color-divider)", margin: "4px 0" }} />
						<h6 style={{ margin: 0 }}>Payout per sale</h6>
						<div style={rowBetween}>
							<span className="text-muted">Buyer pays</span>
							<span style={mono}>{fmtUsd(priceNum)} USDT</span>
						</div>
						<div style={rowBetween}>
							<span className="text-muted">Kolo fee ({FEE_PERCENT}%)</span>
							<span style={mono}>{fmtUsd(fee)} USDT</span>
						</div>
						<div style={rowBetween}>
							<span className="text-muted">You receive</span>
							<span style={{ ...mono, color: "var(--ok)" }}>{fmtUsd(priceNum - fee)} USDT</span>
						</div>
						<div style={rowBetween}>
							<span className="text-muted">Vesting per order</span>
							<span style={mono}>30 days</span>
						</div>
					</div>

					<div className="card" style={{ padding: 18, gap: 12 }}>
						<button className="btn btn-primary btn-block" onClick={() => submit(false)} disabled={busy}>
							{busy ? "Publishing…" : "Publish ad"}
						</button>
						<button className="btn btn-secondary btn-block" onClick={() => submit(true)} disabled={busy}>
							Save as draft
						</button>
						<div className="text-muted" style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12 }}>
							<ShieldCheckIcon size={13} style={{ flex: "none", marginTop: 1 }} />
							<span>
								Drafts stay paused and invisible to buyers until you activate them. Earnings from every
								sale vest 30 days in escrow before payout.
							</span>
						</div>
					</div>
				</div>
			</div>
		</Page>
	);
}
