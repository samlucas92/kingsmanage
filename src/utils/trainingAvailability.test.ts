import { describe, expect, it } from "vitest";
import type { ClubEvent, ClubEventAvailabilityStatus } from "../types/events";
import {
	getCompletedTrainingEvents,
	getTrainingAvailabilitySummary,
} from "./trainingAvailability";

const playerId = "player-1";

describe("training availability", () => {
	it("ignores training events that have not happened yet", () => {
		const events = [
			createTrainingEvent("past-available", "2026-07-01T18:00:00.000Z", "Available"),
			createTrainingEvent("future-declined", "2026-07-20T18:00:00.000Z", "Declined"),
		];

		const summary = getTrainingAvailabilitySummary({
			playerId,
			events,
			seasonStartDate: "2026-07-01T00:00:00.000Z",
			seasonEndDate: "2026-07-31T23:59:59.000Z",
			untilDate: "2026-08-01T00:00:00.000Z",
			now: "2026-07-15T12:00:00.000Z",
		});

		expect(summary).toEqual({
			total: 1,
			available: 1,
			declined: 0,
			unanswered: 0,
			percentage: 100,
		});
	});

	it("returns only completed training events for reports", () => {
		const events = [
			createTrainingEvent("past", "2026-07-01T18:00:00.000Z", "Available"),
			createTrainingEvent("future", "2026-07-20T18:00:00.000Z", "Available"),
			createEvent("social", "Social", "2026-07-01T18:00:00.000Z"),
		];

		const completedEvents = getCompletedTrainingEvents({
			events,
			seasonStartDate: "2026-07-01T00:00:00.000Z",
			seasonEndDate: "2026-07-31T23:59:59.000Z",
			now: "2026-07-15T12:00:00.000Z",
		});

		expect(completedEvents.map((event) => event.id)).toEqual(["past"]);
	});
});

function createTrainingEvent(
	id: string,
	startDateTime: string,
	status: ClubEventAvailabilityStatus
): ClubEvent {
	return {
		...createEvent(id, "Training", startDateTime),
		availabilityResponses: [
			{
				playerId,
				status,
				updatedAt: "2026-07-01T18:00:00.000Z",
			},
		],
	};
}

function createEvent(
	id: string,
	type: ClubEvent["type"],
	startDateTime: string
): ClubEvent {
	return {
		id,
		type,
		teamScope: "Both",
		title: type,
		description: "",
		startDateTime,
		endDateTime: null,
		location: "",
		matchLinks: [],
		availabilityResponses: [],
		seenBy: [],
		createdAt: startDateTime,
		updatedAt: startDateTime,
	};
}
