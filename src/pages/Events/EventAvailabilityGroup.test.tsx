import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ClubEvent } from "../../types/events";
import { EventAvailabilityGroup } from "./EventAvailabilityGroup";

const event: ClubEvent = {
	id: "event-1",
	type: "Training",
	teamScope: "Both",
	title: "Training",
	description: "",
	startDateTime: "2026-07-03T18:00:00Z",
	location: "The Rec",
	matchLinks: [],
	availabilityResponses: [
		{
			playerId: "player-1",
			status: "Available",
			updatedAt: "2026-07-02T12:00:00Z",
		},
	],
	seenBy: [],
	createdAt: "2026-07-01T12:00:00Z",
	updatedAt: "2026-07-02T12:00:00Z",
};

const players = [
	{
		id: "player-1",
		name: "Alex Morgan",
		number: 9,
		positions: ["ST"],
		appearances: 0,
		isActive: true,
	},
];

describe("EventAvailabilityGroup", () => {
	it("shows player availability without controls to a player", () => {
		const html = renderToStaticMarkup(
			<EventAvailabilityGroup
				event={event}
				isManagementRole={false}
				label="Available"
				onAvailabilityChange={async () => undefined}
				players={players}
			/>
		);

		expect(html).toContain("Alex Morgan");
		expect(html).toContain("Available");
		expect(html).not.toContain("<button");
	});

	it("shows management controls to a manager", () => {
		const html = renderToStaticMarkup(
			<EventAvailabilityGroup
				event={event}
				isManagementRole
				label="Available"
				onAvailabilityChange={async () => undefined}
				players={players}
			/>
		);

		expect(html).toContain("<button");
		expect(html).toContain("Unanswered");
	});
});
