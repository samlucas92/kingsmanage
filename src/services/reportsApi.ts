import { apiClient } from "./apiClient";
import type { ClubEventType } from "../types/events";

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
};
