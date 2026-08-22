export type UserRole = "user" | "seller" | "admin";

export type UserStatus = "active" | "blocked" | "pending_verification";

export interface User {
	id: string;
	email: string;
	displayName: string;
	avatarUrl?: string;
	bio?: string;
	role: UserRole;
	status: UserStatus;
	reputationScore: number;
	emailVerified: boolean;
	payoutWalletAddress?: string;
	createdAt: string;
}

export type ReputationEventType =
	| "order_completed"
	| "dispute_lost"
	| "dispute_won"
	| "buyer_rating"
	| "account_age"
	| "admin_adjustment";

export interface ReputationEvent {
	id: string;
	userId: string;
	type: ReputationEventType;
	delta: number;
	orderId?: string;
	reason?: string;
	createdAt: string;
}

export interface Credentials {
	email: string;
	password: string;
}

export interface RegisterPayload extends Credentials {
	displayName: string;
}
