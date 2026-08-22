import { useCallback, useEffect, useState } from "react";

export interface AsyncState<T> {
	data: T | undefined;
	loading: boolean;
	error: string | undefined;
	reload: () => void;
	setData: (data: T) => void;
}

interface InternalState<T> {
	data: T | undefined;
	loading: boolean;
	error: string | undefined;
}

/**
 * Runs an async loader and tracks loading/error state. `deps` controls when the
 * loader re-runs, exactly like useEffect deps.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
	const [state, setState] = useState<InternalState<T>>({
		data: undefined,
		loading: true,
		error: undefined,
	});
	const [nonce, setNonce] = useState(0);

	useEffect(() => {
		let cancelled = false;

		const load = async () => {
			setState((prev) => ({ ...prev, loading: true, error: undefined }));

			try {
				const result = await loader();
				if (!cancelled) setState({ data: result, loading: false, error: undefined });
			} catch (err: unknown) {
				if (!cancelled) {
					setState({
						data: undefined,
						loading: false,
						error: err instanceof Error ? err.message : "Something went wrong",
					});
				}
			}
		};

		void load();

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [...deps, nonce]);

	const reload = useCallback(() => setNonce((n) => n + 1), []);

	const setData = useCallback((data: T) => {
		setState((prev) => ({ ...prev, data }));
	}, []);

	return { ...state, reload, setData };
}
