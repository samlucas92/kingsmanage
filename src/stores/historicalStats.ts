import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Player } from "./players";
import { getPreSeasonPlayerStats } from "../data/preSeasonPlayerStats";

export type HistoricalPlayerStatRecord = {
	playerId: string;
	appearances: number;
	goals: number;
	updatedAt: string;
};

type HistoricalStatsStore = {
	historicalPlayerStats: HistoricalPlayerStatRecord[];

	initialiseHistoricalStats: (players: Player[]) => void;

	setHistoricalPlayerStats: (
		playerId: string,
		stats: {
			appearances: number;
			goals: number;
		}
	) => void;
};

function normaliseNumber(value: number) {
	if (!Number.isFinite(value) || value < 0) {
		return 0;
	}

	return Math.floor(value);
}

export const useHistoricalStatsStore = create<HistoricalStatsStore>()(
	persist(
		(set, get) => ({
			historicalPlayerStats: [],

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
					historicalPlayerStats: [
						...existingRecords,
						...missingRecords,
					],
				});
			},

			setHistoricalPlayerStats: (playerId, stats) =>
				set((state) => {
					const appearances = normaliseNumber(stats.appearances);
					const goals = normaliseNumber(stats.goals);

					const existingRecord = state.historicalPlayerStats.find(
						(record) => record.playerId === playerId
					);

					if (!existingRecord) {
						return {
							historicalPlayerStats: [
								...state.historicalPlayerStats,
								{
									playerId,
									appearances,
									goals,
									updatedAt: new Date().toISOString(),
								},
							],
						};
					}

					return {
						historicalPlayerStats: state.historicalPlayerStats.map(
							(record) =>
								record.playerId === playerId
									? {
											...record,
											appearances,
											goals,
											updatedAt: new Date().toISOString(),
										}
									: record
						),
					};
				}),
		}),
		{
			name: "kingsbridge-colts-historical-stats-store",
			storage: createJSONStorage(() => localStorage),
			version: 1,
		}
	)
);