import type { Player } from "../../../stores/players";
import type { Match } from "../../../stores/match";
import type { ClubEvent, ClubEventAvailabilityStatus } from "../../../types/events";
import type { FinanceSummary } from "../../../services/financeService";
import type { PlayerStatsRecord } from "../../../services/statsApi";

export type ReportsTeamFilter = "all" | string;
export type ReportsVenueFilter = "all" | "home" | "away";

export type ReportMatchFilters = {
	competition?: string;
	venue?: ReportsVenueFilter;
	dateFrom?: string;
	dateTo?: string;
};

export type ResultBreakdown = {
	played: number;
	won: number;
	drawn: number;
	lost: number;
	goalsFor: number;
	goalsAgainst: number;
	goalDifference: number;
	winPercentage: number;
	averageGoalsFor: number;
	averageGoalsAgainst: number;
};

export type FormResult = "W" | "D" | "L";

export type MonthlyResultBreakdown = {
	label: string;
	wins: number;
	draws: number;
	losses: number;
	goalsFor: number;
	goalsAgainst: number;
};

export type AvailabilitySummary = {
	totalResponses: number;
	available: number;
	declined: number;
	unanswered: number;
	availablePercentage: number;
};

export type AverageAvailabilitySummary = Record<ClubEventAvailabilityStatus, number>;

const availabilityStatuses: ClubEventAvailabilityStatus[] = ["Available", "Declined", "Unanswered"];

export function getCompletedReportMatches(
	matches: Match[],
	seasonId: string,
	teamId: ReportsTeamFilter = "all",
	filters: ReportMatchFilters = {}
) {
	return matches
		.filter((match) => {
			if (!match.isCompleted || match.state === "postponed") {
				return false;
			}

			if (seasonId && match.seasonId !== seasonId) {
				return false;
			}

			if (teamId !== "all" && match.team !== teamId) {
				return false;
			}

			if (filters.competition && filters.competition !== "all") {
				const matchCompetition = match.competition?.trim() || "No competition";

				if (matchCompetition !== filters.competition) {
					return false;
				}
			}

			if (filters.venue && filters.venue !== "all" && match.venue !== filters.venue) {
				return false;
			}

			const matchTime = new Date(match.date).getTime();

			if (filters.dateFrom) {
				const fromTime = new Date(filters.dateFrom).getTime();

				if (!Number.isNaN(fromTime) && matchTime < fromTime) {
					return false;
				}
			}

			if (filters.dateTo) {
				const toTime = new Date(`${filters.dateTo}T23:59:59`).getTime();

				if (!Number.isNaN(toTime) && matchTime > toTime) {
					return false;
				}
			}

			return true;
		})
		.sort(
			(firstMatch, secondMatch) =>
				new Date(firstMatch.date).getTime() - new Date(secondMatch.date).getTime()
		);
}

export function getResultBreakdown(matches: Match[]): ResultBreakdown {
	const result = matches.reduce(
		(summary, match) => {
			const matchGoals = getMatchGoals(match);

			if (!matchGoals) {
				return summary;
			}

			const didWin = matchGoals.for > matchGoals.against;
			const didDraw = matchGoals.for === matchGoals.against;

			return {
				played: summary.played + 1,
				won: summary.won + (didWin ? 1 : 0),
				drawn: summary.drawn + (didDraw ? 1 : 0),
				lost: summary.lost + (!didWin && !didDraw ? 1 : 0),
				goalsFor: summary.goalsFor + matchGoals.for,
				goalsAgainst: summary.goalsAgainst + matchGoals.against,
			};
		},
		{
			played: 0,
			won: 0,
			drawn: 0,
			lost: 0,
			goalsFor: 0,
			goalsAgainst: 0,
		}
	);

	return {
		...result,
		goalDifference: result.goalsFor - result.goalsAgainst,
		winPercentage: result.played > 0 ? Math.round((result.won / result.played) * 1000) / 10 : 0,
		averageGoalsFor: result.played > 0 ? roundToTwo(result.goalsFor / result.played) : 0,
		averageGoalsAgainst: result.played > 0 ? roundToTwo(result.goalsAgainst / result.played) : 0,
	};
}

export function getRecentForm(matches: Match[], limit = 6): FormResult[] {
	return matches
		.filter((match) => Boolean(getMatchGoals(match)))
		.slice(-limit)
		.map((match) => {
			const matchGoals = getMatchGoals(match);

			if (!matchGoals) {
				return "D";
			}

			if (matchGoals.for > matchGoals.against) {
				return "W";
			}

			return matchGoals.for === matchGoals.against ? "D" : "L";
		});
}

