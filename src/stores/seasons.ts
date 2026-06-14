import { create } from "zustand";

import { seedSeasons } from "../data/seedSeasons";
import { seasonApi, type SeasonSetupInput } from "../services/seasonApi";

export type Season = {
	id: string;
	name: string;
	startDate: string;
	endDate: string;
	isActive: boolean;
};

export type SeasonInput = {
	name: string;
	startDate: string;
	endDate: string;
};

type SeasonStore = {
	seasons: Season[];
	activeSeasonId: string;
	isLoadingSeasons: boolean;
	hasLoadedSeasons: boolean;
	seasonLoadError: string;
	loadSeasons: (force?: boolean) => Promise<void>;
	setActiveSeason: (seasonId: string) => Promise<void>;
	addSeason: (season: SeasonInput, isActive?: boolean) => Promise<string | null>;
	setupSeason: (input: SeasonSetupInput) => Promise<Season>;
	updateSeason: (seasonId: string, season: SeasonInput) => Promise<void>;
};

export function createSeasonId(name: string) {
	return name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function normaliseApiSeasons(seasons: Season[]) {
	if (seasons.length === 0) {
		return [];
	}

	const activeSeason = seasons.find((season) => season.isActive);
	const activeSeasonId = activeSeason?.id ?? seasons[0].id;

	return seasons.map((season) => ({
		...season,
		isActive: season.id === activeSeasonId,
	}));
}

function getActiveSeasonId(seasons: Season[]) {
	return seasons.find((season) => season.isActive)?.id ?? seasons[0]?.id ?? "";
}

export const useSeasonStore = create<SeasonStore>()((set, get) => ({
	seasons: seedSeasons,
	activeSeasonId: "",
	isLoadingSeasons: false,
	hasLoadedSeasons: false,
	seasonLoadError: "",

	loadSeasons: async (force = false) => {
		if (get().isLoadingSeasons) {
			return;
		}

		if (get().hasLoadedSeasons && !force) {
			return;
		}

		set({
			isLoadingSeasons: true,
			seasonLoadError: "",
		});

		try {
			const seasons = normaliseApiSeasons(await seasonApi.getSeasons());
			const fallbackSeasons = normaliseApiSeasons(seedSeasons);
			const nextSeasons = seasons.length > 0 ? seasons : fallbackSeasons;

			set({
				seasons: nextSeasons,
				activeSeasonId: getActiveSeasonId(nextSeasons),
				isLoadingSeasons: false,
				hasLoadedSeasons: true,
			});
		} catch (error) {
			set({
				isLoadingSeasons: false,
				seasonLoadError:
					error instanceof Error ? error.message : "Failed to load seasons.",
			});
		}
	},

	setActiveSeason: async (seasonId) => {
		const seasonExists = get().seasons.some((season) => season.id === seasonId);

		if (!seasonExists) {
			return;
		}

		const activeSeason = await seasonApi.setActiveSeason(seasonId);

		set((state) => ({
			activeSeasonId: activeSeason.id,
			seasons: state.seasons.map((season) => ({
				...season,
				isActive: season.id === activeSeason.id,
			})),
		}));
	},

	addSeason: async (seasonInput, isActive = false) => {
		if (!seasonInput.name.trim()) {
			return null;
		}

		const seasonAlreadyExists = get().seasons.some(
			(season) =>
				season.name.trim().toLowerCase() ===
				seasonInput.name.trim().toLowerCase()
		);

		if (seasonAlreadyExists) {
			return null;
		}

		const createdSeason = await seasonApi.createSeason({
			name: seasonInput.name.trim(),
			startDate: seasonInput.startDate,
			endDate: seasonInput.endDate,
			isActive,
		});

		set((state) => ({
			activeSeasonId: createdSeason.isActive
				? createdSeason.id
				: state.activeSeasonId,
			seasons: createdSeason.isActive
				? [
					...state.seasons.map((season) => ({
						...season,
						isActive: false,
					})),
					createdSeason,
				]
				: [...state.seasons, createdSeason],
			hasLoadedSeasons: true,
		}));

		return createdSeason.id;
	},

	setupSeason: async (input) => {
		const result = await seasonApi.setupSeason(input);
		const seasons = normaliseApiSeasons(await seasonApi.getSeasons());

		set({
			seasons,
			activeSeasonId: getActiveSeasonId(seasons),
			hasLoadedSeasons: true,
			seasonLoadError: "",
		});

		return result.season;
	},

	updateSeason: async (seasonId, seasonInput) => {
		const existingSeason = get().seasons.find(
			(season) => season.id === seasonId
		);

		if (!existingSeason) {
			return;
		}

		const updatedSeason = await seasonApi.updateSeason(seasonId, {
			...existingSeason,
			name: seasonInput.name.trim(),
			startDate: seasonInput.startDate,
			endDate: seasonInput.endDate,
		});

		set((state) => ({
			activeSeasonId: updatedSeason.isActive
				? updatedSeason.id
				: state.activeSeasonId,
			seasons: state.seasons.map((season) =>
				season.id === seasonId ? updatedSeason : season
			),
		}));
	},
}));
