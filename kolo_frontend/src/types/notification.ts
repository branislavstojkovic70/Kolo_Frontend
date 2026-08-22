export type NotificationType =
	| "payment_received"
	| "order_status"
	| "dispute_opened"
	| "dispute_resolved"
	| "vesting_released"
	| "account_blocked";

export interface AppNotification {
	id: string;
	userId: string;
	type: NotificationType;
	title: string;
	body: string;
	link?: string;
	read: boolean;
	createdAt: string;
}
