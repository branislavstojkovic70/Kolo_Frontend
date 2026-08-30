import { useNavigate } from "react-router-dom";
import type { Listing } from "../api/types";
import { formatDate } from "../utils/format";
import { fmtUsd } from "../utils/money";
import BlockAvatar from "./block-avatar";

interface ListingCardProps {
	listing: Listing;
	index: number;
	/** Show the listing status tag (Mine view — PAUSED listings are invisible to buyers). */
	showStatus?: boolean;
}

const mono: React.CSSProperties = { fontFamily: "var(--font-mono)" };

export default function ListingCard({ listing, index, showStatus = false }: ListingCardProps) {
	const navigate = useNavigate();
	const category = listing.category?.toUpperCase() ?? "SERVICE";

	return (
		<div
			className="card mcard"
			onClick={() => navigate(`/ads/${listing.id}`)}
			style={{
				padding: 0,
				gap: 0,
				borderRadius: 0,
				animation: `fadeUp .45s ease ${(index * 0.06).toFixed(2)}s both`,
			}}
		>
			<div
				className="grid-plate"
				style={{ height: 132, position: "relative", borderBottom: "1px solid var(--color-divider)" }}
			>
				{/* Seller artwork slot — no upload support on the backend yet, so a
				    watermark plate stands in (object-fit: cover once images exist). */}
				<span
					aria-hidden="true"
					style={{
						position: "absolute",
						inset: 0,
						display: "grid",
						placeItems: "center",
						fontFamily: "var(--font-heading)",
						fontWeight: 800,
						fontSize: 54,
						letterSpacing: "-0.02em",
						color: "color-mix(in srgb, var(--color-text) 10%, transparent)",
						textTransform: "uppercase",
						userSelect: "none",
					}}
				>
					{category.slice(0, 1)}
				</span>
				<span
					style={{
						pointerEvents: "none",
						position: "absolute",
						top: 10,
						left: 12,
						...mono,
						fontSize: 10.5,
						letterSpacing: "0.12em",
						background: "color-mix(in srgb, var(--color-bg) 78%, transparent)",
						padding: "2px 7px",
					}}
				>
					{category}
				</span>
				{showStatus && (
					<span
						className="tag"
						style={{
							pointerEvents: "none",
							position: "absolute",
							top: 8,
							right: 10,
							background: listing.status === "ACTIVE" ? "var(--ok)" : "var(--warn)",
							color: "var(--color-bg)",
							fontWeight: 600,
							...mono,
							fontSize: 10.5,
						}}
					>
						{listing.status === "ACTIVE" ? "Live" : "Paused"}
					</span>
				)}
			</div>
			<div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
				<div
					style={{
						fontFamily: "var(--font-heading)",
						fontWeight: 800,
						fontSize: 16,
						lineHeight: 1.25,
						minHeight: 38,
					}}
				>
					{listing.title}
				</div>
				<div style={{ display: "flex", alignItems: "center", gap: 7 }}>
					<BlockAvatar
						name={listing.seller.username}
						imageUrl={listing.seller.imageUrl}
						size={18}
						fontSize={10}
					/>
					<span className="text-muted" style={{ fontSize: 13 }}>
						{listing.seller.username ?? "Seller"}
					</span>
					<span
						className="text-muted"
						style={{
							whiteSpace: "nowrap",
							flex: "none",
							marginLeft: "auto",
							...mono,
							fontSize: 10.5,
							padding: "1px 6px",
							border: "1px solid var(--color-divider)",
						}}
					>
						{formatDate(listing.createdAt).toUpperCase()}
					</span>
				</div>
				<div
					className="text-muted"
					style={{
						fontSize: 13,
						lineHeight: 1.5,
						display: "-webkit-box",
						WebkitLineClamp: 2,
						WebkitBoxOrient: "vertical",
						overflow: "hidden",
					}}
				>
					{listing.description}
				</div>
				<div className="text-muted" style={{ ...mono, fontSize: 12, marginTop: "auto" }}>
					<span style={{ color: "var(--color-accent)" }}>▣</span> escrow protected · 4% flat fee
				</div>
			</div>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					borderTop: "1px solid var(--color-divider)",
					padding: "10px 14px",
				}}
			>
				<span style={{ ...mono, fontSize: 17, fontWeight: 600 }}>
					{fmtUsd(listing.priceUsd)}{" "}
					<span className="text-muted" style={{ fontSize: 12, fontWeight: 400 }}>
						USDT
					</span>
				</span>
				<span className="text-muted" style={{ marginLeft: "auto", ...mono, fontSize: 10.5, letterSpacing: "0.08em" }}>
					NO.{String(index + 1).padStart(2, "0")}
				</span>
				<span style={{ marginLeft: 12, fontSize: 13, fontWeight: 600, color: "var(--color-accent)" }}>
					View →
				</span>
			</div>
		</div>
	);
}
