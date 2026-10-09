import { api } from "./client";
import type {
	AdminBuyRequest,
	AdminDispute,
	AdminOrder,
	AdminStats,
	AdminWithdrawal,
	Balance,
	BuyRequest,
	BuyRequestStatus,
	Dispute,
	DisputeCreated,
	DisputeStatus,
	DisputeWinner,
	Listing,
	ListingSort,
	ListingStats,
	MyListing,
	Order,
	OrderCreated,
	OrderStatus,
	Page,
	PlatformConfig,
	Product,
	Savings,
	User,
	WalletOrderRow,
	Withdrawal,
	WithdrawalCreated,
	WithdrawalStatus,
} from "./types";

export * from "./types";
export { ApiError, getSessionEmail, setSessionEmail, setTokenGetter } from "./client";

// ── platform config ──────────────────────────────────────────────────────

export const configApi = {
	get: () => api.get<PlatformConfig>("/config"),
};

// ── product catalogue ────────────────────────────────────────────────────

/**
 * The catalogue sellers must pick from. Public, unpaginated and small, so
 * screens load it once and keep it. It is also the source of the category list
 * for pickers that need one.
 */
export const productsApi = {
	list: () => api.get<Product[]>("/products"),
};

// ── users ────────────────────────────────────────────────────────────────

export const usersApi = {
	me: () => api.get<User>("/me"),
	updateMe: (input: { username?: string; telegramUsername?: string }) =>
		api.patch<User>("/me", input),
};

// ── listings ─────────────────────────────────────────────────────────────

/**
 * Note the asymmetry the backend imposes: prices go out as numbers and come
 * back as 2-decimal strings.
 */
export interface ListingInput {
	/** An active catalogue product. `title` and `category` are copied from it. */
	productId: string;
	description: string;
	/** Cover image URL, http(s). The backend validates it and stores the link. */
	imageUrl?: string;
	priceUsd: number;
	/** How many units exist. Defaults to 1. */
	quantity?: number;
	deliveryInfo?: string;
}

/** PATCH accepts everything except `productId`, which is immutable. */
export type ListingUpdate = Partial<Omit<ListingInput, "productId">> & {
	/** Only these two are the seller's to set; `SOLD` / `DELETED` are the system's. */
	status?: "ACTIVE" | "PAUSED";
};

/**
 * Largest page the backend accepts (PaginationDto caps `limit` at 100). Views
 * that aggregate over everything the user has — the inbox feed, the profile
 * counters — ask for this one page instead of walking every page.
 */
export const MAX_PAGE_SIZE = 100;

/**
 * Page + search + status filter, shared by the orders and disputes lists.
 * A type alias, not an interface — only aliases get the implicit index
 * signature the query serialiser needs.
 */
export type ListQuery<TStatus extends string> = {
	search?: string;
	status?: TStatus;
	page?: number;
	limit?: number;
};

/** Which side of the trade the orders list shows. */
export type OrderRole = "all" | "buying" | "selling";

/** search / category / price range / sort / page — the full listings query. */
export type ListingQuery = {
	search?: string;
	category?: string;
	minPrice?: number;
	maxPrice?: number;
	sort?: ListingSort;
	page?: number;
	limit?: number;
};

export const listingsApi = {
	list: (query?: ListingQuery) => api.get<Page<Listing>>("/listings", query),
	stats: () => api.get<ListingStats>("/listings/stats"),
	get: (id: string) => api.get<Listing>(`/listings/${id}`),
	/** Includes PAUSED and SOLD listings, and the units held by buyers. */
	mine: (query?: ListingQuery) => api.get<Page<MyListing>>("/listings/mine", query),
	create: (input: ListingInput) => api.post<Listing>("/listings", input),
	update: (id: string, input: ListingUpdate) => api.patch<Listing>(`/listings/${id}`, input),
	remove: (id: string) => api.delete<{ id: string; status: string }>(`/listings/${id}`),
};

