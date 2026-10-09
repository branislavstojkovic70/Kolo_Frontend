import { useEffect, useMemo, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { listingsApi, type Listing } from "../api";
import { useAsync } from "../hooks/use-async";
import { useAuth } from "../hooks/use-auth";
import { usePlatformConfig } from "../hooks/use-platform-config";
import ThemeToggle from "../components/theme-toggle";
import { LockIcon, MessageIcon, ShieldCheckIcon } from "../components/icons";
import { money, savedPercent, usd } from "../utils/money";
import "../landing.css";

/**
 * The public landing page at "/" — the only marketing surface in the app.
 *
 * Everything on it is real: listings, prices, savings and the platform rules
 * all come from the same public endpoints the product reads (GET /listings,
 * /listings/stats, /config). Nothing is invented, so the page can never drift
 * from what a visitor finds after signing up.
 */

/** Adds `.lp-in` once the element scrolls into view — CSS does the rest. */
function useReveal<T extends HTMLElement>() {
	const ref = useRef<T>(null);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		el.classList.add("lp-reveal");
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					el.classList.add("lp-in");
					io.disconnect();
				}
			},
			{ threshold: 0.15 }
		);
		io.observe(el);
		return () => io.disconnect();
	}, []);
	return ref;
}

function Reveal({ children }: { children: React.ReactNode }) {
	const ref = useReveal<HTMLDivElement>();
	return <div ref={ref}>{children}</div>;
}

/** Compact listing card for the deals row — real data, links into sign-up. */
function DealCard({ listing }: { listing: Listing }) {
	const cover = listing.imageUrl ?? listing.product.imageUrl;
	const saved = savedPercent(listing.priceUsd, listing.product.retailPriceUsd);
	return (
		<Link to="/register" className="card mcard link-plain" style={{ padding: 0, gap: 0, overflow: "hidden" }}>
			<div className="mcard-media" style={{ aspectRatio: "16 / 10" }}>
				{cover && <img src={cover} alt={listing.title} loading="lazy" />}
			</div>
			<div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
				<div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{listing.title}</div>
				<div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
					<span style={{ fontSize: 16, fontWeight: 600 }}>{money(listing.priceUsd)}</span>
					<span className="price-was" style={{ fontSize: 14 }}>
						{money(listing.product.retailPriceUsd)}
					</span>
					{saved !== null && <span className="save-badge">Save {saved}%</span>}
				</div>
			</div>
		</Link>
	);
}

