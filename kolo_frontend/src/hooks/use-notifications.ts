import { useCallback, useMemo } from "react";
import * as notificationsService from "../services/notifications.service";
import { useAsync } from "./use-async";

export function useNotifications(userId: string | undefined) {
	const { data, loading, error, setData, reload } = useAsync(
		() => (userId ? notificationsService.getNotifications(userId) : Promise.resolve([])),
		[userId]
	);

	const notifications = useMemo(() => data ?? [], [data]);
	const unreadCount = notifications.filter((n) => !n.read).length;

	const markAsRead = useCallback(
		async (id: string) => {
			const updated = await notificationsService.markAsRead(id);
			setData(notifications.map((n) => (n.id === updated.id ? updated : n)));
		},
		[notifications, setData]
	);

	const markAllAsRead = useCallback(async () => {
		if (!userId) return;
		setData(await notificationsService.markAllAsRead(userId));
	}, [userId, setData]);

	return { notifications, unreadCount, loading, error, markAsRead, markAllAsRead, reload };
}
