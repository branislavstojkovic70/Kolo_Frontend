import { useEffect, useState } from "react";

/** Render-stable clock; pass tickMs to keep it advancing (countdowns). */
export function useNow(tickMs?: number): number {
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		if (!tickMs) return;
		const timer = setInterval(() => setNow(Date.now()), tickMs);
		return () => clearInterval(timer);
	}, [tickMs]);

	return now;
}
