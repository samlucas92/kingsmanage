import { apiClient } from "./apiClient";
import type { ClubEventType } from "../types/events";
import type { PlayerStatsRecord } from "./statsApi";

type ReportsVenueFilter = "all" | "home" | "away";

export type AvailabilityStatusBreakdown = {
	available: number;
	declined: number;
	unanswered: number;
};

export type EventTypeAvailabilityBreakdown = {
	type: ClubEventType;
	completedEvents: number;
	totals: AvailabilityStatusBreakdown;
	averages: AvailabilityStatusBreakdown;
};

export type MonthlyAvailabilityBreakdown = {
	label: string;
	monthStart: string;
	completedEvents: number;
	totals: AvailabilityStatusBreakdown;
	averages: AvailabilityStatusBreakdown;
};

export type AvailabilityReportResponse = {
	completedEvents: number;
	totalResponses: number;
	availablePercentage: number;
	totals: AvailabilityStatusBreakdown;
	averages: AvailabilityStatusBreakdown;
	eventTypes: EventTypeAvailabilityBreakdown[];
	months: MonthlyAvailabilityBreakdown[];
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

export type HomeAwayBreakdown = {
	home: ResultBreakdown;
	away: ResultBreakdown;
};

export type MonthlyResultBreakdown = {
	label: string;
	monthStart: string;
	wins: number;
	draws: number;
	losses: number;
	goalsFor: number;
	goalsAgainst: number;
};

export type TeamPerformanceReportResponse = {
	summary: ResultBreakdown;
	homeAway: HomeAwayBreakdown;
	months: MonthlyResultBreakdown[];
	recentForm: Array<"W" | "D" | "L">;
};

export type PlayerStatsSummary = {
	activePlayers: number;
	appearances: number;
	goals: number;
	assists: number;
	contributions: number;
	minutes: number;
};

export type PlayerContribution = {
	playerId: string;
	playerName: string;
	goals: number;
	assists: number;
	contributions: number;
	appearances: number;
};

export type PlayerUsage = {
	playerId: string;
	playerName: string;
	appearances: number;
	starts: number;
	bench: number;
	unusedSubstitutes: number;
	minutes: number;
	goals: number;
	assists: number;
};

export type PlayerDiscipline = {
	playerId: string;
	playerName: string;
	yellowCards: number;
	redCards: number;
	totalCards: number;
};

export type DisciplineReportResponse = {
	yellowCards: number;
	redCards: number;
	totalCards: number;
	players: PlayerDiscipline[];
};

export type PlayerReportsResponse = {
	summary: PlayerStatsSummary;
	players: PlayerStatsRecord[];
	topContributors: PlayerContribution[];
	squadUsage: PlayerUsage[];
	discipline: DisciplineReportResponse;
};

export type MonthlyFinanceBreakdown = {
	label: string;
	monthStart: string;
	collected: number;
	charged: number;
};

export type FinanceReportResponse = {
	expected: number;
	collected: number;
	outstanding: number;
	paidPercentage: number;
	playersOwing: number;
	projectedCollected: number;
	projectedShortfall: number;
	dailyPace: number;
	requiredDailyPace: number;
	elapsedPercentage: number;
	months: MonthlyFinanceBreakdown[];
};

export type OverviewReportResponse = {
	teamPerformance: TeamPerformanceReportResponse;
	availability: AvailabilityReportResponse;
	finance?: FinanceReportResponse | null;
	activePlayers: number;
	topContributors: PlayerContribution[];
};

export const reportsApi = {
	getAvailabilityReport: ({
		seasonId,
		eventType,
	}: {
		seasonId: string;
		eventType?: ClubEventType;
	}) => {
		const params = new URLSearchParams({ seasonId });

		if (eventType) {
			params.set("eventType", eventType);
		}

		return apiClient.get<AvailabilityReportResponse>(
			`/reports/availability?${params.toString()}`
		);
	},

	getTeamPerformanceReport: ({
		seasonId,
		teamId,
		competition,
		venue,
		dateFrom,
		dateTo,
	}: {
		seasonId: string;
		teamId: string;
		competition?: string;
		venue?: ReportsVenueFilter;
		dateFrom?: string;
		dateTo?: string;
	}) => {
		const params = new URLSearchParams({ seasonId });

		if (teamId && teamId !== "all") {
			params.set("teamId", teamId);
		}

		if (competition && competition !== "all") {
			params.set("competition", competition);
		}

		if (venue && venue !== "all") {
			params.set("venue", venue === "home" ? "Home" : "Away");
		}

		if (dateFrom) {
			params.set("dateFrom", dateFrom);
		}

		if (dateTo) {
			params.set("dateTo", dateTo);
		}

		return apiClient.get<TeamPerformanceReportResponse>(
			`/reports/team-performance?${params.toString()}`
		);
	},

	getOverviewReport: (params: ReportFilterParams) =>
		apiClient.get<OverviewReportResponse>(
			`/reports/overview?${buildReportParams(params).toString()}`
		),

	getPlayerReports: ({
		seasonId,
		teamId,
		playerId,
	}: {
		seasonId: string;
		teamId?: string;
		playerId?: string;
	}) => {
		const params = new URLSearchParams({ seasonId });

		if (teamId && teamId !== "all") {
			params.set("teamId", teamId);
		}

		if (playerId && playerId !== "all") {
			params.set("playerId", playerId);
		}

		return apiClient.get<PlayerReportsResponse>(
			`/reports/players?${params.toString()}`
		);
	},

	getFinanceReport: (seasonId: string) =>
		apiClient.get<FinanceReportResponse>(
			`/reports/finance?${new URLSearchParams({ seasonId }).toString()}`
		),
};

type ReportFilterParams = {
	seasonId: string;
	teamId?: string;
	competition?: string;
	venue?: ReportsVenueFilter;
	dateFrom?: string;
	dateTo?: string;
};

function buildReportParams({
	seasonId,
	teamId,
	competition,
	venue,
	dateFrom,
	dateTo,
}: ReportFilterParams) {
	const params = new URLSearchParams({ seasonId });

	if (teamId && teamId !== "all") {
		params.set("teamId", teamId);
	}

	if (competition && competition !== "all") {
		params.set("competition", competition);
	}

	if (venue && venue !== "all") {
		params.set("venue", venue === "home" ? "Home" : "Away");
	}

	if (dateFrom) {
		params.set("dateFrom", dateFrom);
	}

	if (dateTo) {
		params.set("dateTo", dateTo);
	}

	return params;
}