export default function Landing() {
	const { user, loading } = useAuth();
	const platform = usePlatformConfig();

	const listingsQ = useAsync(() => listingsApi.list({ limit: 12, sort: "newest" }), []);
	const statsQ = useAsync(() => listingsApi.stats(), []);

	useEffect(() => {
		document.title = "Kolo: subscriptions below retail";
		return () => {
			document.title = "Kolo";
		};
	}, []);

	const live = useMemo(
		() =>
			(listingsQ.data?.items ?? []).filter(
				(l) => l.status === "ACTIVE" && l.availableCount > 0 && (l.imageUrl || l.product.imageUrl)
			),
		[listingsQ.data]
	);

	// The hero stacks one real listing over its own savings plate.
	const hero = live[0];
	const heroSaved = hero ? usd(hero.product.retailPriceUsd) - usd(hero.priceUsd) : 0;
	const collage = live.slice(1, 3);
	const stats = statsQ.data;

	if (loading) {
		return (
			<div
				className="text-muted"
				style={{
					display: "flex",
					justifyContent: "center",
					paddingTop: 120,
					fontSize: 16,
					animation: "pulseDot 1.2s ease-in-out infinite",
				}}
			>
				Loading Kolo…
			</div>
		);
	}
	if (user) return <Navigate to="/ads" replace />;

	return (
		<div className="lp">
			<nav className="lp-nav" aria-label="Landing">
				<Link to="/" className="topbar-brand" style={{ display: "inline-flex" }}>
					Kolo
				</Link>
				<div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
					<ThemeToggle />
					<Link to="/login" className="btn btn-ghost">
						Sign in
					</Link>
					<Link to="/register" className="btn btn-primary hide-xs">
						Create a free account
					</Link>
				</div>
			</nav>

			<main>
				{/* ── hero ─────────────────────────────────────────────────────── */}
				<div className="lp-main">
					<section className="lp-hero">
						<div>
							<h1 className="lp-h1 fade-up">Pay less for what you already use.</h1>
							<p className="lp-sub fade-up" style={{ animationDelay: "0.08s" }}>
								Real people sell the spare months on their subscriptions. Your money stays
								protected until you confirm everything works.
							</p>
							<div
								className="fade-up"
								style={{ display: "flex", gap: 12, flexWrap: "wrap", animationDelay: "0.16s" }}
							>
								<Link to="/register" className="btn btn-primary">
									Create a free account
								</Link>
								<a href="#how" className="btn btn-secondary" style={{ textDecoration: "none" }}>
									See how it works
								</a>
							</div>
						</div>

						{hero ? (
							<div className="lp-stack fade-up" style={{ animationDelay: "0.2s" }}>
								<div className="deal-card lp-stack-plate" aria-hidden="true" />
								<div className="card lp-stack-card" style={{ padding: 0, gap: 0, overflow: "hidden" }}>
									<div className="mcard-media">
										<img
											src={(hero.imageUrl ?? hero.product.imageUrl)!}
											alt={hero.title}
											fetchPriority="high"
										/>
									</div>
									<div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
										<div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{hero.title}</div>
										<div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
											<span style={{ fontSize: 18, fontWeight: 700 }}>{money(hero.priceUsd)}</span>
											<span className="price-was" style={{ fontSize: 14 }}>
												{money(hero.product.retailPriceUsd)}
											</span>
										</div>
										<div style={{ fontSize: 14, color: "var(--accent-ink)", fontWeight: 500 }}>
											You keep {money(heroSaved)} on this one listing.
										</div>
									</div>
								</div>
							</div>
						) : (
							<div className="card fade-up" style={{ gap: 0, animationDelay: "0.2s", maxWidth: 400 }}>
								<div className="trust-stack" style={{ borderTop: 0 }}>
									<div className="trust-row">
										<ShieldCheckIcon size={17} />
										<span>
											<b>Buyer Protection</b> on every order. Full refund if it is not as described.
										</span>
									</div>
									<div className="trust-row">
										<LockIcon size={17} />
										<span>
											<b>Payment held securely</b> until you confirm your purchase works.
										</span>
									</div>
									<div className="trust-row">
										<MessageIcon size={17} />
										<span>
											<b>Real people</b> settle anything that goes wrong.
										</span>
									</div>
								</div>
							</div>
						)}
					</section>
				</div>

				{/* ── live strip: the marketplace, scrolling by ─────────────────── */}
				{live.length > 2 && (
					<div className="ticker lp-strip" aria-hidden="true">
						<div className="ticker-track">
							{[0, 1].map((half) => (
								<div key={half} style={{ display: "flex", flex: "none" }}>
									{live.map((l) => (
										<span key={`${half}-${l.id}`} className="lp-strip-chip">
											<span style={{ fontWeight: 600 }}>{l.title}</span>
											<span className="text-muted">{money(l.priceUsd)}</span>
										</span>
									))}
								</div>
							))}
						</div>
					</div>
				)}

				{/* ── how buyer protection works ────────────────────────────────── */}
				<div className="lp-main">
					<section className="lp-section" id="how">
						<Reveal>
							<div className="lp-how">
								<div>
									<h2 className="lp-h2">Your money moves only when you say so.</h2>
									<p style={{ fontSize: 16, maxWidth: "42ch" }}>
										Kolo sits between you and the seller the whole way. Nobody is paid on a
										promise.
									</p>
								</div>
								<div>
									{[
										{
											title: "Pick a deal",
											body: "Every listing is a catalogue subscription under its regular price, with the saving shown up front.",
										},
										{
											title: "Pay into protection",
											body: "Kolo holds the money, not the seller. Your access details unlock on the order page right away.",
										},
										{
											title: "Check everything",
											body: `You have ${platform ? `${platform.disputeWindowDays} days` : "days"} to ask for help. A real person settles it while the money waits.`,
										},
										{
											title: "The seller is paid",
											body: `Funds clear to the seller ${platform ? `${platform.vestingDays} days` : "days"} after payment. A problem pauses the clock.`,
										},
									].map((step, i) => (
										<div key={step.title} className="lp-step">
											<span className="lp-step-no">{i + 1}</span>
											<div>
												<div style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>
													{step.title}
												</div>
												<div className="text-muted" style={{ fontSize: 15, lineHeight: 1.5 }}>
													{step.body}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</Reveal>
					</section>

					{/* ── live deals ──────────────────────────────────────────────── */}
					{live.length > 0 && (
						<section className="lp-section">
							<Reveal>
								<h2 className="lp-h2">On sale right now</h2>
								{stats && (
									<p className="text-muted" style={{ fontSize: 15, margin: "0 0 24px" }}>
										{stats.total} live {stats.total === 1 ? "listing" : "listings"} with a median
										price of {money(stats.medianPriceUsd)}.
									</p>
								)}
								<div className="lp-deals">
									{live.slice(0, 8).map((l) => (
										<DealCard key={l.id} listing={l} />
									))}
								</div>
							</Reveal>
						</section>
					)}

					{/* ── the honest numbers ──────────────────────────────────────── */}
					<section className="lp-section">
						<Reveal>
							<div className="lp-band">
								<div>
									<div className="lp-band-figure">{platform ? `${platform.feePercent}%` : "…"}</div>
									<div className="text-muted" style={{ fontSize: 15, marginTop: 6 }}>
										flat service fee. No listing fees, nothing hidden.
									</div>
								</div>
								{stats && (
									<div style={{ display: "flex", gap: "clamp(24px, 4vw, 56px)", flexWrap: "wrap" }}>
										<div>
											<div style={{ fontSize: 24, fontWeight: 700 }}>{stats.total}</div>
											<div className="text-muted" style={{ fontSize: 14 }}>
												subscriptions live today
											</div>
										</div>
										<div>
											<div style={{ fontSize: 24, fontWeight: 700 }}>
												{money(stats.medianPriceUsd)}
											</div>
											<div className="text-muted" style={{ fontSize: 14 }}>
												median listing price
											</div>
										</div>
										<div>
											<div style={{ fontSize: 24, fontWeight: 700 }}>{stats.categories.length}</div>
											<div className="text-muted" style={{ fontSize: 14 }}>
												categories, from streaming to AI tools
											</div>
										</div>
									</div>
								)}
							</div>
						</Reveal>
					</section>

					{/* ── selling ─────────────────────────────────────────────────── */}
					<section className="lp-section">
						<Reveal>
							<div className="lp-sell">
								<div>
									<h2 className="lp-h2">Sell the months you won't use.</h2>
									<p style={{ fontSize: 16, maxWidth: "48ch" }}>
										List a subscription in about a minute. When it sells, the money clears to you{" "}
										{platform ? `${platform.vestingDays} days` : "days"} after payment, minus the{" "}
										{platform ? `${platform.feePercent}%` : ""} fee, and you withdraw in USDT
										whenever you like.
									</p>
									<p className="text-muted" style={{ fontSize: 15, maxWidth: "48ch" }}>
										The clearing period is what backs Buyer Protection. It is the same rule for
										every seller, including us. We list nothing of our own.
									</p>
								</div>
								{collage.length === 2 && (
									<div className="lp-sell-collage" aria-hidden="true">
										<img src={(collage[0].imageUrl ?? collage[0].product.imageUrl)!} alt="" loading="lazy" />
										<img src={(collage[1].imageUrl ?? collage[1].product.imageUrl)!} alt="" loading="lazy" />
									</div>
								)}
							</div>
						</Reveal>
					</section>

					{/* ── final call ──────────────────────────────────────────────── */}
					<section className="lp-section">
						<Reveal>
							<div className="lp-cta-band">
								<h2 className="lp-h2" style={{ margin: 0 }}>
									Your next subscription costs less.
								</h2>
								<Link to="/register" className="btn btn-primary" style={{ flex: "none" }}>
									Create a free account
								</Link>
							</div>
						</Reveal>
					</section>
				</div>
			</main>

			<footer className="lp-footer">
				<div
					className="lp-main"
					style={{
						display: "flex",
						alignItems: "center",
						gap: 16,
						flexWrap: "wrap",
						padding: 0,
					}}
				>
					<div>
						<div className="topbar-brand" style={{ display: "inline-flex", cursor: "default" }}>
							Kolo
						</div>
						<div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
							Subscriptions below retail.
						</div>
					</div>
					<div style={{ marginLeft: "auto", display: "flex", gap: 18, alignItems: "center" }}>
						<Link to="/login" className="text-muted" style={{ fontSize: 14 }}>
							Sign in
						</Link>
						<span className="text-muted" style={{ fontSize: 14 }}>
							© 2026 Kolo
						</span>
					</div>
				</div>
			</footer>
		</div>
	);
}
