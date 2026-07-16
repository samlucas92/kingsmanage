import { describe, expect, it } from "vitest";
import type { Match } from "../../../stores/match";
import type { ClubEvent } from "../../../types/events";
import {
	getAverageAvailabilityByEvent,
	getCompletedReportMatches,
	getMonthlyResultBreakdown,
	getResultBreakdown,
} from "./reportCalculations";

describe("report calculations", () => {
	it("filters completed matches by season and team", () => {
		const matches = [
			createMatch({ id: "one", seasonId: "2026", team: "first", state: "won" }),
			createMatch({ id: "two", seasonId: "2026", team: "second", state: "won" }),
			createMatch({ id: "three", seasonId: "2025", team: "first", state: "won" }),
			createMatch({ id: "four", seasonId: "2026", team: "first", isCompleted: false }),
		];

		const filteredMatches = getCompletedReportMatches(matches, "2026", "first");

		expect(filteredMatches.map((match) => match.id)).toEqual(["one"]);
	});

	it("filters completed matches by competition, venue and date range", () => {
		const matches = [
			createMatch({ id: "league-home", competition: "League", venue: "home", date: "2026-08-03T14:00:00.000Z" }),
			createMatch({ id: "cup-home", competition: "Cup", venue: "home", date: "2026-08-10T14:00:00.000Z" }),
			createMatch({ id: "league-away", competition: "League", venue: "away", date: "2026-08-17T14:00:00.000Z" }),
			createMatch({ id: "late-league-home", competition: "League", venue: "home", date: "2026-09-03T14:00:00.000Z" }),
		];

		const filteredMatches = getCompletedReportMatches(matches, "2026", "all", {
			competition: "League",
			venue: "home",
			dateFrom: "2026-08-01",
			dateTo: "2026-08-31",
		});

		expect(filteredMatches.map((match) => match.id)).toEqual(["league-home"]);
	});

	it("calculates goals from the club perspective for home and away matches", () => {
		const matches = [
			createMatch({
				id: "home-win",
				venue: "home",
				result: { homeGoals: 3, awayGoals: 1 },
			}),
			createMatch({
				id: "away-draw",
				venue: "away",
				result: { homeGoals: 2, awayGoals: 2 },
			}),
			createMatch({
				id: "away-loss",
				venue: "away",
				result: { homeGoals: 4, awayGoals: 1 },
			}),
		];

		expect(getResultBreakdown(matches)).toMatchObject({
			played: 3,
			won: 1,
			drawn: 1,
			lost: 1,
			goalsFor: 6,
			goalsAgainst: 7,
			goalDifference: -1,
		});
	});

	it("groups result and goal data by month", () => {
		const breakdown = getMonthlyResultBreakdown([
			createMatch({ id: "one", date: "2026-08-03T14:00:00.000Z", state: "won", result: { homeGoals: 2, awayGoals: 0 } }),
			createMatch({ id: "two", date: "2026-08-10T14:00:00.000Z", state: "draw", result: { homeGoals: 1, awayGoals: 1 } }),
			createMatch({ id: "three", date: "2026-09-03T14:00:00.000Z", state: "lost", result: { homeGoals: 0, awayGoals: 3 } }),
		]);

		expect(breakdown).toEqual([
			{ label: "Aug", wins: 1, draws: 1, losses: 0, goalsFor: 3, goalsAgainst: 1 },
			{ label: "Sept", wins: 0, draws: 0, losses: 1, goalsFor: 0, goalsAgainst: 3 },
		]);
	});

	it("calculates average availability responses per event", () => {
		const averages = getAverageAvailabilityByEvent([
			createEvent({
				id: "training-one",
				availabilityResponses: [
					{ playerId: "one", status: "Available", updatedAt: "2026-08-01T09:00:00.000Z" },
					{ playerId: "two", status: "Available", updatedAt: "2026-08-01T09:00:00.000Z" },
					{ playerId: "three", status: "Declined", updatedAt: "2026-08-01T09:00:00.000Z" },
				],
			}),
			createEvent({
				id: "training-two",
				availabilityResponses: [
					{ playerId: "one", status: "Available", updatedAt: "2026-08-08T09:00:00.000Z" },
					{ playerId: "two", status: "Unanswered", updatedAt: "2026-08-08T09:00:00.000Z" },
				],
			}),
		]);

		expect(averages).toEqual({
			Available: 1.5,
			Declined: 0.5,
			Unanswered: 0.5,
		});
	});
});

function createMatch(input: Partial<Match>): Match {
	return {
		id: "match",
		seasonId: "2026",
		team: "first",
		opponent: "Opposition",
		competition: "League",
		date: "2026-08-03T14:00:00.000Z",
		venue: "home",
		location: "Home",
		state: "won",
		result: { homeGoals: 1, awayGoals: 0 },
		isCompleted: true,
		isLineupLocked: false,
		selectedFormation: "4-4-2",
		notes: {
			availability: "",
			tactical: "",
			injuries: "",
			general: "",
		},
		postponements: [],
		selectedPlayers: [],
		playerStats: [],
		...input,
	};
}

function createEvent(input: Partial<ClubEvent>): ClubEvent {
	return {
		id: "event",
		type: "Training",
		teamScope: "Both",
		title: "Training",
		description: "",
		startDateTime: "2026-08-03T18:00:00.000Z",
		endDateTime: null,
		location: "Training ground",
		recurrenceSeriesId: null,
		recurrence: null,
		matchLinks: [],
		availabilityResponses: [],
		seenBy: [],
		createdAt: "2026-08-01T09:00:00.000Z",
		updatedAt: "2026-08-01T09:00:00.000Z",
		...input,
	};
}
