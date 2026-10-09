import { useState } from "react";
import { Link } from "react-router-dom";
import { listingsApi, type ListingRow, type ListingSort, type Page as Paged } from "../api";
import AsyncPanel from "../components/async-panel";
import ListingCard from "../components/listing-card";
import Page from "../components/page";
import Pagination from "../components/pagination";
import { LockIcon, MessageIcon, SearchIcon, ShieldCheckIcon } from "../components/icons";
import { useAsync } from "../hooks/use-async";
import { useListControls } from "../hooks/use-list-controls";
import { money } from "../utils/money";

type Scope = "all" | "mine";
type PriceBand = "any" | "under25" | "25to75" | "over75";

/** Bands map to the API's minPrice / maxPrice — the filtering happens in SQL. */
const PRICE_BANDS: Record<PriceBand, { minPrice?: number; maxPrice?: number }> = {
	any: {},
	under25: { maxPrice: 24.99 },
	"25to75": { minPrice: 25, maxPrice: 75 },
	over75: { minPrice: 75.01 },
};

const SORT_OPTIONS: { value: ListingSort; label: string }[] = [
	{ value: "newest", label: "Newest first" },
	{ value: "oldest", label: "Oldest first" },
	{ value: "price_asc", label: "Price: low to high" },
	{ value: "price_desc", label: "Price: high to low" },
];

const PROMISES = [
	{
		icon: <ShieldCheckIcon size={18} />,
		title: "Buyer Protection on every order",
		body: "If what you get isn't what was described, you get your money back.",
	},
	{
		icon: <LockIcon size={18} />,
		title: "Your payment is held safely",
		body: "The seller is only paid out after you've had time to check your order.",
	},
	{
		icon: <MessageIcon size={18} />,
		title: "Help from a real person",
		body: "Something off? Open a request and we'll sort it out with the seller.",
	},
];