export function getMonthlyResultBreakdown(matches: Match[]): MonthlyResultBreakdown[] {
	const monthMap = new Map<string, MonthlyResultBreakdown & { timestamp: number }>();

	matches.forEach((match) => {
		const matchGoals = getMatchGoals(match);

		if (!matchGoals) {
			return;
		}

		const date = new Date(match.date);
		const key = `${date.getFullYear()}-${date.getMonth()}`;
		const existing = monthMap.get(key) ?? {
			label: date.toLocaleDateString("en-GB", { month: "short" }),
			timestamp: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
			wins: 0,
			draws: 0,
			losses: 0,
			goalsFor: 0,
			goalsAgainst: 0,
		};

		existing.goalsFor += matchGoals.for;
		existing.goalsAgainst += matchGoals.against;

		if (matchGoals.for > matchGoals.against) {
			existing.wins += 1;
		} else if (matchGoals.for === matchGoals.against) {
			existing.draws += 1;
		} else {
			existing.losses += 1;
		}

		monthMap.set(key, existing);
	});

	return [...monthMap.values()]
		.sort((firstMonth, secondMonth) => firstMonth.timestamp - secondMonth.timestamp)
		.map(({ timestamp: _timestamp, ...month }) => month);
}

export function getHomeAwayBreakdown(matches: Match[]) {
	return {
		home: getResultBreakdown(matches.filter((match) => match.venue === "home")),
		away: getResultBreakdown(matches.filter((match) => match.venue === "away")),
	};
}

export function getTopPlayers(stats: PlayerStatsRecord[], limit = 3) {
	const activeStats = stats.filter((playerStats) => playerStats.isActive);

	return {
		goals: topBy(activeStats, "seasonGoals", limit),
		assists: topBy(activeStats, "assists", limit),
		appearances: topBy(activeStats, "seasonApps", limit),
		contributions: [...activeStats]
			.map((playerStats) => ({
				...playerStats,
				contributions: playerStats.seasonGoals + playerStats.assists,
			}))
			.sort((firstPlayer, secondPlayer) => secondPlayer.contributions - firstPlayer.contributions)
			.slice(0, limit),
	};
}

export function getAvailabilitySummary({
	events,
	seasonStartDate,
	seasonEndDate,
}: {
	events: ClubEvent[];
	seasonStartDate?: string;
	seasonEndDate?: string;
}): AvailabilitySummary {
	const seasonStart = seasonStartDate ? new Date(seasonStartDate).getTime() : Number.NEGATIVE_INFINITY;
	const seasonEnd = seasonEndDate ? new Date(seasonEndDate).getTime() : Number.POSITIVE_INFINITY;
	const completedEvents = events.filter((event) => {
		const eventTime = new Date(event.startDateTime).getTime();
		return eventTime <= Date.now() && eventTime >= seasonStart && eventTime <= seasonEnd;
	});

	const responses = completedEvents.flatMap((event) => event.availabilityResponses ?? []);
	const available = responses.filter((response) => response.status === "Available").length;
	const declined = responses.filter((response) => response.status === "Declined").length;
	const unanswered = responses.filter((response) => response.status === "Unanswered").length;
	const totalResponses = responses.length;

	return {
		totalResponses,
		available,
		declined,
		unanswered,
		availablePercentage: totalResponses > 0 ? Math.round((available / totalResponses) * 100) : 0,
	};
}

export function getAverageAvailabilityByEvent(events: ClubEvent[]): AverageAvailabilitySummary {
	const statusCounts = events
		.flatMap((event) => event.availabilityResponses ?? [])
		.reduce<Record<ClubEventAvailabilityStatus, number>>(
			(counts, response) => ({
				...counts,
				[response.status]: counts[response.status] + 1,
			}),
			{
				Available: 0,
				Declined: 0,
				Unanswered: 0,
			}
		);

	return availabilityStatuses.reduce<AverageAvailabilitySummary>(
		(averages, status) => ({
			...averages,
			[status]: events.length > 0 ? roundToOne(statusCounts[status] / events.length) : 0,
		}),
		{
			Available: 0,
			Declined: 0,
			Unanswered: 0,
		}
	);
}

export function getActivePlayerCount(players: Player[]) {
	return players.filter((player) => player.isActive).length;
}

export function getFinanceReportSummary(financeSummary?: FinanceSummary) {
	if (!financeSummary) {
		return null;
	}

	return {
		expected: financeSummary.totalExpected,
		collected: financeSummary.totalPaid,
		outstanding: financeSummary.totalOutstanding,
		playersOwing: financeSummary.playersOwingMoney.length,
	};
}

function getMatchGoals(match: Match) {
	if (!match.result) {
		return null;
	}

	return match.venue === "home"
		? { for: match.result.homeGoals, against: match.result.awayGoals }
		: { for: match.result.awayGoals, against: match.result.homeGoals };
}

function topBy(
	stats: PlayerStatsRecord[],
	key: keyof Pick<PlayerStatsRecord, "seasonGoals" | "assists" | "seasonApps">,
	limit: number
) {
	return [...stats]
		.sort((firstPlayer, secondPlayer) => secondPlayer[key] - firstPlayer[key])
		.slice(0, limit);
}

function roundToTwo(value: number) {
	return Math.round(value * 100) / 100;
}

function roundToOne(value: number) {
	return Math.round(value * 10) / 10;
}
