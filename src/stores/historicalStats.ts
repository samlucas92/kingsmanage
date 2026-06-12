import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Player } from "./players";
import { getPreSeasonPlayerStats } from "../data/preSeasonPlayerStats";
import { historicalStatsApi } from "../services/historicalStatsApi";

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

export const useHistoricalStatsStore = create<HistoricalStatsStore>()(
	persist(
		(set, get) => ({
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

					set((state) => ({
						historicalPlayerStats:
							records.length > 0 ? records : state.historicalPlayerStats,
						isLoadingHistoricalStats: false,
						hasLoadedHistoricalStats: true,
					}));
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
			initialiseHistoricalStats: (players) => {
				const existingRecords = get().historicalPlayerStats;
				const missingRecords = players
					.filter(
						(player) =>
							!existingRecords.some(
								(record) => record.playerId === player.id
							)
					)
					.map((player) => {
						const preSeasonStats = getPreSeasonPlayerStats(player.name);

						return {
							playerId: player.id,
							appearances: preSeasonStats.appearances,
							goals: preSeasonStats.goals,
							updatedAt: new Date().toISOString(),
						};
					});

				if (missingRecords.length === 0) {
					return;
				}

				set({
					historicalPlayerStats: [...existingRecords, ...missingRecords],
				});
			},
			setHistoricalPlayerStats: async (playerId, stats) => {
				const appearances = normaliseNumber(stats.appearances);
				const goals = normaliseNumber(stats.goals);
				const updatedAt = new Date().toISOString();
				const localRecord = {
					playerId,
					appearances,
					goals,
					updatedAt,
				};

				set((state) => ({
					historicalPlayerStats: upsertRecord(
						state.historicalPlayerStats,
						localRecord
					),
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
				const records = get().historicalPlayerStats;

				try {
					await Promise.all(
						records.map((record) =>
							historicalStatsApi.updateHistoricalStats(record.playerId, {
								appearances: record.appearances,
								goals: record.goals,
							})
						)
					);
				} catch (error) {
					set({
						historicalStatsLoadError:
							error instanceof Error
								? error.message
								: "Failed to sync historical stats.",
					});
				}
			},
		}),
		{
			name: "kingsbridge-colts-historical-stats-store",
			storage: createJSONStorage(() => localStorage),
			version: 1,
			partialize: (state) => ({
				historicalPlayerStats: state.historicalPlayerStats,
			}),
		}
	)
);
