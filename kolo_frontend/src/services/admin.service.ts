import { mockAdminActions, mockFinanceSummary } from "../mocks/admin.mock";
import { mockReviews } from "../mocks/reviews.mock";
import type {
	AdminAction,
	AdminActionType,
	AdminTargetType,
	FinanceSummary,
	Review,
} from "../types";
import { nextId, nowIso, reject, respond } from "./api";

const actions = [...mockAdminActions];
const reviews = [...mockReviews];

export function getAdminActions(): Promise<AdminAction[]> {
	return respond(
		[...actions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
	);
}

export function getFinanceSummary(): Promise<FinanceSummary> {
	return respond(mockFinanceSummary);
}

export function getReviews(): Promise<Review[]> {
	return respond(reviews);
}

export function logAdminAction(
	adminId: string,
	actionType: AdminActionType,
	targetType: AdminTargetType,
	targetId: string,
	reason: string
): Promise<AdminAction> {
	const action: AdminAction = {
		id: nextId("aa"),
		adminId,
		actionType,
		targetType,
		targetId,
		reason,
		createdAt: nowIso(),
	};

	actions.unshift(action);
	return respond(action, 150);
}

export function setReviewDeleted(
	id: string,
	deleted: boolean,
	adminId: string
): Promise<Review> {
	const index = reviews.findIndex((r) => r.id === id);
	if (index === -1) return reject(`Review ${id} not found`);

	reviews[index] = {
		...reviews[index],
		status: deleted ? "deleted" : "visible",
		deletedByAdminId: deleted ? adminId : undefined,
	};
	return respond(reviews[index]);
}
