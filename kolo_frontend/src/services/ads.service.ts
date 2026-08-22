import { mockAds } from "../mocks/ads.mock";
import { mockCategories } from "../mocks/categories.mock";
import { mockReviews } from "../mocks/reviews.mock";
import type { Ad, AdDraft, AdFilters, Category, Review } from "../types";
import { nextId, nowIso, reject, respond } from "./api";

const ads = [...mockAds];
const reviews = [...mockReviews];

function matches(ad: Ad, filters: AdFilters): boolean {
	const { search, categoryId, minPrice, maxPrice, minRating, maxDeliveryDays } = filters;

	if (search) {
		const haystack = `${ad.title} ${ad.description}`.toLowerCase();
		if (!haystack.includes(search.toLowerCase())) return false;
	}
	if (categoryId && ad.categoryId !== categoryId) return false;
	if (minPrice !== undefined && ad.price < minPrice) return false;
	if (maxPrice !== undefined && ad.price > maxPrice) return false;
	if (minRating !== undefined && ad.rating < minRating) return false;
	if (maxDeliveryDays !== undefined && ad.deliveryDays > maxDeliveryDays) return false;

	return true;
}

export function getCategories(): Promise<Category[]> {
	return respond(mockCategories);
}

/** Public marketplace listing: active ads only. */
export function getAds(filters: AdFilters = {}): Promise<Ad[]> {
	return respond(ads.filter((ad) => ad.status === "active" && matches(ad, filters)));
}

/** Every ad regardless of status, for the admin moderation queue. */
export function getAllAds(): Promise<Ad[]> {
	return respond(ads);
}

export function getAdsBySeller(sellerId: string): Promise<Ad[]> {
	return respond(ads.filter((ad) => ad.sellerId === sellerId));
}

export function getAd(id: string): Promise<Ad> {
	const ad = ads.find((a) => a.id === id);
	return ad ? respond(ad) : reject(`Ad ${id} not found`);
}

export function getAdReviews(adId: string): Promise<Review[]> {
	return respond(reviews.filter((r) => r.adId === adId && r.status === "visible"));
}

export function createAd(sellerId: string, draft: AdDraft): Promise<Ad> {
	const ad: Ad = {
		...draft,
		id: nextId("a"),
		sellerId,
		status: "draft",
		images: [],
		rating: 0,
		reviewCount: 0,
		ordersCount: 0,
		featured: false,
		createdAt: nowIso(),
		updatedAt: nowIso(),
	};

	ads.unshift(ad);
	return respond(ad);
}

export function updateAd(id: string, patch: Partial<Ad>): Promise<Ad> {
	const index = ads.findIndex((a) => a.id === id);
	if (index === -1) return reject(`Ad ${id} not found`);

	ads[index] = { ...ads[index], ...patch, updatedAt: nowIso() };
	return respond(ads[index]);
}
