/**
 * Response shapes of the Kolo backend, mirrored from its Swagger examples.
 * Conventions: money is always a 2-decimal USD string ("24.99"), timestamps
 * are ISO-8601 UTC strings or null. 1 USDT = 1 USD platform-wide.
 */

export type Role = "USER" | "ADMIN";
/**
 * `SOLD_OUT` is legacy — nothing writes it any more, but old rows still carry
 * it, so reads must tolerate it. There is no `RESERVED`: units are held in the
 * reservation table, and a partly reserved listing simply stays `ACTIVE`.
 */
export type ListingStatus = "ACTIVE" | "PAUSED" | "SOLD_OUT" | "SOLD" | "DELETED";
export type OrderStatus = "PENDING_PAYMENT" | "PAID" | "DISPUTED" | "REFUNDED" | "EXPIRED";
export type DisputeStatus = "OPEN" | "RESOLVED_BUYER" | "RESOLVED_SELLER";
export type WithdrawalStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type BuyRequestStatus = "ACTIVE" | "MATCHED" | "FULFILLED" | "CANCELLED" | "EXPIRED";
export type WalletBucket =
	| "available"
	| "vesting"
	| "disputed"
	| "withdrawing"
	| "withdrawn"
	/** Defensive: the backend types this column as a plain string. */
	| "unavailable";
export type DisputeWinner = "BUYER" | "SELLER";

/**
 * Platform rules straight from the backend env — the FE must never keep its own
 * copy of the fee or the vesting length.
 */
export interface PlatformConfig {
	feePercent: number;
	vestingDays: number;
	disputeWindowDays: number;
	/** The one string on an object of numbers — mirrors the backend exactly. */
	minWithdrawalUsd: string;
	/** How long an unpaid order holds its unit, manual buy or auto-buy alike. */
	autoBuyReservationMinutes: number;
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

/**
 * A catalogue product. Sellers can only list these — there is no free-text
 * title any more. `retailPriceUsd` is the official price the UI strikes through
 * next to the seller's price. GET /api/products returns a bare array of these.
 */
export interface Product {
	id: string;
	slug: string;
	name: string;
	category: string;
	retailPriceUsd: string;
	imageUrl: string | null;
}

export interface Listing {
	id: string;
	sellerId: string;
	/** The catalogue product. Set at creation and immutable afterwards. */
	productId: string;
	/** Copied from `product.name` at write time — not user input. */
	title: string;
	description: string;
	/** Copied from `product.category` at write time. */
	category: string | null;
	/** External cover-image URL. We store the link only — nothing is uploaded. */
	imageUrl: string | null;
	priceUsd: string;
	/** How many units the seller offers, and how many are already paid for. */
	quantity: number;
	soldCount: number;
	/**
	 * quantity − soldCount − units held by buyers mid-payment. This is the only
	 * number a buy button may be gated on; never re-derive it by subtraction.
	 */
	availableCount: number;
	status: ListingStatus;
	createdAt: string;
	updatedAt: string;
	seller: UserStub;
	product: Product;
}

/** One unit held for one buyer while their order is still unpaid. */
export interface ActiveReservation {
	id: string;
	buyerId: string;
	buyerUsername: string | null;
	orderId: string;
	quantity: number;
	expiresAt: string;
}

/**
 * GET /api/listings/mine adds the held units, so a seller can see why
 * `availableCount` sits below `quantity − soldCount`.
 */
export interface MyListing extends Listing {
	reservations: ActiveReservation[];
}

/**
 * What the listing grid renders. The public feed and `mine` differ only in the
 * held units, so one row type covers both and the card shows them when present.
 */
export type ListingRow = Listing & { reservations?: ActiveReservation[] };

export interface Order {
	id: string;
	listingId: string;
	buyerId: string;
	sellerId: string;
	titleSnapshot: string;
	/**
	 * Catalogue product and its official price, frozen at purchase time. Buyer
	 * savings are always read from this snapshot, never from the live catalogue.
	 */
	productId: string;
	retailPriceUsdSnapshot: string;
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
	/**
	 * An optional *key*, not a nullable field: it is absent from the payload
	 * unless the caller is the buyer of a PAID / DISPUTED / REFUNDED order.
	 */
	deliveryInfo?: string | null;
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

/** POST /api/wallet/withdraw answers with a superset of the list row. */
export interface WithdrawalCreated extends Withdrawal {
	userId: string;
	updatedAt: string;
	orderIds: string[];
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

/**
 * Auto-buy, "Deal Alerts" in the UI: a standing wish to buy `product` as soon
 * as a listing appears at or below `maxPriceUsd`. On a match the backend creates
 * the order, holds one unit for `autoBuyReservationMinutes` and hands back the
 * payment link — the buyer still pays it themselves.
 */
export interface BuyRequest {
	id: string;
	buyerId: string;
	productId: string;
	maxPriceUsd: string;
	status: BuyRequestStatus;
	expiresAt: string | null;
	matchedListingId: string | null;
	matchedOrderId: string | null;
	/** Start of the reservation window — the countdown counts from here. */
	matchedAt: string | null;
	createdAt: string;
	updatedAt: string;
	product: Product;
	matchedOrder: {
		id: string;
		amountUsd: string;
		paymentUrl: string | null;
		status: OrderStatus;
	} | null;
}

/** One purchase's contribution to the buyer's savings total. */
export interface SavingsItem {
	orderId: string;
	productName: string;
	paidUsd: string;
	retailUsd: string;
	savedUsd: string;
	purchasedAt: string | null;
}

/**
 * GET /api/stats/savings — the caller's own savings as a buyer, counted over
 * PAID and DISPUTED orders only. Refunded money came back, so it is not a
 * saving and the backend leaves it out.
 */
export interface Savings {
	totalSpentUsd: string;
	totalRetailUsd: string;
	totalSavedUsd: string;
	/** A 2-decimal string, not a number — "32.40". */
	savedPercent: string;
	orderCount: number;
	items: SavingsItem[];
}

export interface AdminBuyRequest extends BuyRequest {
	buyer: AdminUserStub & { imageUrl: string | null };
}

/**
 * The admin embed identifies both parties by object instead of by id, so it
 * carries no `buyerId` / `sellerId` scalars — hence its own type rather than an
 * extension of the party-facing summary.
 */
export interface AdminDisputeOrder {
	id: string;
	titleSnapshot: string;
	amountUsd: string;
	feeUsd: string;
	sellerAmountUsd: string;
	status: OrderStatus;
	paidAt: string | null;
	vestedAt: string | null;
	withdrawalId: string | null;
	beneficiaryId: string;
	buyer: AdminUserStub;
	seller: AdminUserStub;
}

export interface AdminDispute {
	id: string;
	orderId: string;
	reason: string;
	status: DisputeStatus;
	telegramChatId: string | null;
	telegramInviteLink: string | null;
	resolvedById: string | null;
	resolutionNote: string | null;
	resolvedAt: string | null;
	createdAt: string;
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
		/** Held under Buyer Protection and not yet withdrawn. */
		inEscrowUsd: string;
		paidOutUsd: string;
		/** Platform-wide buyer savings, from the retail snapshots. */
		buyerRetailUsd: string;
		buyerSavedUsd: string;
	};
}
