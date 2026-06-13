import { apiClient } from "./apiClient";
import type { Season, SeasonInput } from "../stores/seasons";

export type SeasonSetupInput = SeasonInput & {
	makeActive: boolean;
	setStartingFinanceAmount: boolean;
	startingFinanceAmount: number;
};

export type SeasonSetupResult = {
	season: Season;
	createdSeason: boolean;
	financeChargesCreatedOrUpdated: number;
};

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
	setupSeason: (input: SeasonSetupInput) =>
		apiClient.post<SeasonSetupResult>("/seasons/setup", {
			name: input.name,
			startDate: input.startDate,
			endDate: input.endDate,
			makeActive: input.makeActive,
			setStartingFinanceAmount: input.setStartingFinanceAmount,
			startingFinanceAmount: input.startingFinanceAmount,
		}),
	updateSeason: (id: string, season: Season) =>
		apiClient.put<Season>(`/seasons/${id}`, season),
	setActiveSeason: (id: string) =>
		apiClient.patch<Season>(`/seasons/${id}/set-active`, undefined),
};
