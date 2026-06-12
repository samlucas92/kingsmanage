import { apiClient } from "./apiClient";

export type PlayerStatsRecord = {
	playerId: string;
	playerName: string;
	isActive: boolean;
	firstTeamApps: number;
	firstTeamGoals: number;
	secondTeamApps: number;
	secondTeamGoals: number;
	seasonApps: number;
	seasonGoals: number;
	preSeasonApps: number;
	preSeasonGoals: number;
	trackedCareerApps: number;
	trackedCareerGoals: number;
	careerApps: number;
	careerGoals: number;
	assists: number;
	starts: number;
	bench: number;
	motm: number;
	minutes: number;
	yellowCards: number;
	redCards: number;
};

export type HistoricalStatsInput = {
	appearances: number;
	goals: number;
};

export const statsApi = {
	getSeasonStats: (seasonId: string) =>
		apiClient.get<PlayerStatsRecord[]>(
			`/stats/season/${encodeURIComponent(seasonId)}`
		),
	recalculateSeasonStats: (seasonId: string) =>
		apiClient.post<void>(
			`/stats/season/${encodeURIComponent(seasonId)}/recalculate`,
			undefined
		),
	updateHistoricalStats: (playerId: string, stats: HistoricalStatsInput) =>
		apiClient.put(
			`/stats/historical/${encodeURIComponent(playerId)}`,
			stats
		),
};
