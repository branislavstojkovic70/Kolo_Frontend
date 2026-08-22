export type DisputeStatus =
	| "open"
	| "under_review"
	| "resolved_buyer"
	| "resolved_seller"
	| "resolved_partial";

export interface Dispute {
	id: string;
	orderId: string;
	openedBy: string;
	reason: string;
	status: DisputeStatus;
	adminId?: string;
	resolution?: string;
	resolvedAt?: string;
	createdAt: string;
}

export interface DisputeMessage {
	id: string;
	disputeId: string;
	senderId: string;
	message: string;
	attachmentUrl?: string;
	createdAt: string;
}

export interface DisputeEvidence {
	id: string;
	disputeId: string;
	userId: string;
	description: string;
	fileUrl: string;
	createdAt: string;
}

export type DisputeResolution =
	| { outcome: "resolved_buyer"; note: string }
	| { outcome: "resolved_seller"; note: string }
	| { outcome: "resolved_partial"; note: string; buyerShare: number };
