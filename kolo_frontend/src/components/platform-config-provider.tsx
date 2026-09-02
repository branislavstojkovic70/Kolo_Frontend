import type { ReactNode } from "react";
import { configApi } from "../api";
import { PlatformConfigContext } from "../hooks/use-platform-config";
import { useAsync } from "../hooks/use-async";

/**
 * Loads GET /api/config once, for the whole app. The endpoint is public, so the
 * sign-in screens get the real fee too.
 */
export default function PlatformConfigProvider({ children }: { children: ReactNode }) {
	const { data } = useAsync(() => configApi.get(), []);

	return (
		<PlatformConfigContext.Provider value={data}>{children}</PlatformConfigContext.Provider>
	);
}