export default function Ads() {
	const controls = useListControls(20);
	const { search, page, limit } = controls;
	const [category, setCategoryValue] = useState("");
	const [priceBand, setPriceBandValue] = useState<PriceBand>("any");
	const [sort, setSortValue] = useState<ListingSort>("newest");
	const [scope, setScopeValue] = useState<Scope>("all");

	// Catalogue headline numbers and the category list are counted in the
	// database — never averaged from whatever page happens to be on screen.
	const { data: stats } = useAsync(() => listingsApi.stats(), []);

	const query = {
		search: search || undefined,
		category: category || undefined,
		...PRICE_BANDS[priceBand],
		sort,
		page,
		limit,
	};

	// Both feeds render the same card; only `mine` carries the held units.
	const listing = useAsync<Paged<ListingRow>>(
		() => (scope === "all" ? listingsApi.list(query) : listingsApi.mine(query)),
		[scope, search, category, priceBand, sort, page, limit]
	);

	const items = listing.data?.items ?? [];

	// Every filter change restarts at page 1.
	const setCategory = (value: string) => {
		setCategoryValue(value);
		controls.setPage(1);
	};
	const setPriceBand = (value: PriceBand) => {
		setPriceBandValue(value);
		controls.setPage(1);
	};
	const setSort = (value: ListingSort) => {
		setSortValue(value);
		controls.setPage(1);
	};
	const setScope = (value: Scope) => {
		setScopeValue(value);
		controls.setPage(1);
	};

	return (
		<Page
			title="Subscriptions, below retail"
			sub="Buy a subscription from a seller you can hold to account. Your payment is protected until you've checked it."
		>
			{/* `filter-bar` is doing the responsive work here, not the layout: on a
			    phone it stacks the search pill above the scope toggle and gives
			    both the full width instead of letting them wrap unevenly. */}
			<form
				className="filter-bar"
				style={{ gap: 12 }}
				onSubmit={(e) => e.preventDefault()}
			>
				<div className="searchbar">
					<input
						placeholder="Search streaming, VPNs, software…"
						value={controls.searchInput}
						onChange={(e) => controls.setSearchInput(e.target.value)}
						aria-label="Search subscriptions"
					/>
					<button type="submit" aria-label="Search">
						<SearchIcon size={17} />
					</button>
				</div>
				<div className="seg" style={{ flex: "none" }}>
					<label className="seg-opt">
						<input type="radio" name="mktf" checked={scope === "all"} onChange={() => setScope("all")} />
						Everything
					</label>
					<label className="seg-opt">
						<input type="radio" name="mktf" checked={scope === "mine"} onChange={() => setScope("mine")} />
						My listings
					</label>
				</div>
			</form>

			<div className="chip-row">
				<button
					type="button"
					className={`chip${category === "" ? " active" : ""}`}
					onClick={() => setCategory("")}
				>
					All categories
				</button>
				{(stats?.categories ?? []).map((c) => (
					<button
						key={c}
						type="button"
						className={`chip${category === c ? " active" : ""}`}
						onClick={() => setCategory(category === c ? "" : c)}
					>
						{c}
					</button>
				))}
			</div>

			{/* The two selects keep their desktop width as a flex *basis* and stay
			    shrinkable, so on a tablet the row narrows them instead of growing
			    past the page; below 744px `filter-bar` stacks them full-width. */}
			<div className="filter-bar">
				<span className="text-muted" style={{ fontSize: 14, minWidth: 0 }}>
					{/* No count until there is one — a literal "0 subscriptions" that
					    jumps to the real total a beat later reads as a glitch. */}
					{listing.data
						? `${listing.data.total} ${listing.data.total === 1 ? "subscription" : "subscriptions"}`
						: "Counting subscriptions…"}
					{stats ? ` · median ${money(stats.medianPriceUsd)}` : ""}
				</span>
				<select
					className="input"
					style={{ width: 170, flex: "0 1 auto", minWidth: 0, marginLeft: "auto", minHeight: 44 }}
					value={priceBand}
					onChange={(e) => setPriceBand(e.target.value as PriceBand)}
					aria-label="Filter by price"
				>
					<option value="any">Any price</option>
					<option value="under25">Under $25</option>
					<option value="25to75">$25 - $75</option>
					<option value="over75">Over $75</option>
				</select>
				<select
					className="input"
					style={{ width: 190, flex: "0 1 auto", minWidth: 0, minHeight: 44 }}
					value={sort}
					onChange={(e) => setSort(e.target.value as ListingSort)}
					aria-label="Sort listings"
				>
					{SORT_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</div>

			<AsyncPanel
				loading={listing.loading}
				error={listing.error}
				onRetry={listing.reload}
				skeletonRows={6}
				isEmpty={items.length === 0}
				emptyMessage={
					scope === "mine"
						? "You haven't listed anything yet."
						: "Nothing matches that search just yet."
				}
				emptyAction={
					scope === "mine" ? (
						<Link to="/ads/new" className="btn btn-primary">
							List your first subscription
						</Link>
					) : undefined
				}
			>
				<div className="card-grid">
					{items.map((item, index) => (
						<ListingCard key={item.id} listing={item} index={index} showStatus={scope === "mine"} />
					))}
				</div>
			</AsyncPanel>

			<Pagination
				page={page}
				pages={listing.data?.pages ?? 1}
				limit={limit}
				total={listing.data?.total ?? 0}
				onPage={controls.setPage}
				onLimit={controls.setLimit}
				noun="subscriptions"
			/>

			<div
				className="poster"
				style={{ padding: "clamp(20px, 5vw, 28px) clamp(16px, 5vw, 26px)", marginTop: 8 }}
			>
				<h2 style={{ margin: "0 0 16px" }}>Why it's safe to buy here</h2>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
						gap: "20px 28px",
					}}
				>
					{PROMISES.map((promise) => (
						<div key={promise.title} style={{ display: "flex", gap: 12, minWidth: 0 }}>
							<span className="text-muted" style={{ flex: "none", marginTop: 2 }}>
								{promise.icon}
							</span>
							<div style={{ minWidth: 0 }}>
								<div style={{ fontSize: 16, fontWeight: 600 }}>{promise.title}</div>
								<div className="text-muted" style={{ fontSize: 14, marginTop: 2 }}>
									{promise.body}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</Page>
	);
}
