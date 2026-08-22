import { mockNotifications } from "../mocks/notifications.mock";
import type { AppNotification } from "../types";
import { reject, respond } from "./api";

const notifications = [...mockNotifications];

export function getNotifications(userId: string): Promise<AppNotification[]> {
	return respond(
		notifications
			.filter((n) => n.userId === userId)
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
	);
}

export function markAsRead(id: string): Promise<AppNotification> {
	const index = notifications.findIndex((n) => n.id === id);
	if (index === -1) return reject(`Notification ${id} not found`);

	notifications[index] = { ...notifications[index], read: true };
	return respond(notifications[index], 100);
}

export function markAllAsRead(userId: string): Promise<AppNotification[]> {
	notifications.forEach((n, i) => {
		if (n.userId === userId) notifications[i] = { ...n, read: true };
	});

	return getNotifications(userId);
}
