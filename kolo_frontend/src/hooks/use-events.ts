import { useCallback, useMemo, useState } from "react";
import { countUnread, fetchEvents, markAllSeen, type AppEvent } from "../lib/events";
import { useAsync } from "./use-async";

export function useEvents() {
	const { data, loading, error, reload } = useAsync<AppEvent[]>(fetchEvents, []);
	const [seenNonce, setSeenNonce] = useState(0);

	const events = useMemo(() => data ?? [], [data]);
	// seenNonce re-runs the count after "mark all as read".
	const unreadCount = useMemo(() => countUnread(events), [events, seenNonce]); // eslint-disable-line react-hooks/exhaustive-deps

	const markAllRead = useCallback(() => {
		markAllSeen();
		setSeenNonce((n) => n + 1);
	}, []);

	return { events, loading, error, reload, unreadCount, markAllRead };
}
