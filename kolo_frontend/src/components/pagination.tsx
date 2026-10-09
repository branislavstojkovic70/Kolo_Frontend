import { PAGE_SIZES } from "../lib/pagination";

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
				borderTop: "1px solid var(--hairline-soft)",
				paddingTop: 16,
			}}
		>
			<label
				className="text-muted"
				style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0, fontSize: 14 }}
			>
				Per page
				{/* 44px, not the 40px a mouse would be happy with — this is one of
				    the controls a thumb has to hit. The arrow glyph is drawn with a
				    background gradient, so its offset is tied to the height. */}
				<select
					className="input"
					style={{
						width: 84,
						maxWidth: "100%",
						flex: "none",
						minHeight: 44,
						padding: "10px 30px 10px 12px",
						fontSize: 14,
						backgroundPosition: "calc(100% - 16px) 19px, calc(100% - 11px) 19px",
					}}
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

			<span className="text-muted" style={{ minWidth: 0, fontSize: 14 }}>
				Showing {first}-{last} of {total} {noun}
			</span>

			{/* The pager is not always the width of a page: Resolution puts one in the
			    240px master column, where prev/next has to be allowed to fall under
			    the counter rather than reach past the column edge. Below 744px the
			    sheet stacks the three groups and stretches the buttons; wrapping is
			    what carries every width in between. */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 10,
					flexWrap: "wrap",
					justifyContent: "flex-end",
					minWidth: 0,
					marginLeft: "auto",
				}}
			>
				<button
					className="btn btn-secondary btn-sm"
					onClick={() => onPage(page - 1)}
					disabled={page <= 1}
				>
					Previous
				</button>
				<span className="text-muted" style={{ fontSize: 14 }}>
					{page} of {lastPage}
				</span>
				<button
					className="btn btn-secondary btn-sm"
					onClick={() => onPage(page + 1)}
					disabled={page >= lastPage}
				>
					Next
				</button>
			</div>
		</div>
	);
}
