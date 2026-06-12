import { apiClient } from "./apiClient";
import type { HistoricalPlayerStatRecord } from "../stores/historicalStats";

type ApiHistoricalStatsRecord = {
	id?: string;
	playerId: string;
	appearances: number;
	goals: number;
	updatedAt?: string;
};

type HistoricalStatsUpdate = {
	appearances: number;
	goals: number;
};

function fromApiRecord(record: ApiHistoricalStatsRecord): HistoricalPlayerStatRecord {
	return {
		playerId: record.playerId,
		appearances: record.appearances,
		goals: record.goals,
		updatedAt: record.updatedAt ?? new Date().toISOString(),
	};
}

export const historicalStatsApi = {
	getHistoricalStats: async () => {
		const records = await apiClient.get<ApiHistoricalStatsRecord[]>("/stats/historical");
		return records.map(fromApiRecord);
	},
	updateHistoricalStats: async (playerId: string, stats: HistoricalStatsUpdate) => {
		const record = await apiClient.put<ApiHistoricalStatsRecord>(
			`/stats/historical/${playerId}`,
			stats
		);

		return fromApiRecord(record);
	},
};
