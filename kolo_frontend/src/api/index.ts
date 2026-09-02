import { api } from "./client";
import type {
	AdminDispute,
	AdminOrder,
	AdminStats,
	AdminWithdrawal,
	Balance,
	Dispute,
	DisputeCreated,
	DisputeStatus,
	DisputeWinner,
	Listing,
	Order,
	OrderCreated,
	OrderStatus,
	Page,
	User,
	WalletOrderRow,
	Withdrawal,
	WithdrawalStatus,
} from "./types";

export * from "./types";
export { ApiError, getSessionEmail, setSessionEmail, setTokenGetter } from "./client";

// ── users ────────────────────────────────────────────────────────────────

export const usersApi = {
	me: () => api.get<User>("/me"),
	updateMe: (input: { username?: string; telegramUsername?: string }) =>
		api.patch<User>("/me", input),
};

// ── listings ─────────────────────────────────────────────────────────────

export interface ListingInput {
	title: string;
	description: string;
	category?: string;
	/** Cover image URL, http(s). The backend validates it and stores the link. */
	imageUrl?: string;
	priceUsd: number;
	deliveryInfo?: string;
}

export const listingsApi = {
	list: (query?: { search?: string; category?: string; page?: number; limit?: number }) =>
		api.get<Page<Listing>>("/listings", query),
	get: (id: string) => api.get<Listing>(`/listings/${id}`),
	mine: () => api.get<Listing[]>("/listings/mine"),
	create: (input: ListingInput) => api.post<Listing>("/listings", input),
	update: (id: string, input: Partial<ListingInput> & { status?: "ACTIVE" | "PAUSED" }) =>
		api.patch<Listing>(`/listings/${id}`, input),
	remove: (id: string) => api.delete<{ id: string; status: string }>(`/listings/${id}`),
};

// ── orders ───────────────────────────────────────────────────────────────

export const ordersApi = {
	create: (listingId: string) => api.post<OrderCreated>("/orders", { listingId }),
	purchases: () => api.get<Order[]>("/orders/purchases"),
	sales: () => api.get<Order[]>("/orders/sales"),
	get: (id: string) => api.get<Order>(`/orders/${id}`),
};

// ── wallet ───────────────────────────────────────────────────────────────

export const walletApi = {
	balance: () => api.get<Balance>("/wallet/balance"),
	orders: () => api.get<WalletOrderRow[]>("/wallet/orders"),
	withdraw: (input: { address: string; network: string; currency?: string }) =>
		api.post<Withdrawal>("/wallet/withdraw", input),
	withdrawals: () => api.get<Withdrawal[]>("/wallet/withdrawals"),
};

// ── disputes ─────────────────────────────────────────────────────────────

export const disputesApi = {
	open: (orderId: string, reason: string) =>
		api.post<DisputeCreated>(`/orders/${orderId}/dispute`, { reason }),
	mine: () => api.get<Dispute[]>("/disputes/mine"),
	get: (id: string) => api.get<Dispute>(`/disputes/${id}`),
};

// ── admin ────────────────────────────────────────────────────────────────

export const adminApi = {
	disputes: (query?: { status?: DisputeStatus; page?: number; limit?: number }) =>
		api.get<Page<AdminDispute>>("/admin/disputes", query),
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
	stats: () => api.get<AdminStats>("/admin/stats"),
};
