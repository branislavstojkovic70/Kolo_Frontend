import type { Dispute, DisputeEvidence, DisputeMessage } from "../types";

export const mockDisputes: Dispute[] = [
	{
		id: "d-001",
		orderId: "o-004",
		openedBy: "u-001",
		reason:
			"Delivery is 9 days late and the repository I was given does not build. Migrations are missing entirely.",
		status: "under_review",
		adminId: "u-admin",
		createdAt: "2026-08-14T10:05:00.000Z",
	},
	{
		id: "d-002",
		orderId: "o-005",
		openedBy: "u-004",
		reason: "Seller never delivered anything and stopped replying after payment.",
		status: "resolved_buyer",
		adminId: "u-admin",
		resolution:
			"Non-delivery confirmed. Seller vesting entry slashed and buyer fully refunded. Negative reputation event recorded.",
		resolvedAt: "2026-08-18T09:15:00.000Z",
		createdAt: "2026-08-09T13:40:00.000Z",
	},
	{
		id: "d-003",
		orderId: "o-003",
		openedBy: "u-004",
		reason:
			"The audit report is much thinner than what the ad described. No Core Web Vitals section at all.",
		status: "open",
		createdAt: "2026-08-22T09:00:00.000Z",
	},
];

export const mockDisputeMessages: DisputeMessage[] = [
	{
		id: "dm-001",
		disputeId: "d-001",
		senderId: "u-001",
		message:
			"I opened this dispute because the deadline passed on the 14th and the handover repo fails on npm install.",
		createdAt: "2026-08-14T10:06:00.000Z",
	},
	{
		id: "dm-002",
		disputeId: "d-001",
		senderId: "u-003",
		message:
			"There was a private package in the lockfile. I have pushed a fix, please pull the latest main branch.",
		createdAt: "2026-08-14T15:22:00.000Z",
	},
	{
		id: "dm-003",
		disputeId: "d-001",
		senderId: "u-001",
		message:
			"Pulled it. It installs now but the migration folder is still empty, so the API cannot start.",
		attachmentUrl: "https://picsum.photos/seed/kolo-evidence-1/600/400",
		createdAt: "2026-08-15T08:41:00.000Z",
	},
	{
		id: "dm-004",
		disputeId: "d-001",
		senderId: "u-admin",
		message:
			"Admin here. I have both submissions. Nikola, please upload the migration files or confirm they were never written by end of day.",
		createdAt: "2026-08-16T11:00:00.000Z",
	},
	{
		id: "dm-005",
		disputeId: "d-003",
		senderId: "u-004",
		message:
			"The ad promised a Core Web Vitals review and a Notion board. I received a 3 page PDF only.",
		createdAt: "2026-08-22T09:01:00.000Z",
	},
];

export const mockDisputeEvidence: DisputeEvidence[] = [
	{
		id: "de-001",
		disputeId: "d-001",
		userId: "u-001",
		description: "Terminal output showing the failed migration run.",
		fileUrl: "https://picsum.photos/seed/kolo-evidence-2/800/500",
		createdAt: "2026-08-15T08:45:00.000Z",
	},
	{
		id: "de-002",
		disputeId: "d-001",
		userId: "u-003",
		description: "Commit history proving work was delivered before the deadline.",
		fileUrl: "https://picsum.photos/seed/kolo-evidence-3/800/500",
		createdAt: "2026-08-16T09:30:00.000Z",
	},
	{
		id: "de-003",
		disputeId: "d-002",
		userId: "u-004",
		description: "Chat log showing no reply for 11 days after payment.",
		fileUrl: "https://picsum.photos/seed/kolo-evidence-4/800/500",
		createdAt: "2026-08-10T10:00:00.000Z",
	},
];
