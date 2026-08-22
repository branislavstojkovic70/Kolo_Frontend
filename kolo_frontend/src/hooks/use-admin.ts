import * as adminService from "../services/admin.service";
import * as adsService from "../services/ads.service";
import * as usersService from "../services/users.service";
import { useAsync } from "./use-async";

export function useUsers() {
	return useAsync(() => usersService.getUsers(), []);
}

export function useUser(id: string | undefined) {
	return useAsync(
		() => (id ? usersService.getUser(id) : Promise.reject(new Error("Missing user id"))),
		[id]
	);
}

export function useReputationEvents(userId: string | undefined) {
	return useAsync(
		() => (userId ? usersService.getReputationEvents(userId) : Promise.resolve([])),
		[userId]
	);
}

export function useAllAds() {
	return useAsync(() => adsService.getAllAds(), []);
}

export function useAdminActions() {
	return useAsync(() => adminService.getAdminActions(), []);
}

export function useFinanceSummary() {
	return useAsync(() => adminService.getFinanceSummary(), []);
}

export function useReviews() {
	return useAsync(() => adminService.getReviews(), []);
}