// ── orders ───────────────────────────────────────────────────────────────

export const ordersApi = {
	create: (listingId: string) => api.post<OrderCreated>("/orders", { listingId }),
	/** Both sides in one paginated list — `role` picks buying / selling / all. */
	list: (query?: ListQuery<OrderStatus> & { role?: OrderRole }) =>
		api.get<Page<Order>>("/orders", query),
	purchases: (query?: ListQuery<OrderStatus>) => api.get<Page<Order>>("/orders/purchases", query),
	sales: (query?: ListQuery<OrderStatus>) => api.get<Page<Order>>("/orders/sales", query),
	get: (id: string) => api.get<Order>(`/orders/${id}`),
};

// ── wallet ───────────────────────────────────────────────────────────────

export const walletApi = {
	balance: () => api.get<Balance>("/wallet/balance"),
	orders: () => api.get<WalletOrderRow[]>("/wallet/orders"),
	/** No amount: the call always pays out the whole `available` bucket. */
	withdraw: (input: { address: string; network: string; currency?: string }) =>
		api.post<WithdrawalCreated>("/wallet/withdraw", input),
	withdrawals: () => api.get<Withdrawal[]>("/wallet/withdrawals"),
};

// ── buyer savings ────────────────────────────────────────────────────────

export const statsApi = {
	savings: () => api.get<Savings>("/stats/savings"),
};

// ── buy requests (auto-buy / "Deal Alerts") ──────────────────────────────

export interface BuyRequestInput {
	productId: string;
	maxPriceUsd: number;
	/** ISO timestamp; must be in the future. Omit for a wish that never lapses. */
	expiresAt?: string;
}

export const buyRequestsApi = {
	/** May come back already `MATCHED`, with `matchedOrder.paymentUrl` set. */
	create: (input: BuyRequestInput) => api.post<BuyRequest>("/buy-requests", input),
	mine: (query?: { status?: BuyRequestStatus; page?: number; limit?: number }) =>
		api.get<Page<BuyRequest>>("/buy-requests/mine", query),
	get: (id: string) => api.get<BuyRequest>(`/buy-requests/${id}`),
	/** Only while `ACTIVE` — a `MATCHED` wish answers 409. */
	cancel: (id: string) => api.delete<BuyRequest>(`/buy-requests/${id}`),
};

// ── disputes ─────────────────────────────────────────────────────────────

export const disputesApi = {
	open: (orderId: string, reason: string) =>
		api.post<DisputeCreated>(`/orders/${orderId}/dispute`, { reason }),
	mine: (query?: ListQuery<DisputeStatus>) => api.get<Page<Dispute>>("/disputes/mine", query),
	get: (id: string) => api.get<Dispute>(`/disputes/${id}`),
};

// ── admin ────────────────────────────────────────────────────────────────

export const adminApi = {
	disputes: (query?: ListQuery<DisputeStatus>) => api.get<Page<AdminDispute>>("/admin/disputes", query),
	resolveDispute: (id: string, winner: DisputeWinner, note?: string) =>
		api.post<{ dispute: AdminDispute; order: AdminOrder }>(`/admin/disputes/${id}/resolve`, {
			winner,
			...(note ? { note } : {}),
		}),
	telegramRetry: (id: string) => api.post<Dispute>(`/admin/disputes/${id}/telegram-retry`),
	orders: (query?: { status?: OrderStatus; page?: number; limit?: number }) =>
		api.get<Page<AdminOrder>>("/admin/orders", query),
	withdrawals: (query?: { status?: WithdrawalStatus; page?: number; limit?: number }) =>
		api.get<Page<AdminWithdrawal>>("/admin/withdrawals", query),
	buyRequests: (query?: { status?: BuyRequestStatus; page?: number; limit?: number }) =>
		api.get<Page<AdminBuyRequest>>("/admin/buy-requests", query),
	stats: () => api.get<AdminStats>("/admin/stats"),
};
