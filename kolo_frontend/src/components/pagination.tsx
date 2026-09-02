import { PAGE_SIZES } from "../lib/pagination";

const mono: React.CSSProperties = { fontFamily: "var(--font-mono)" };

interface PaginationProps {
	page: number;
	pages: number;
	limit: number;
	total: number;
	onPage: (page: number) => void;
	onLimit: (limit: number) => void;
	/** Plural noun for the counter line, e.g. "orders". */
	noun: string;
}

/**
 * Shared pager: page-size picker on the left, prev/next on the right, with a
 * "showing X–Y of N" counter in between. Renders nothing when there is a single
 * page of results and the default page size — no chrome for three rows.
 */
export default function Pagination({
	page,
	pages,
	limit,
	total,
	onPage,
	onLimit,
	noun,
}: PaginationProps) {
	if (total === 0) return null;

	const first = (page - 1) * limit + 1;
	const last = Math.min(page * limit, total);
	const lastPage = Math.max(pages, 1);

	return (
		<div
			className="pager"
			style={{
				display: "flex",
				alignItems: "center",
				gap: 12,
				flexWrap: "wrap",
				borderTop: "2px solid var(--color-divider)",
				paddingTop: 12,
			}}
		>
			<label
				className="text-muted"
				style={{ display: "flex", alignItems: "center", gap: 7, ...mono, fontSize: 11.5, letterSpacing: "0.1em" }}
			>
				PER PAGE
				<select
					className="input"
					style={{ width: 78, flex: "none", padding: "5px 8px", fontSize: 13 }}
					value={limit}
					onChange={(e) => onLimit(Number(e.target.value))}
					aria-label={`${noun} per page`}
				>
					{PAGE_SIZES.map((size) => (
						<option key={size} value={size}>
							{size}
						</option>
					))}
				</select>
			</label>

			<span className="text-muted" style={{ ...mono, fontSize: 11.5, letterSpacing: "0.1em" }}>
				SHOWING {first}–{last} OF {total} {noun.toUpperCase()}
			</span>

			<div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
				<button
					className="btn btn-secondary"
					onClick={() => onPage(page - 1)}
					disabled={page <= 1}
					style={{ padding: "5px 12px" }}
				>
					← Prev
				</button>
				<span className="text-muted" style={{ ...mono, fontSize: 11.5, letterSpacing: "0.1em" }}>
					{page} / {lastPage}
				</span>
				<button
					className="btn btn-secondary"
					onClick={() => onPage(page + 1)}
					disabled={page >= lastPage}
					style={{ padding: "5px 12px" }}
				>
					Next →
				</button>
			</div>
		</div>
	);
}
