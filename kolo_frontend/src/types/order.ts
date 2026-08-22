export type OrderStatus =
	| "pending_payment"
	| "paid"
	| "in_progress"
	| "delivered"
	| "completed"
	| "disputed"
	| "cancelled"
	| "refunded";

export type PaymentStatus = "waiting" | "confirming" | "paid" | "expired" | "failed";

export interface Order {
	id: string;
	buyerId: string;
	sellerId: string;
	adId: string;
	adTitle: string;
	amount: number;
	feeAmount: number;
	status: OrderStatus;
	deliveredAt?: string;
	completedAt?: string;
	autoConfirmAt?: string;
	createdAt: string;
}

export interface Payment {
	id: string;
	orderId: string;
	oxapayTrackId: string;
	currency: string;
	amountPaid: number;
	status: PaymentStatus;
	payAddress?: string;
	createdAt: string;
}

export interface PlatformFeeEntry {
	id: string;
	orderId: string;
	amount: number;
	createdAt: string;
}

/** Platform takes a 4% cut of every payment (spec 3.4). */
export const PLATFORM_FEE_RATE = 0.04;
