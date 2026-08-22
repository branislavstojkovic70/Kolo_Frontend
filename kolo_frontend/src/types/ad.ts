export type AdStatus = "draft" | "active" | "paused" | "removed";

export interface Category {
	id: string;
	name: string;
	parentId?: string;
}

export interface AdImage {
	id: string;
	adId: string;
	url: string;
	position: number;
}

export interface Ad {
	id: string;
	sellerId: string;
	title: string;
	description: string;
	categoryId: string;
	price: number;
	deliveryDays: number;
	revisionCount: number;
	status: AdStatus;
	images: AdImage[];
	rating: number;
	reviewCount: number;
	ordersCount: number;
	featured: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface AdFilters {
	search?: string;
	categoryId?: string;
	minPrice?: number;
	maxPrice?: number;
	minRating?: number;
	maxDeliveryDays?: number;
}

export type AdDraft = Pick<
	Ad,
	| "title"
	| "description"
	| "categoryId"
	| "price"
	| "deliveryDays"
	| "revisionCount"
>;
