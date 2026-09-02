/**
 * Response shapes of the Kolo backend, mirrored from its Swagger examples.
 * Conventions: money is always a 2-decimal USD string ("24.99"), timestamps
 * are ISO-8601 UTC strings or null. 1 USDT = 1 USD platform-wide.
 */

export type Role = "USER" | "ADMIN";
export type ListingStatus = "ACTIVE" | "PAUSED" | "DELETED";
export type OrderStatus = "PENDING_PAYMENT" | "PAID" | "DISPUTED" | "REFUNDED" | "EXPIRED";
export type DisputeStatus = "OPEN" | "RESOLVED_BUYER" | "RESOLVED_SELLER";
export type WithdrawalStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type WalletBucket = "available" | "vesting" | "disputed" | "withdrawing" | "withdrawn";
export type DisputeWinner = "BUYER" | "SELLER";

/**
 * Platform rules straight from the backend env — the FE must never keep its own
 * copy of the fee or the vesting length.
 */
export interface PlatformConfig {
	feePercent: number;
	vestingDays: number;
	disputeWindowDays: number;
	minWithdrawalUsd: string;
	payoutCurrencies: string[];
	payoutNetworks: string[];
}

export interface User {
	id: string;
	email: string;
	username: string | null;
	imageUrl: string | null;
	telegramUsername: string | null;
	role: Role;
	createdAt: string;
}

/** Embedded party on listings/orders — no e-mail. */
export interface UserStub {
	id: string;
	username: string | null;
	imageUrl: string | null;
}

/** Embedded party on admin payloads — with e-mail. */
export interface AdminUserStub {
	id: string;
	email: string;
	username: string | null;
}

export interface Page<T> {
	items: T[];
	total: number;
	page: number;
	limit: number;
	pages: number;
}

export type ListingSort = "newest" | "oldest" | "price_asc" | "price_desc";

/** Catalogue headline numbers, counted in the database over ACTIVE listings. */
export interface ListingStats {
	total: number;
	categories: string[];
	catalogueValueUsd: string;
	medianPriceUsd: string;
}

export interface Listing {
	id: string;
	sellerId: string;
	title: string;
	description: string;
	category: string | null;
	/** External cover-image URL. We store the link only — nothing is uploaded. */
	imageUrl: string | null;
	priceUsd: string;
	status: ListingStatus;
	createdAt: string;
	updatedAt: string;
	seller: UserStub;
}

export interface Order {
	id: string;
	listingId: string;
	buyerId: string;
	sellerId: string;
	titleSnapshot: string;
	amountUsd: string;
	feeUsd: string;
	sellerAmountUsd: string;
	status: OrderStatus;
	beneficiaryId: string;
	oxapayTrackId: string | null;
	paymentUrl: string | null;
	paidAt: string | null;
	vestedAt: string | null;
	withdrawalId: string | null;
	createdAt: string;
	updatedAt: string;
	buyer: UserStub;
	seller: UserStub;
	/** Only present for the buyer of a PAID / DISPUTED / REFUNDED order. */
	deliveryInfo?: string;
}

export interface OrderCreated {
	order: Order;
	paymentUrl: string | null;
}

export interface Balance {
	available: string;
	vesting: string;
	disputed: string;
	withdrawing: string;
	withdrawn: string;
	nextVestingAt: string | null;
}

export interface WalletOrderRow {
	orderId: string;
	title: string;
	amount: string;
	status: OrderStatus;
	vestedAt: string | null;
	bucket: WalletBucket;
	disputeStatus: DisputeStatus | null;
	withdrawalId: string | null;
}

export interface Withdrawal {
	id: string;
	amountUsd: string;
	currency: string;
	network: string;
	address: string;
	status: WithdrawalStatus;
	oxapayTrackId: string | null;
	error: string | null;
	completedAt: string | null;
	createdAt: string;
	orderCount: number;
}

export interface DisputeOrderSummary {
	id: string;
	titleSnapshot: string;
	amountUsd: string;
	sellerAmountUsd: string;
	status: OrderStatus;
	buyerId: string;
	sellerId: string;
	paidAt: string | null;
	vestedAt: string | null;
}

export interface Dispute {
	id: string;
	orderId: string;
	openedById: string;
	reason: string;
	status: DisputeStatus;
	telegramChatId: string | null;
	telegramInviteLink: string | null;
	resolvedById: string | null;
	resolutionNote: string | null;
	resolvedAt: string | null;
	createdAt: string;
	updatedAt: string;
	order: DisputeOrderSummary;
}

export interface DisputeCreated {
	dispute: Dispute;
	telegramInviteLink: string | null;
}

export interface AdminDisputeOrder extends DisputeOrderSummary {
	feeUsd: string;
	withdrawalId: string | null;
	beneficiaryId: string;
	buyer: AdminUserStub;
	seller: AdminUserStub;
}

export interface AdminDispute extends Omit<Dispute, "order"> {
	openedBy: AdminUserStub;
	resolvedBy: AdminUserStub | null;
	order: AdminDisputeOrder;
}

export interface AdminOrder {
	id: string;
	titleSnapshot: string;
	amountUsd: string;
	feeUsd: string;
	sellerAmountUsd: string;
	status: OrderStatus;
	beneficiaryId: string;
	oxapayTrackId: string | null;
	paidAt: string | null;
	vestedAt: string | null;
	withdrawalId: string | null;
	createdAt: string;
	buyer: AdminUserStub;
	seller: AdminUserStub;
	dispute: { id: string; status: DisputeStatus } | null;
}

export interface AdminWithdrawal extends Withdrawal {
	user: AdminUserStub;
}

export interface AdminStats {
	users: number;
	listings: number;
	orders: {
		total: number;
		byStatus: Record<OrderStatus, number>;
	};
	disputes: {
		total: number;
		open: number;
		byStatus: Record<DisputeStatus, number>;
	};
	money: {
		grossVolumeUsd: string;
		platformFeesUsd: string;
		inEscrowUsd: string;
		paidOutUsd: string;
	};
}
