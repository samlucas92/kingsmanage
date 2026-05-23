import type { Match, MatchPlayerStat } from "../stores/match";
import { DEFAULT_SEASON_ID } from "../data/seedSeasons";
import { getPreSeasonPlayerStats } from "../data/preSeasonPlayerStats";

export type PreSeasonStatsInput = {
	appearances: number;
	goals: number;
};

export type PlayerStatsSummary = {
	preSeasonApps: number;
	preSeasonGoals: number;

	firstTeamApps: number;
	firstTeamGoals: number;

	secondTeamApps: number;
	secondTeamGoals: number;

	seasonApps: number;
	seasonGoals: number;

	trackedCareerApps: number;
	trackedCareerGoals: number;

	careerApps: number;
	careerGoals: number;

	assists: number;
	starts: number;
	bench: number;
	minutes: number;
	motm: number;
	yellowCards: number;
	redCards: number;
};

export type PlayerSeasonAppearance = {
	match: Match;
	area: "pitch" | "bench";
	stat: MatchPlayerStat;
	hasReportDetail: boolean;
};

function createEmptyPlayerStat(playerId: string): MatchPlayerStat {
	return {
		playerId,
		goals: 0,
		assists: 0,
		yellowCards: 0,
		redCards: 0,
		minutes: 0,
		isMOTM: false,
		note: "",
	};
}

function getHistoricalStats({
	playerName,
	preSeasonStats,
}: {
	playerName: string;
	preSeasonStats?: PreSeasonStatsInput;
}) {
	if (preSeasonStats) {
		return preSeasonStats;
	}

	return getPreSeasonPlayerStats(playerName);
}

export function getCompletedMatchesForSeason(
	matches: Match[],
	seasonId: string
) {
	return matches.filter(
		(match) =>
			(match.seasonId ?? DEFAULT_SEASON_ID) === seasonId &&
			match.isCompleted
	);
}

export function getAllCompletedMatches(matches: Match[]) {
	return matches.filter((match) => match.isCompleted);
}

export function getPlayerAppearancesInMatches(
	matches: Match[],
	playerId: string
) {
	return matches.filter((match) =>
		match.selectedPlayers.some(
			(selectedPlayer) => selectedPlayer.playerId === playerId
		)
	).length;
}

export function getPlayerGoalsInMatches(matches: Match[], playerId: string) {
	return matches.reduce((total, match) => {
		const playerStat = match.playerStats?.find(
			(stat) => stat.playerId === playerId
		);

		return total + (playerStat?.goals ?? 0);
	}, 0);
}

export function getPlayerMatchStatsInMatches(
	matches: Match[],
	playerId: string
) {
	return matches.flatMap((match) =>
		(match.playerStats ?? []).filter((stat) => stat.playerId === playerId)
	);
}

export function getPlayerStatsSummary({
	playerId,
	playerName,
	selectedSeasonId,
	matches,
	preSeasonStats,
}: {
	playerId: string;
	playerName: string;
	selectedSeasonId: string;
	matches: Match[];
	preSeasonStats?: PreSeasonStatsInput;
}): PlayerStatsSummary {
	const historicalStats = getHistoricalStats({
		playerName,
		preSeasonStats,
	});

	const completedSeasonMatches = getCompletedMatchesForSeason(
		matches,
		selectedSeasonId
	);

	const allCompletedMatches = getAllCompletedMatches(matches);

	const firstTeamMatches = completedSeasonMatches.filter(
		(match) => match.team === "first"
	);

	const secondTeamMatches = completedSeasonMatches.filter(
		(match) => match.team === "second"
	);

	const firstTeamApps = getPlayerAppearancesInMatches(
		firstTeamMatches,
		playerId
	);

	const secondTeamApps = getPlayerAppearancesInMatches(
		secondTeamMatches,
		playerId
	);

	const firstTeamGoals = getPlayerGoalsInMatches(firstTeamMatches, playerId);
	const secondTeamGoals = getPlayerGoalsInMatches(secondTeamMatches, playerId);

	const seasonApps = firstTeamApps + secondTeamApps;
	const seasonGoals = firstTeamGoals + secondTeamGoals;

	const trackedCareerApps = getPlayerAppearancesInMatches(
		allCompletedMatches,
		playerId
	);

	const trackedCareerGoals = getPlayerGoalsInMatches(
		allCompletedMatches,
		playerId
	);

	const playerSeasonMatchStats = getPlayerMatchStatsInMatches(
		completedSeasonMatches,
		playerId
	);

	const starts = completedSeasonMatches.filter((match) =>
		match.selectedPlayers.some(
			(selectedPlayer) =>
				selectedPlayer.playerId === playerId &&
				selectedPlayer.area === "pitch"
		)
	).length;

	const bench = completedSeasonMatches.filter((match) =>
		match.selectedPlayers.some(
			(selectedPlayer) =>
				selectedPlayer.playerId === playerId &&
				selectedPlayer.area === "bench"
		)
	).length;

	const assists = playerSeasonMatchStats.reduce(
		(total, stat) => total + stat.assists,
		0
	);

	const yellowCards = playerSeasonMatchStats.reduce(
		(total, stat) => total + stat.yellowCards,
		0
	);

	const redCards = playerSeasonMatchStats.reduce(
		(total, stat) => total + stat.redCards,
		0
	);

	const minutes = playerSeasonMatchStats.reduce(
		(total, stat) => total + stat.minutes,
		0
	);

	const motm = playerSeasonMatchStats.filter((stat) => stat.isMOTM).length;

	return {
		preSeasonApps: historicalStats.appearances,
		preSeasonGoals: historicalStats.goals,

		firstTeamApps,
		firstTeamGoals,

		secondTeamApps,
		secondTeamGoals,

		seasonApps,
		seasonGoals,

		trackedCareerApps,
		trackedCareerGoals,

		careerApps: historicalStats.appearances + trackedCareerApps,
		careerGoals: historicalStats.goals + trackedCareerGoals,

		assists,
		starts,
		bench,
		minutes,
		motm,
		yellowCards,
		redCards,
	};
}

export function getRecentPlayerSeasonAppearances({
	playerId,
	selectedSeasonId,
	matches,
	limit = 10,
}: {
	playerId: string;
	selectedSeasonId: string;
	matches: Match[];
	limit?: number;
}): PlayerSeasonAppearance[] {
	const completedSeasonMatches = getCompletedMatchesForSeason(
		matches,
		selectedSeasonId
	);

	return completedSeasonMatches
		.filter((match) =>
			match.selectedPlayers.some(
				(selectedPlayer) => selectedPlayer.playerId === playerId
			)
		)
		.map((match) => {
			const selectedPlayer = match.selectedPlayers.find(
				(selectedPlayer) => selectedPlayer.playerId === playerId
			);

			const stat = (match.playerStats ?? []).find(
				(playerStat) => playerStat.playerId === playerId
			);

			const currentStat = stat ?? createEmptyPlayerStat(playerId);

			return {
				match,
				area: selectedPlayer?.area ?? "bench",
				stat: currentStat,
				hasReportDetail:
					currentStat.goals > 0 ||
					currentStat.assists > 0 ||
					currentStat.yellowCards > 0 ||
					currentStat.redCards > 0 ||
					currentStat.minutes > 0 ||
					currentStat.isMOTM ||
					currentStat.note.trim().length > 0,
			};
		})
		.sort(
			(firstAppearance, secondAppearance) =>
				new Date(secondAppearance.match.date).getTime() -
				new Date(firstAppearance.match.date).getTime()
		)
		.slice(0, limit);
}