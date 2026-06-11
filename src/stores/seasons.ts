import { create } from "zustand";
import { DEFAULT_SEASON_ID, seedSeasons } from "../data/seedSeasons";
import { seasonApi } from "../services/seasonApi";

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
	seasonLoadError: string;

	loadSeasons: () => Promise<void>;
	setActiveSeason: (seasonId: string) => Promise<void>;
	addSeason: (season: SeasonInput, isActive?: boolean) => Promise<string | null>;
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
	return (
		seasons.find((season) => season.isActive)?.id ??
		seasons[0]?.id ??
		DEFAULT_SEASON_ID
	);
}

export const useSeasonStore = create<SeasonStore>()((set, get) => ({
	seasons: seedSeasons,
	activeSeasonId: DEFAULT_SEASON_ID,
	isLoadingSeasons: false,
	seasonLoadError: "",

	loadSeasons: async () => {
		set({
			isLoadingSeasons: true,
			seasonLoadError: "",
		});

		try {
			const seasons = normaliseApiSeasons(await seasonApi.getSeasons());

			set({
				seasons: seasons.length > 0 ? seasons : seedSeasons,
				activeSeasonId:
					seasons.length > 0 ? getActiveSeasonId(seasons) : DEFAULT_SEASON_ID,
				isLoadingSeasons: false,
			});
		} catch (error) {
			set({
				isLoadingSeasons: false,
				seasonLoadError:
					error instanceof Error
						? error.message
						: "Failed to load seasons.",
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
		const id = createSeasonId(seasonInput.name);

		if (!id) {
			return null;
		}

		const seasonAlreadyExists = get().seasons.some(
			(season) => season.id === id
		);

		if (seasonAlreadyExists) {
			return null;
		}

		const nextSeason: Season = {
			id,
			name: seasonInput.name.trim(),
			startDate: seasonInput.startDate,
			endDate: seasonInput.endDate,
			isActive,
		};

		const createdSeason = await seasonApi.createSeason(nextSeason);

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
		}));

		return createdSeason.id;
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