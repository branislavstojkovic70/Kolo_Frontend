import {
	mockDisputeEvidence,
	mockDisputeMessages,
	mockDisputes,
} from "../mocks/disputes.mock";
import type {
	Dispute,
	DisputeEvidence,
	DisputeMessage,
	DisputeResolution,
} from "../types";
import { nextId, nowIso, reject, respond } from "./api";

const disputes = [...mockDisputes];
const messages = [...mockDisputeMessages];
const evidence = [...mockDisputeEvidence];

export function getDisputes(): Promise<Dispute[]> {
	return respond(
		[...disputes].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
	);
}

export function getDispute(id: string): Promise<Dispute> {
	const dispute = disputes.find((d) => d.id === id);
	return dispute ? respond(dispute) : reject(`Dispute ${id} not found`);
}

export function getDisputeMessages(disputeId: string): Promise<DisputeMessage[]> {
	return respond(
		messages
			.filter((m) => m.disputeId === disputeId)
			.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
	);
}

export function getDisputeEvidence(disputeId: string): Promise<DisputeEvidence[]> {
	return respond(evidence.filter((e) => e.disputeId === disputeId));
}

export function openDispute(
	orderId: string,
	openedBy: string,
	reason: string
): Promise<Dispute> {
	const dispute: Dispute = {
		id: nextId("d"),
		orderId,
		openedBy,
		reason,
		status: "open",
		createdAt: nowIso(),
	};

	disputes.unshift(dispute);
	return respond(dispute);
}

export function sendDisputeMessage(
	disputeId: string,
	senderId: string,
	message: string
): Promise<DisputeMessage> {
	const entry: DisputeMessage = {
		id: nextId("dm"),
		disputeId,
		senderId,
		message,
		createdAt: nowIso(),
	};

	messages.push(entry);
	return respond(entry, 150);
}

export function submitEvidence(
	disputeId: string,
	userId: string,
	description: string,
	fileUrl: string
): Promise<DisputeEvidence> {
	const entry: DisputeEvidence = {
		id: nextId("de"),
		disputeId,
		userId,
		description,
		fileUrl,
		createdAt: nowIso(),
	};

	evidence.push(entry);
	return respond(entry);
}

export function resolveDispute(
	id: string,
	adminId: string,
	resolution: DisputeResolution
): Promise<Dispute> {
	const index = disputes.findIndex((d) => d.id === id);
	if (index === -1) return reject(`Dispute ${id} not found`);

	const note =
		resolution.outcome === "resolved_partial"
			? `${resolution.note} (buyer share: ${resolution.buyerShare}%)`
			: resolution.note;

	disputes[index] = {
		...disputes[index],
		status: resolution.outcome,
		adminId,
		resolution: note,
		resolvedAt: nowIso(),
	};

	return respond(disputes[index]);
}
