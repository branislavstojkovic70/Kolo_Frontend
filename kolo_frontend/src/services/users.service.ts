import { mockReputationEvents, mockUsers } from "../mocks/users.mock";
import type { ReputationEvent, User } from "../types";
import { nowIso, reject, respond } from "./api";

const users = [...mockUsers];
const reputationEvents = [...mockReputationEvents];

export function getUsers(): Promise<User[]> {
	return respond(users);
}

export function getUser(id: string): Promise<User> {
	const user = users.find((u) => u.id === id);
	return user ? respond(user) : reject(`User ${id} not found`);
}

export function getReputationEvents(userId: string): Promise<ReputationEvent[]> {
	return respond(
		reputationEvents
			.filter((event) => event.userId === userId)
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
	);
}

export function updateUser(id: string, patch: Partial<User>): Promise<User> {
	const index = users.findIndex((u) => u.id === id);
	if (index === -1) return reject(`User ${id} not found`);

	users[index] = { ...users[index], ...patch };
	return respond(users[index]);
}

export function setUserBlocked(id: string, blocked: boolean): Promise<User> {
	return updateUser(id, { status: blocked ? "blocked" : "active" });
}

export function adjustReputation(
	id: string,
	delta: number,
	reason: string
): Promise<User> {
	const user = users.find((u) => u.id === id);
	if (!user) return reject(`User ${id} not found`);

	reputationEvents.push({
		id: `re-${reputationEvents.length + 1}`,
		userId: id,
		type: "admin_adjustment",
		delta,
		reason,
		createdAt: nowIso(),
	});

	const score = Math.max(0, Math.min(100, user.reputationScore + delta));
	return updateUser(id, { reputationScore: score });
}
