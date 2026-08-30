import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { countUnread, fetchEvents, markAllSeen, type AppEvent } from "../lib/events";
import { useAsync } from "./use-async";

export interface EventsState {
	events: AppEvent[];
	loading: boolean;
	error: string | undefined;
	reload: () => void;
	unreadCount: number;
	markAllRead: () => void;
}

export function useEvents(): EventsState {
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

/** One shared feed per app shell, so the inbox and the sidebar badge stay in sync. */
export const EventsContext = createContext<EventsState | null>(null);

export function useSharedEvents(): EventsState {
	const context = useContext(EventsContext);
	if (!context) throw new Error("useSharedEvents must be used inside the app shell");
	return context;
}
