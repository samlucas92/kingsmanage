import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_SEASON_ID, seedSeasons } from "../data/seedSeasons";

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

	setActiveSeason: (seasonId: string) => void;
	addSeason: (season: SeasonInput) => string | null;
	updateSeason: (seasonId: string, season: SeasonInput) => void;
};

export function createSeasonId(name: string) {
	return name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function normaliseSeasons(seasons: Season[], activeSeasonId: string) {
	if (seasons.length === 0) {
		return seedSeasons;
	}

	const activeSeasonExists = seasons.some(
		(season) => season.id === activeSeasonId
	);

	const nextActiveSeasonId = activeSeasonExists
		? activeSeasonId
		: seasons[0].id;

	return seasons.map((season) => ({
		...season,
		isActive: season.id === nextActiveSeasonId,
	}));
}

export const useSeasonStore = create<SeasonStore>()(
	persist(
		(set, get) => ({
			seasons: seedSeasons,
			activeSeasonId: DEFAULT_SEASON_ID,

			setActiveSeason: (seasonId) =>
				set((state) => {
					const seasonExists = state.seasons.some(
						(season) => season.id === seasonId
					);

					if (!seasonExists) {
						return state;
					}

					return {
						activeSeasonId: seasonId,
						seasons: state.seasons.map((season) => ({
							...season,
							isActive: season.id === seasonId,
						})),
					};
				}),

			addSeason: (seasonInput) => {
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
					isActive: false,
				};

				set((state) => ({
					seasons: [...state.seasons, nextSeason],
				}));

				return id;
			},

			updateSeason: (seasonId, seasonInput) =>
				set((state) => ({
					seasons: state.seasons.map((season) =>
						season.id === seasonId
							? {
									...season,
									name: seasonInput.name.trim(),
									startDate: seasonInput.startDate,
									endDate: seasonInput.endDate,
								}
							: season
					),
				})),
		}),
		{
			name: "kingsbridge-colts-season-store",
			storage: createJSONStorage(() => localStorage),
			version: 2,
			migrate: (persistedState) => {
				const state = persistedState as Partial<SeasonStore>;

				const activeSeasonId = state.activeSeasonId ?? DEFAULT_SEASON_ID;
				const seasons = normaliseSeasons(
					state.seasons ?? seedSeasons,
					activeSeasonId
				);

				return {
					seasons,
					activeSeasonId:
						seasons.find((season) => season.isActive)?.id ?? DEFAULT_SEASON_ID,
				};
			},
		}
	)
);