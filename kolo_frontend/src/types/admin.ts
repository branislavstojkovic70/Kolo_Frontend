export type AdminActionType =
	| "block_user"
	| "unblock_user"
	| "adjust_reputation"
	| "delete_review"
	| "restore_review"
	| "approve_ad"
	| "remove_ad"
	| "resolve_dispute"
	| "release_vesting"
	| "freeze_vesting";

export type AdminTargetType = "user" | "ad" | "review" | "dispute" | "vesting_entry";

export interface AdminAction {
	id: string;
	adminId: string;
	actionType: AdminActionType;
	targetType: AdminTargetType;
	targetId: string;
	reason: string;
	createdAt: string;
}

export interface FinanceSummary {
	totalFeesCollected: number;
	inEscrow: number;
	inVesting: number;
	available: number;
	refunded: number;
}
