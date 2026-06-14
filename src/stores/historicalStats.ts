import { create } from "zustand";
import { historicalStatsApi } from "../services/historicalStatsApi";
import type { Player } from "./players";

export type HistoricalPlayerStatRecord = {
	playerId: string;
	appearances: number;
	goals: number;
	updatedAt: string;
};

type HistoricalStatsStore = {
	historicalPlayerStats: HistoricalPlayerStatRecord[];
	isLoadingHistoricalStats: boolean;
	hasLoadedHistoricalStats: boolean;
	historicalStatsLoadError: string;
	loadHistoricalStats: (force?: boolean) => Promise<void>;
	initialiseHistoricalStats: (players: Player[]) => void;
	setHistoricalPlayerStats: (
		playerId: string,
		stats: {
			appearances: number;
			goals: number;
		}
	) => Promise<void>;
	saveHistoricalPlayerStats: (
		playerId: string,
		stats: {
			appearances: number;
			goals: number;
		}
	) => Promise<void>;
	syncHistoricalStatsToApi: () => Promise<void>;
};

function normaliseNumber(value: number) {
	if (!Number.isFinite(value) || value < 0) {
		return 0;
	}

	return Math.floor(value);
}

function upsertRecord(
	records: HistoricalPlayerStatRecord[],
	updatedRecord: HistoricalPlayerStatRecord
) {
	const exists = records.some(
		(record) => record.playerId === updatedRecord.playerId
	);

	if (!exists) {
		return [...records, updatedRecord];
	}

	return records.map((record) =>
		record.playerId === updatedRecord.playerId ? updatedRecord : record
	);
}

export const useHistoricalStatsStore = create<HistoricalStatsStore>()((set, get) => ({
	historicalPlayerStats: [],
	isLoadingHistoricalStats: false,
	hasLoadedHistoricalStats: false,
	historicalStatsLoadError: "",

	loadHistoricalStats: async (force = false) => {
		if (get().isLoadingHistoricalStats) {
			return;
		}

		if (get().hasLoadedHistoricalStats && !force) {
			return;
		}

		set({
			isLoadingHistoricalStats: true,
			historicalStatsLoadError: "",
		});

		try {
			const records = await historicalStatsApi.getHistoricalStats();

			set({
				historicalPlayerStats: records,
				isLoadingHistoricalStats: false,
				hasLoadedHistoricalStats: true,
			});
		} catch (error) {
			set({
				isLoadingHistoricalStats: false,
				historicalStatsLoadError:
					error instanceof Error
						? error.message
						: "Failed to load historical stats.",
			});
		}
	},

	initialiseHistoricalStats: () => {
		// Historical stats are now API-backed. Page load must be read-only.
	},

	setHistoricalPlayerStats: async (playerId, stats) => {
		const appearances = normaliseNumber(stats.appearances);
		const goals = normaliseNumber(stats.goals);
		const updatedAt = new Date().toISOString();

		set((state) => ({
			historicalPlayerStats: upsertRecord(state.historicalPlayerStats, {
				playerId,
				appearances,
				goals,
				updatedAt,
			}),
		}));
	},

	saveHistoricalPlayerStats: async (playerId, stats) => {
		const appearances = normaliseNumber(stats.appearances);
		const goals = normaliseNumber(stats.goals);
		const optimisticRecord = {
			playerId,
			appearances,
			goals,
			updatedAt: new Date().toISOString(),
		};

		set((state) => ({
			historicalPlayerStats: upsertRecord(
				state.historicalPlayerStats,
				optimisticRecord
			),
			historicalStatsLoadError: "",
		}));

		try {
			const savedRecord = await historicalStatsApi.updateHistoricalStats(
				playerId,
				{
					appearances,
					goals,
				}
			);

			set((state) => ({
				historicalPlayerStats: upsertRecord(
					state.historicalPlayerStats,
					savedRecord
				),
			}));
		} catch (error) {
			set({
				historicalStatsLoadError:
					error instanceof Error
						? error.message
						: "Failed to save historical stats.",
			});
		}
	},

	syncHistoricalStatsToApi: async () => {
		// Historical stats must only be saved after deliberate user edits.
	},
}));
