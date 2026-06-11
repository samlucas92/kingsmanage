import { apiClient } from "./apiClient";
import type { Season, SeasonInput } from "../stores/seasons";

export const seasonApi = {
	getSeasons: () => apiClient.get<Season[]>("/seasons"),

	getActiveSeason: () => apiClient.get<Season>("/seasons/active"),

	getSeason: (id: string) => apiClient.get<Season>(`/seasons/${id}`),

	createSeason: (season: SeasonInput & { isActive?: boolean }) =>
		apiClient.post<Season>("/seasons", {
			name: season.name,
			startDate: season.startDate,
			endDate: season.endDate,
			isActive: season.isActive ?? false,
		}),

	updateSeason: (id: string, season: Season) =>
		apiClient.put<Season>(`/seasons/${id}`, season),

	setActiveSeason: (id: string) =>
		apiClient.patch<Season>(`/seasons/${id}/set-active`, undefined),
};
