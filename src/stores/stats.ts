import { create } from "zustand";
import { statsApi, type PlayerStatsRecord } from "../services/statsApi";
import { getAsyncErrorMessage } from "./asyncStore";

type StatsStore = {
	seasonStats: PlayerStatsRecord[];
	isLoadingStats: boolean;
	hasLoadedStats: boolean;
	loadedSeasonId: string;
	statsLoadError: string;
	loadSeasonStats: (seasonId: string, force?: boolean) => Promise<void>;
	recalculateSeasonStats: (seasonId: string) => Promise<void>;
};

export const useStatsStore = create<StatsStore>()((set, get) => ({
	seasonStats: [],
	isLoadingStats: false,
	hasLoadedStats: false,
	loadedSeasonId: "",
	statsLoadError: "",
	loadSeasonStats: async (seasonId, force = false) => {
		if (!seasonId) {
			set({
				seasonStats: [],
				loadedSeasonId: "",
				statsLoadError: "",
			});
			return;
		}

		if (get().isLoadingStats) {
			return;
		}

		if (
			get().hasLoadedStats &&
			get().loadedSeasonId === seasonId &&
			!force
		) {
			return;
		}

		set({
			isLoadingStats: true,
			statsLoadError: "",
		});

		try {
			const seasonStats = await statsApi.getSeasonStats(seasonId);

			set({
				seasonStats,
				isLoadingStats: false,
				hasLoadedStats: true,
				loadedSeasonId: seasonId,
			});
		} catch (error) {
			set({
				isLoadingStats: false,
				statsLoadError: getAsyncErrorMessage(error, "Failed to load stats."),
			});
		}
	},
	recalculateSeasonStats: async (seasonId) => {
		if (!seasonId) {
			return;
		}

		set({
			isLoadingStats: true,
			statsLoadError: "",
		});

		try {
			await statsApi.recalculateSeasonStats(seasonId);
			const seasonStats = await statsApi.getSeasonStats(seasonId);

			set({
				seasonStats,
				isLoadingStats: false,
				hasLoadedStats: true,
				loadedSeasonId: seasonId,
			});
		} catch (error) {
			set({
				isLoadingStats: false,
				statsLoadError:
					error instanceof Error
						? error.message
						: "Failed to recalculate stats.",
			});
		}
	},
}));
