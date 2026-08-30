import { useEffect, useMemo, useState } from "react";
import { listingsApi } from "../api";
import AsyncPanel from "../components/async-panel";
import CountUp from "../components/count-up";
import ListingCard from "../components/listing-card";
import Page from "../components/page";
import { useAsync } from "../hooks/use-async";
import { usd } from "../utils/money";

type Scope = "all" | "mine";
type PriceBand = "any" | "under25" | "25to75" | "over75";

const mono: React.CSSProperties = { fontFamily: "var(--font-mono)" };

const priceMatch: Record<PriceBand, (price: number) => boolean> = {
	any: () => true,
	under25: (p) => p < 25,
	"25to75": (p) => p >= 25 && p <= 75,
	over75: (p) => p > 75,
};

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
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [category, setCategory] = useState("");
	const [priceBand, setPriceBand] = useState<PriceBand>("any");
	const [scope, setScope] = useState<Scope>("all");

	useEffect(() => {
		const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
		return () => clearTimeout(timer);
	}, [searchInput]);

	// Unfiltered catalogue — powers the stat cells and the category options.
	const catalogue = useAsync(() => listingsApi.list({ limit: 100 }), []);
	const filtered = useAsync(
		() =>
			listingsApi.list({
				search: search || undefined,
				category: category || undefined,
				limit: 100,
			}),
		[search, category]
	);
	const mine = useAsync(() => (scope === "mine" ? listingsApi.mine() : Promise.resolve([])), [scope]);

	const categories = useMemo(() => {
		const set = new Set<string>();
		for (const listing of catalogue.data?.items ?? []) {
			if (listing.category) set.add(listing.category);
		}
		return [...set].sort();
	}, [catalogue.data]);

	const items = useMemo(() => {
		const source =
			scope === "all"
				? (filtered.data?.items ?? [])
				: (mine.data ?? []).filter(
						(l) =>
							(!search || l.title.toLowerCase().includes(search.toLowerCase())) &&
							(!category || l.category?.toLowerCase() === category.toLowerCase())
					);
		return source.filter((l) => priceMatch[priceBand](usd(l.priceUsd)));
	}, [scope, filtered.data, mine.data, search, category, priceBand]);

	const stats = useMemo(() => {
		const all = catalogue.data?.items ?? [];
		const prices = all.map((l) => usd(l.priceUsd)).sort((a, b) => a - b);
		const median = prices.length ? prices[Math.floor(prices.length / 2)] : 0;
		return {
			total: catalogue.data?.total ?? 0,
			categories: new Set(all.map((l) => l.category ?? "Other")).size,
			value: prices.reduce((sum, p) => sum + p, 0),
			median,
		};
	}, [catalogue.data]);

	const loading = scope === "all" ? filtered.loading : mine.loading;
	const error = scope === "all" ? filtered.error : mine.error;

	return (
		<Page title="Marketplace" sub="Browse digital services · pay in any crypto · escrow protected">
			<div className="stat-grid">
				<StatCell label="SERVICES LIVE" sub={`across ${stats.categories} categories`} delay={0}>
					<CountUp to={stats.total} />
				</StatCell>
				<StatCell label="CATALOGUE VALUE" sub="sum of live asking prices" delay={0.06}>
					<CountUp to={stats.value} dec={2} />{" "}
					<span className="text-muted" style={{ fontSize: 13, fontWeight: 400 }}>
						USDT
					</span>
				</StatCell>
				<StatCell label="MEDIAN PRICE" sub="per service · any crypto" delay={0.12}>
					<CountUp to={stats.median} dec={2} />{" "}
					<span className="text-muted" style={{ fontSize: 13, fontWeight: 400 }}>
						USDT
					</span>
				</StatCell>
				<StatCell label="PLATFORM FEE" sub="flat · no hidden charges" delay={0.18}>
					4
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
					value={searchInput}
					onChange={(e) => setSearchInput(e.target.value)}
				/>
				<select
					className="input"
					style={{ width: 170, flex: "none" }}
					value={category}
					onChange={(e) => setCategory(e.target.value)}
				>
					<option value="">All categories</option>
					{categories.map((c) => (
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
					{items.length} OF {stats.total} SERVICES
				</span>
				<span className="text-muted" style={{ ...mono, fontSize: 12, letterSpacing: "0.1em" }}>
					SORTED BY NEWEST
				</span>
			</div>

			<AsyncPanel
				loading={loading}
				error={error}
				isEmpty={items.length === 0}
				emptyMessage={scope === "mine" ? "You have no listings yet — post an ad" : "No services match"}
			>
				<div className="card-grid">
					{items.map((listing, index) => (
						<ListingCard key={listing.id} listing={listing} index={index} showStatus={scope === "mine"} />
					))}
				</div>
			</AsyncPanel>

			<div className="poster" style={{ padding: "36px 28px", marginTop: 4, animation: "fadeUp .5s ease .25s both" }}>
				<div className="poster-stripes" />
				<div style={{ position: "relative" }}>
					<div
						className="poster-ink"
						style={{
							fontFamily: "var(--font-heading)",
							fontWeight: 800,
							fontSize: 46,
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
