import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { listingsApi, productsApi } from "../api";
import AsyncPanel from "../components/async-panel";
import ListingCover from "../components/listing-cover";
import { ArrowLeftIcon, ShieldCheckIcon } from "../components/icons";
import Page from "../components/page";
import ProductPicker from "../components/product-picker";
import { findProduct } from "../lib/listing-ui";
import { useAsync } from "../hooks/use-async";
import { money, savedPercent, usd } from "../utils/money";
import { feeLabel, previewFee, usePlatformConfig } from "../hooks/use-platform-config";

const rowBetween: React.CSSProperties = {
	display: "flex",
	justifyContent: "space-between",
	gap: 12,
	fontSize: 15,
};

/**
 * One form, two modes. `/ads/new` creates; `/ads/:id/edit` updates an existing
 * listing through PATCH /listings/:id, which accepts every field below except
 * the product — that one is fixed the moment the listing is created.
 */
export default function CreateAd() {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const isEdit = !!id;
	const platform = usePlatformConfig();
	const [productId, setProductId] = useState("");
	const [price, setPrice] = useState("");
	const [quantity, setQuantity] = useState("1");
	const [description, setDescription] = useState("");
	const [deliveryInfo, setDeliveryInfo] = useState("");
	const [imageUrl, setImageUrl] = useState("");
	const [imageFailed, setImageFailed] = useState(false);
	const [busy, setBusy] = useState(false);
	// Field-level validation messages, keyed by field. Set on submit, cleared
	// the moment the offending field changes — the error never outlives the fix.
	const [errors, setErrors] = useState<Record<string, string>>({});

	const productsQ = useAsync(() => productsApi.list(), []);
	const products = productsQ.data;
	const existingQ = useAsync(
		() => (id ? listingsApi.get(id) : Promise.resolve(undefined)),
		[id]
	);
	const existing = existingQ.data;

	// Prefill once the listing arrives, adjusting state during render rather than
	// from an effect — React re-runs the render before committing, so the form is
	// never painted empty. deliveryInfo is deliberately absent from every listing
	// response, so it stays blank and is only sent when the seller retypes it.
	const [prefilledId, setPrefilledId] = useState<string>();
	if (existing && existing.id !== prefilledId) {
		setPrefilledId(existing.id);
		setProductId(existing.productId);
		setPrice(existing.priceUsd);
		setQuantity(String(existing.quantity));
		setDescription(existing.description);
		setImageUrl(existing.imageUrl ?? "");
		setImageFailed(false);
	}

	// On create the catalogue is the source of truth; on edit the listing already
	// carries its own (immutable) product, so that one wins.
	const product = existing?.product ?? findProduct(products, productId);
	const priceNum = parseFloat(price) || 0;
	const quantityNum = parseInt(quantity, 10) || 0;
	const soldCount = existing?.soldCount ?? 0;
	const heldUnits = existing
		? Math.max(existing.quantity - existing.soldCount - existing.availableCount, 0)
		: 0;
	const fee = previewFee(platform, priceNum);
	const retail = product ? usd(product.retailPriceUsd) : 0;
	const discount = product ? savedPercent(priceNum, product.retailPriceUsd) : null;

	/** The cover stays empty unless the seller pastes a photo — the card then shows the brand mark. */
	const pickProduct = (next: string) => setProductId(next);

	const clearError = (key: string) =>
		setErrors((current) => (current[key] ? { ...current, [key]: "" } : current));

	const submit = async (asDraft: boolean) => {
		// Inline, next to the field that failed — a toast names the problem but
		// not the place. The backend still has the last word on the real rules.
		const found: Record<string, string> = {};
		if (!isEdit && !productId) found.product = "Pick what you're selling first.";
		if (description.trim().length < 10) found.description = "Describe it in at least 10 characters.";
		if (!(priceNum > 0)) found.price = "Set a price.";
		if (!(quantityNum >= 1)) found.quantity = "You need at least one to sell.";
		else if (quantityNum < soldCount + heldUnits) {
			found.quantity = `${soldCount + heldUnits} of these are already sold or being paid for. The number can't go below that.`;
		}
		setErrors(found);
		const first = ["product", "price", "quantity", "description"].find((key) => found[key]);
		if (first) {
			document.getElementById(`ad-${first}`)?.focus();
			return;
		}

		setBusy(true);
		const common = {
			description: description.trim(),
			imageUrl: imageUrl.trim() || undefined,
			priceUsd: Math.round(priceNum * 100) / 100,
			quantity: quantityNum,
			// Omitted when blank, and an omitted field leaves the stored value alone.
			deliveryInfo: deliveryInfo.trim() || undefined,
		};

		try {
			if (id) {
				await listingsApi.update(id, {
					...common,
					status: asDraft ? "PAUSED" : "ACTIVE",
				});
				toast.success(asDraft ? "Saved and paused" : "Listing updated");
				navigate(`/ads/${id}`);
				return;
			}

			const listing = await listingsApi.create({ ...common, productId });
			if (asDraft) {
				await listingsApi.update(listing.id, { status: "PAUSED" });
				toast.success("Saved as a draft. Make it live whenever you're ready");
			} else {
				toast.success("Your listing is live");
			}
			navigate(`/ads/${listing.id}`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Could not save the listing");
			setBusy(false);
		}
	};

	return (
		<Page
			title={isEdit ? "Edit your listing" : "Sell a subscription"}
			sub={
				isEdit
					? "Change the details buyers see. Your access note stays private until someone pays."
					: `List what you're selling. Buyers pay up front, you keep ${100 - (platform?.feePercent ?? 0)}% once it clears.`
			}
		>
			<div>
				<button
					className="btn btn-ghost"
					onClick={() => navigate("/ads")}
					style={{ marginLeft: -10, whiteSpace: "nowrap" }}
				>
					<ArrowLeftIcon size={15} />
					Back to browsing
				</button>
			</div>

			{/* On edit the form is prefilled from the listing — a failed or slow
			    fetch must not paint a half-empty create form instead. */}
			<AsyncPanel
				loading={isEdit && existingQ.loading}
				error={isEdit ? existingQ.error : undefined}
				onRetry={existingQ.reload}
				skeletonRows={4}
			>
			<div className="layout-form">
				<div className="card" style={{ padding: 20, gap: 18 }}>
					<h2 className="section-head">What are you selling?</h2>
					{isEdit ? (
						/* The product is fixed at creation, so on edit it is shown, not offered. */
						<div className="field">
							<label htmlFor="ad-product">Subscription</label>
							<input
								id="ad-product"
								className="input"
								value={product ? `${product.name} · ${product.category}` : "-"}
								disabled
							/>
							<span className="text-muted" style={{ fontSize: 13 }}>
								This can't be changed. List it separately if you want to sell something else.
							</span>
						</div>
					) : (
						<ProductPicker
							id="ad-product"
							label="Subscription"
							products={products}
							value={productId}
							onChange={(next) => {
								clearError("product");
								pickProduct(next);
							}}
							hint="Buyers browse by product, so your listing sits next to every other offer for it."
							error={errors.product || undefined}
							loadError={productsQ.error ? "The catalogue didn't load." : undefined}
							onRetryLoad={productsQ.reload}
						/>
					)}
					<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
						<div className="field">
							<label htmlFor="ad-price">Price</label>
							<input
								id="ad-price"
								className="input"
								style={{ borderColor: errors.price ? "var(--error)" : undefined }}
								aria-invalid={errors.price ? true : undefined}
								value={price}
								onChange={(e) => {
									clearError("price");
									setPrice(e.target.value);
								}}
								placeholder="0.00"
								inputMode="decimal"
							/>
							{errors.price ? (
								<span role="alert" style={{ fontSize: 13, color: "var(--error)" }}>
									{errors.price}
								</span>
							) : (
								<span className="text-muted" style={{ fontSize: 13 }}>
									{product
										? discount !== null
											? `${discount}% under the ${money(retail)} regular price`
											: `The regular price is ${money(retail)}. Go under it to stand out`
										: "Pick a subscription to see the regular price"}
								</span>
							)}
						</div>
						<div className="field">
							<label htmlFor="ad-quantity">How many can you sell?</label>
							<input
								id="ad-quantity"
								className="input"
								style={{ borderColor: errors.quantity ? "var(--error)" : undefined }}
								aria-invalid={errors.quantity ? true : undefined}
								value={quantity}
								onChange={(e) => {
									clearError("quantity");
									setQuantity(e.target.value.replace(/[^0-9]/g, ""));
								}}
								placeholder="1"
								inputMode="numeric"
							/>
							{errors.quantity ? (
								<span role="alert" style={{ fontSize: 13, color: "var(--error)" }}>
									{errors.quantity}
								</span>
							) : (
								<span className="text-muted" style={{ fontSize: 13 }}>
									{soldCount + heldUnits > 0
										? `${soldCount} sold${heldUnits > 0 ? `, ${heldUnits} being paid for` : ""} · ${Math.max(quantityNum - soldCount, 0)} left after this change`
										: "It leaves the marketplace once they're all sold"}
								</span>
							)}
						</div>
					</div>
					<div className="field">
						<label htmlFor="ad-description">Description</label>
						<textarea
							id="ad-description"
							className="input"
							style={{ borderColor: errors.description ? "var(--error)" : undefined }}
							aria-invalid={errors.description ? true : undefined}
							value={description}
							onChange={(e) => {
								clearError("description");
								setDescription(e.target.value);
							}}
							placeholder="What exactly does the buyer get, how do you hand it over (invite, key, login), and what's covered if something stops working?"
						/>
						{errors.description && (
							<span role="alert" style={{ fontSize: 13, color: "var(--error)" }}>
								{errors.description}
							</span>
						)}
					</div>
					<div className="field">
						<label htmlFor="ad-delivery">
							Access details, shown to the buyer only after they pay
							{isEdit ? " · leave blank to keep what's saved" : ""}
						</label>
						<textarea
							id="ad-delivery"
							className="input"
							value={deliveryInfo}
							onChange={(e) => setDeliveryInfo(e.target.value)}
							placeholder="Logins, redeem codes or step-by-step instructions. Never shown before payment."
						/>
					</div>
					<div className="field">
						<label htmlFor="ad-image">Cover photo link, shown on your card</label>
						<input
							id="ad-image"
							className="input"
							type="url"
							value={imageUrl}
							onChange={(e) => {
								setImageUrl(e.target.value);
								setImageFailed(false);
							}}
							placeholder="Optional, the brand logo is used without one"
						/>
						<div
							className="grid-plate"
							style={{
								/* The plate is a preview, not the form — on a phone it gives
								   back the height rather than pushing the fields off screen. */
								height: "clamp(150px, 42vw, 190px)",
								marginTop: 10,
								borderRadius: "var(--r-card)",
								display: "grid",
								placeItems: "center",
								overflow: "hidden",
							}}
						>
							{/* Live preview doubles as the URL check — a link that cannot
							    load here will not load on the marketplace either. */}
							{imageUrl.trim() && !imageFailed ? (
								<img
									src={imageUrl.trim()}
									alt=""
									onError={() => setImageFailed(true)}
									style={{ width: "100%", height: "100%", objectFit: "cover" }}
								/>
							) : !imageUrl.trim() && product?.imageUrl ? (
								<ListingCover
									listing={{ imageUrl: null, product }}
									style={{ width: "100%", height: "100%" }}
								/>
							) : (
								<span className="text-muted" style={{ fontSize: 14 }}>
									{imageFailed ? "That link didn't load" : "Paste a photo link to preview it"}
								</span>
							)}
						</div>
					</div>
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
					<div className="card elev-md" style={{ padding: 20, gap: 12 }}>
						<h2 className="section-head">How buyers will see it</h2>
						<div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>
							{product?.name ?? "Pick a subscription to preview it"}
						</div>
						<div className="text-muted" style={{ fontSize: 14 }}>
							{product?.category ?? "Category"}
						</div>
						<div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
							<span style={{ fontSize: 18, fontWeight: 600 }}>{money(priceNum)}</span>
							{discount !== null && (
								<>
									<span className="price-was" style={{ fontSize: 14 }}>
										{money(retail)}
									</span>
									<span className="save-badge">Save {discount}%</span>
								</>
							)}
						</div>

						<div style={{ height: 1, background: "var(--hairline-soft)", margin: "6px 0" }} />

						<h2 className="section-head">What you'll get per sale</h2>
						<div style={rowBetween}>
							<span className="text-muted">Buyer pays</span>
							<span>{money(priceNum)}</span>
						</div>
						<div style={rowBetween}>
							<span className="text-muted">Service fee ({feeLabel(platform)})</span>
							<span>{money(fee)}</span>
						</div>
						<div style={rowBetween}>
							<span className="text-muted">You receive</span>
							<span style={{ fontWeight: 600 }}>{money(priceNum - fee)}</span>
						</div>
						<div style={rowBetween}>
							<span className="text-muted">Clearing period</span>
							<span>{platform ? `${platform.vestingDays} days` : "-"}</span>
						</div>
					</div>

					<div className="card" style={{ padding: 20, gap: 12 }}>
						<button className="btn btn-primary btn-block" onClick={() => submit(false)} disabled={busy}>
							{busy ? "Saving…" : isEdit ? "Save changes" : "Publish listing"}
						</button>
						<button className="btn btn-secondary btn-block" onClick={() => submit(true)} disabled={busy}>
							{isEdit ? "Save and pause" : "Save as draft"}
						</button>
						<div
							className="text-muted"
							style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14 }}
						>
							<ShieldCheckIcon size={15} style={{ flex: "none", marginTop: 2 }} />
							<span>
								Drafts stay hidden until you make them live. Money from each sale clears for{" "}
								{platform?.vestingDays ?? "-"} days before you can withdraw it. That's what backs
								Buyer Protection.
							</span>
						</div>
					</div>
				</div>
			</div>
			</AsyncPanel>
		</Page>
	);
}
