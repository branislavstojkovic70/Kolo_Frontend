import { useState } from "react";
import { listingsApi, type ListingSort } from "../api";
import AsyncPanel from "../components/async-panel";
import CountUp from "../components/count-up";
import ListingCard from "../components/listing-card";
import Page from "../components/page";
import Pagination from "../components/pagination";
import { useAsync } from "../hooks/use-async";
import { useListControls } from "../hooks/use-list-controls";
import { usd } from "../utils/money";
import { usePlatformConfig } from "../hooks/use-platform-config";

type Scope = "all" | "mine";
type PriceBand = "any" | "under25" | "25to75" | "over75";

const mono: React.CSSProperties = { fontFamily: "var(--font-mono)" };

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
	{ value: "price_asc", label: "Price · low to high" },
	{ value: "price_desc", label: "Price · high to low" },
];

function StatCell({
	label,
	sub,
	delay,
	children,
}: {
	label: string;
	sub: string;
	delay: number;
	children: React.ReactNode;
}) {
	return (
		<div
			style={{
				borderTop: "2px solid var(--color-divider)",
				paddingTop: 10,
				animation: `fadeUp .45s ease ${delay}s both`,
			}}
		>
			<div className="text-muted" style={{ ...mono, fontSize: 10.5, letterSpacing: "0.12em" }}>
				{label}
			</div>
			<div style={{ ...mono, fontSize: 30, fontWeight: 600, marginTop: 6, lineHeight: 1, whiteSpace: "nowrap" }}>
				{children}
			</div>
			<div className="text-muted" style={{ fontSize: 12 }}>
				{sub}
			</div>
		</div>
	);
}

export default function Ads() {
	const platform = usePlatformConfig();
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

	const listing = useAsync(
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
		<Page title="Marketplace" sub="Browse digital services · pay in any crypto · escrow protected">
			<div className="stat-grid">
				<StatCell label="SERVICES LIVE" sub={`across ${stats?.categories.length ?? 0} categories`} delay={0}>
					<CountUp to={stats?.total ?? 0} />
				</StatCell>
				<StatCell label="CATALOGUE VALUE" sub="sum of live asking prices" delay={0.06}>
					<CountUp to={usd(stats?.catalogueValueUsd ?? 0)} dec={2} />{" "}
					<span className="text-muted" style={{ fontSize: 13, fontWeight: 400 }}>
						USDT
					</span>
				</StatCell>
				<StatCell label="MEDIAN PRICE" sub="per service · any crypto" delay={0.12}>
					<CountUp to={usd(stats?.medianPriceUsd ?? 0)} dec={2} />{" "}
					<span className="text-muted" style={{ fontSize: 13, fontWeight: 400 }}>
						USDT
					</span>
				</StatCell>
				<StatCell label="PLATFORM FEE" sub="flat · no hidden charges" delay={0.18}>
					{platform?.feePercent ?? "—"}
					<span className="text-muted" style={{ fontSize: 13, fontWeight: 400 }}>
						%
					</span>
				</StatCell>
			</div>

			<div className="filter-bar">
				<input
					className="input"
					style={{ flex: 1 }}
					placeholder="Search VPNs, streaming, IPTV, software…"
					value={controls.searchInput}
					onChange={(e) => controls.setSearchInput(e.target.value)}
				/>
				<select
					className="input"
					style={{ width: 170, flex: "none" }}
					value={category}
					onChange={(e) => setCategory(e.target.value)}
				>
					<option value="">All categories</option>
					{(stats?.categories ?? []).map((c) => (
						<option key={c} value={c}>
							{c}
						</option>
					))}
				</select>
				<select
					className="input"
					style={{ width: 150, flex: "none" }}
					value={priceBand}
					onChange={(e) => setPriceBand(e.target.value as PriceBand)}
				>
					<option value="any">Any price</option>
					<option value="under25">Under 25 USDT</option>
					<option value="25to75">25 – 75 USDT</option>
					<option value="over75">Over 75 USDT</option>
				</select>
				<div className="seg" style={{ flex: "none" }}>
					<label className="seg-opt">
						<input type="radio" name="mktf" checked={scope === "all"} onChange={() => setScope("all")} />
						All
					</label>
					<label className="seg-opt">
						<input type="radio" name="mktf" checked={scope === "mine"} onChange={() => setScope("mine")} />
						Mine
					</label>
				</div>
			</div>

			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
				<span className="text-muted" style={{ ...mono, fontSize: 12, letterSpacing: "0.1em" }}>
					{listing.data?.total ?? 0} OF {stats?.total ?? 0} SERVICES
				</span>
				<select
					className="input"
					style={{ width: 190, flex: "none", padding: "5px 8px", fontSize: 13 }}
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
				isEmpty={items.length === 0}
				emptyMessage={scope === "mine" ? "You have no listings yet — post an ad" : "No services match"}
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
				noun="services"
			/>

			<div className="poster" style={{ padding: "36px 28px", marginTop: 4, animation: "fadeUp .5s ease .25s both" }}>
				<div className="poster-stripes" />
				<div style={{ position: "relative" }}>
					<div
						className="poster-ink"
						style={{
							fontFamily: "var(--font-heading)",
							fontWeight: 800,
							fontSize: "clamp(28px, 6vw, 46px)",
							lineHeight: 0.98,
							letterSpacing: "-0.02em",
						}}
					>
						PAID. ESCROWED.
						<br />
						VESTED. RELEASED.
					</div>
					<div className="poster-ink-soft" style={{ ...mono, fontSize: 13, marginTop: 14 }}>
						Every order on Kolo moves through the same four steps · no exceptions, no trust required.
					</div>
				</div>
			</div>
		</Page>
	);
}
