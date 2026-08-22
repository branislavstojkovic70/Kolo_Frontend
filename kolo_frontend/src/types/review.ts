export type ReviewStatus = "visible" | "deleted";

export interface Review {
	id: string;
	orderId: string;
	adId: string;
	buyerId: string;
	sellerId: string;
	rating: number;
	comment: string;
	status: ReviewStatus;
	deletedByAdminId?: string;
	createdAt: string;
}
