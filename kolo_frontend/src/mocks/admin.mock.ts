import type { AdminAction, FinanceSummary } from "../types";

export const mockAdminActions: AdminAction[] = [
	{
		id: "aa-001",
		adminId: "u-admin",
		actionType: "resolve_dispute",
		targetType: "dispute",
		targetId: "d-002",
		reason: "Non-delivery confirmed from chat logs and missing repository access.",
		createdAt: "2026-08-18T09:15:00.000Z",
	},
	{
		id: "aa-002",
		adminId: "u-admin",
		actionType: "block_user",
		targetType: "user",
		targetId: "u-005",
		reason: "Repeated spam listings and fake delivery claims across 6 orders.",
		createdAt: "2026-07-29T10:05:00.000Z",
	},
	{
		id: "aa-003",
		adminId: "u-admin",
		actionType: "remove_ad",
		targetType: "ad",
		targetId: "a-007",
		reason: "Listing violates content policy: misleading claims, no service detail.",
		createdAt: "2026-07-29T10:00:00.000Z",
	},
	{
		id: "aa-004",
		adminId: "u-admin",
		actionType: "delete_review",
		targetType: "review",
		targetId: "r-004",
		reason: "Review contains a promotional spam link.",
		createdAt: "2026-08-20T08:30:00.000Z",
	},
	{
		id: "aa-005",
		adminId: "u-admin",
		actionType: "freeze_vesting",
		targetType: "vesting_entry",
		targetId: "v-003",
		reason: "Dispute d-001 opened before release date.",
		createdAt: "2026-08-14T10:10:00.000Z",
	},
];

export const mockFinanceSummary: FinanceSummary = {
	totalFeesCollected: 74,
	inEscrow: 1123.2,
	inVesting: 652.8,
	available: 2589.1,
	refunded: 211.2,
};
