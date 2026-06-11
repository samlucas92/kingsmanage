import { apiClient } from "./apiClient";
import type { Season } from "../stores/seasons";

export const seasonApi = {
	getSeasons: () => apiClient.get<Season[]>("/seasons"),

	getActiveSeason: () => apiClient.get<Season>("/seasons/active"),

	getSeason: (id: string) => apiClient.get<Season>(`/seasons/${id}`),

	createSeason: (season: Season) => apiClient.post<Season>("/seasons", season),

	updateSeason: (id: string, season: Season) =>
		apiClient.put<Season>(`/seasons/${id}`, season),

	setActiveSeason: (id: string) =>
		apiClient.patch<Season>(`/seasons/${id}/set-active`, undefined),
};