/**
 * Mock transport. Every service call goes through here so that swapping in the
 * real backend later means replacing this file plus the service bodies, and
 * nothing in the hooks or pages has to change.
 */

const LATENCY_MS = 350;

export function respond<T>(data: T, latency = LATENCY_MS): Promise<T> {
	return new Promise((resolve) => {
		setTimeout(() => resolve(structuredClone(data)), latency);
	});
}

export function reject(message: string, latency = LATENCY_MS): Promise<never> {
	return new Promise((_, rejectPromise) => {
		setTimeout(() => rejectPromise(new Error(message)), latency);
	});
}

export function nextId(prefix: string): string {
	return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso(): string {
	return new Date().toISOString();
}
