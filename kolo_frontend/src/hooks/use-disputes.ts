import { useCallback, useState } from "react";
import * as disputesService from "../services/disputes.service";
import type { DisputeMessage } from "../types";
import { useAsync } from "./use-async";

export function useDisputes() {
	return useAsync(() => disputesService.getDisputes(), []);
}

export function useDispute(id: string | undefined) {
	return useAsync(
		() =>
			id ? disputesService.getDispute(id) : Promise.reject(new Error("Missing dispute id")),
		[id]
	);
}

export function useDisputeEvidence(disputeId: string | undefined) {
	return useAsync(
		() => (disputeId ? disputesService.getDisputeEvidence(disputeId) : Promise.resolve([])),
		[disputeId]
	);
}

/**
 * Dispute chat. Messages are appended optimistically so the thread feels live;
 * this is where the WebSocket subscription will attach once the gateway exists.
 */
export function useDisputeChat(disputeId: string | undefined, senderId: string | undefined) {
	const { data, loading, error, setData } = useAsync(
		() => (disputeId ? disputesService.getDisputeMessages(disputeId) : Promise.resolve([])),
		[disputeId]
	);
	const [sending, setSending] = useState(false);

	const send = useCallback(
		async (message: string) => {
			if (!disputeId || !senderId || !message.trim()) return;

			setSending(true);
			try {
				const saved = await disputesService.sendDisputeMessage(
					disputeId,
					senderId,
					message.trim()
				);
				setData([...(data ?? []), saved]);
			} finally {
				setSending(false);
			}
		},
		[disputeId, senderId, data, setData]
	);

	const messages: DisputeMessage[] = data ?? [];
	return { messages, loading, error, sending, send };
}
