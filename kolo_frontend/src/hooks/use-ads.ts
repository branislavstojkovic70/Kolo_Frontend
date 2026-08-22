import { useCallback } from "react";
import * as adsService from "../services/ads.service";
import type { AdDraft, AdFilters } from "../types";
import { useAsync } from "./use-async";

export function useAds(filters: AdFilters = {}) {
	const { search, categoryId, minPrice, maxPrice, minRating, maxDeliveryDays } = filters;

	return useAsync(
		() => adsService.getAds(filters),
		[search, categoryId, minPrice, maxPrice, minRating, maxDeliveryDays]
	);
}

export function useAd(id: string | undefined) {
	return useAsync(
		() => (id ? adsService.getAd(id) : Promise.reject(new Error("Missing ad id"))),
		[id]
	);
}

export function useAdReviews(adId: string | undefined) {
	return useAsync(() => (adId ? adsService.getAdReviews(adId) : Promise.resolve([])), [adId]);
}

export function useCategories() {
	return useAsync(() => adsService.getCategories(), []);
}

export function useSellerAds(sellerId: string | undefined) {
	return useAsync(
		() => (sellerId ? adsService.getAdsBySeller(sellerId) : Promise.resolve([])),
		[sellerId]
	);
}

export function useCreateAd(sellerId: string | undefined) {
	return useCallback(
		(draft: AdDraft) => {
			if (!sellerId) return Promise.reject(new Error("You must be signed in"));
			return adsService.createAd(sellerId, draft);
		},
		[sellerId]
	);
}
