import { useCallback, useEffect, useState } from "react";
import { DEFAULT_PAGE_SIZE } from "../lib/pagination";

export interface ListControls<TStatus extends string> {
	/** Raw input value — bound to the search box. */
	searchInput: string;
	setSearchInput: (value: string) => void;
	/** Debounced search term — this is what the query should use. */
	search: string;
	status: TStatus | "";
	setStatus: (value: TStatus | "") => void;
	page: number;
	setPage: (page: number) => void;
	limit: number;
	setLimit: (limit: number) => void;
}

/**
 * Search + status filter + pagination state, shared by the orders, disputes and
 * inbox lists. Every filter change returns to page 1 — otherwise you land on an
 * empty page 4 of a two-page result.
 */
export function useListControls<TStatus extends string>(
	initialLimit: number = DEFAULT_PAGE_SIZE
): ListControls<TStatus> {
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [status, setStatusValue] = useState<TStatus | "">("");
	const [page, setPage] = useState(1);
	const [limit, setLimitValue] = useState(initialLimit);

	// Debounced so typing doesn't fire a request per keystroke. The page reset
	// lives in the timeout callback, never in the effect body.
	useEffect(() => {
		const timer = setTimeout(() => {
			setSearch(searchInput.trim());
			setPage(1);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchInput]);

	const setStatus = useCallback((value: TStatus | "") => {
		setStatusValue(value);
		setPage(1);
	}, []);

	const setLimit = useCallback((value: number) => {
		setLimitValue(value);
		setPage(1);
	}, []);

	return {
		searchInput,
		setSearchInput,
		search,
		status,
		setStatus,
		page,
		setPage,
		limit,
		setLimit,
	};
}
