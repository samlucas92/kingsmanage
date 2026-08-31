import { describe, expect, it } from "vitest";

import type { Match } from "../stores/match";
import type { ClubEvent } from "../types/events";
import {
	buildClubCalendar,
	getCalendarConflictIds,
	getFixtureActions,
	getMatchdayWorkflow,
} from "./fixtureWorkflow";

function createMatch(overrides: Partial<Match> = {}): Match {
	return {
		id: "match-1",
		clubEventId: "event-1",
		team: "team-1",
		opponent: "United",
		competition: "League",
		date: "2026-09-05T14:00:00.000Z",
		venue: "home",
		location: "The Hut",
		state: "upcoming",
		isCompleted: false,
		isLineupLocked: false,
		selectedFormation: "4-3-3",
		postponements: [],
		selectedPlayers: [],
		...overrides,
	};
}

function createEvent(overrides: Partial<ClubEvent> = {}): ClubEvent {
	return {
		id: "event-1",
		type: "Match",
		teamScope: "First",
		title: "First Team vs United",
		description: "League",
		startDateTime: "2026-09-05T14:00:00.000Z",
		endDateTime: "2026-09-05T16:00:00.000Z",
		location: "The Hut",
		matchLinks: [{ team: "First", matchId: "match-1" }],
		availabilityResponses: [],
		seenBy: [],
		createdAt: "2026-08-01T00:00:00.000Z",
		updatedAt: "2026-08-01T00:00:00.000Z",
		...overrides,
	};
}

describe("fixture workflow", () => {
	it("deduplicates a linked match and event into one calendar item", () => {
		const items = buildClubCalendar([createMatch()], [createEvent()]);
		expect(items).toHaveLength(1);
		expect(items[0].match?.id).toBe("match-1");
		expect(items[0].event?.id).toBe("event-1");
	});

	it("marks overlapping items for the same team as conflicts", () => {
		const items = buildClubCalendar(
			[createMatch(), createMatch({ id: "match-2", clubEventId: null, date: "2026-09-05T15:00:00.000Z" })],
			[createEvent()]
		);
		expect(getCalendarConflictIds(items).size).toBe(2);
	});

	it("creates explainable actions for an unlinked upcoming match", () => {
		const actions = getFixtureActions(
			[createMatch({ clubEventId: null })],
			[],
			new Date("2026-09-03T14:00:00.000Z")
		);
		expect(actions.some((action) => action.title.includes("calendar event missing"))).toBe(true);
		expect(actions.some((action) => action.title.includes("squad not selected"))).toBe(true);
	});

	it("starts the matchday workflow by linking the calendar event", () => {
		const workflow = getMatchdayWorkflow(
			createMatch({ clubEventId: null }),
			undefined,
			Array.from({ length: 18 }, (_, index) => `player-${index + 1}`),
			new Date("2026-09-01T12:00:00.000Z")
		);

		expect(workflow.nextAction.id).toBe("link-event");
		expect(workflow.stages[0].status).toBe("Needs attention");
	});

	it("directs an upcoming linked fixture to outstanding availability", () => {
		const workflow = getMatchdayWorkflow(
			createMatch(),
			createEvent({
				availabilityResponses: [
					{ playerId: "player-1", status: "Available", updatedAt: "2026-09-01T12:00:00.000Z" },
				],
			}),
			Array.from({ length: 18 }, (_, index) => `player-${index + 1}`),
			new Date("2026-09-01T12:00:00.000Z")
		);

		expect(workflow.nextAction.id).toBe("availability");
		expect(workflow.stages[1].detail).toBe("1 available · 17 awaiting");
	});

	it("moves through squad, lineup and communications using existing match state", () => {
		const completeAvailability = createEvent({
			availabilityResponses: [
				{ playerId: "player-1", status: "Available", updatedAt: "2026-09-01T12:00:00.000Z" },
			],
		});
		const elevenStarters = Array.from({ length: 11 }, (_, index) => ({
			playerId: `player-${index + 1}`,
			area: "pitch" as const,
		}));

		expect(getMatchdayWorkflow(createMatch(), completeAvailability, ["player-1"], new Date("2026-09-01T12:00:00.000Z")).nextAction.id).toBe("squad");
		expect(getMatchdayWorkflow(createMatch({ selectedPlayers: elevenStarters }), completeAvailability, ["player-1"], new Date("2026-09-01T12:00:00.000Z")).nextAction.id).toBe("lineup");
		expect(getMatchdayWorkflow(createMatch({ selectedPlayers: elevenStarters, isLineupLocked: true }), completeAvailability, ["player-1"], new Date("2026-09-01T12:00:00.000Z")).nextAction.id).toBe("communications");
	});

	it("prioritises the result after kickoff and stats after completion", () => {
		const elevenStarters = Array.from({ length: 11 }, (_, index) => ({
			playerId: `player-${index + 1}`,
			area: "pitch" as const,
		}));
		const match = createMatch({ selectedPlayers: elevenStarters, isLineupLocked: true });
		const event = createEvent();
		const afterKickoff = new Date("2026-09-05T17:00:00.000Z");

		expect(getMatchdayWorkflow(match, event, [], afterKickoff).nextAction.id).toBe("result");
		expect(getMatchdayWorkflow({ ...match, isCompleted: true, state: "won" }, event, [], afterKickoff).nextAction.id).toBe("stats");
		expect(getMatchdayWorkflow({ ...match, selectedPlayers: [], isCompleted: true, state: "won", clubEventId: null }, undefined, [], afterKickoff).nextAction.id).toBe("stats");
	});
});
