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
	unusedSubstitutes: number;
	motm: number;
	minutes: number;
	yellowCards: number;
	redCards: number;
	teamStats: Array<{
		teamId: string;
		appearances: number;
		goals: number;
		assists: number;
		minutes: number;
	}>;
};

export type HistoricalStatsInput = {
	appearances: number;
	goals: number;
};

export type SeasonRolloverPlayer = {
	playerId: string;
	playerName: string;
	historicalAppsBefore: number;
	historicalGoalsBefore: number;
	seasonApps: number;
	seasonGoals: number;
	careerAppsAfter: number;
	careerGoalsAfter: number;
};

export type SeasonRolloverPreview = {
	seasonId: string;
	seasonName: string;
	isSeasonActive: boolean;
	isAlreadyRolledOver: boolean;
	canRollOver: boolean;
	rolledOverAt: string | null;
	completedCompetitiveMatches: number;
	incompleteCompetitiveMatches: number;
	affectedPlayers: number;
	appearancesToAdd: number;
	goalsToAdd: number;
	blockingReasons: string[];
	players: SeasonRolloverPlayer[];
};

export type PlayerMatchContribution = {
	matchId: string;
	date: string;
	teamId: string;
	team: string;
	opponent: string;
	competition: string;
	venue: string;
	homeGoals: number;
	awayGoals: number;
	appearanceType: string;
	appearances: number;
	goals: number;
	assists: number;
	minutes: number;
	yellowCards: number;
	redCards: number;
	isMotm: boolean;
};

export type PlayerStatsBreakdown = {
	seasonId: string;
	seasonName: string;
	playerId: string;
	playerName: string;
	isSeasonRolledOver: boolean;
	rolledOverAt: string | null;
	historicalApps: number;
	historicalGoals: number;
	seasonApps: number;
	seasonGoals: number;
	careerApps: number;
	careerGoals: number;
	matches: PlayerMatchContribution[];
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
	getSeasonRolloverPreview: (seasonId: string) =>
		apiClient.get<SeasonRolloverPreview>(
			`/stats/season/${encodeURIComponent(seasonId)}/rollover`
		),
	rollOverSeason: (seasonId: string) =>
		apiClient.post<SeasonRolloverPreview>(
			`/stats/season/${encodeURIComponent(seasonId)}/rollover`,
			undefined
		),
	getPlayerStatsBreakdown: (seasonId: string, playerId: string) =>
		apiClient.get<PlayerStatsBreakdown>(
			`/stats/season/${encodeURIComponent(seasonId)}/players/${encodeURIComponent(playerId)}/breakdown`
		),
	updateHistoricalStats: (playerId: string, stats: HistoricalStatsInput) =>
		apiClient.put(
			`/stats/historical/${encodeURIComponent(playerId)}`,
			stats
		),
};
