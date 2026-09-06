import { describe, expect, it } from "vitest";
import type { MatchTimelineEvent, SelectedPlayer } from "../../../../stores/match";
import { deriveMatchStatsFromEvents } from "./matchEventsDraft";

const selectedPlayers: SelectedPlayer[] = [
	{ playerId: "starter", area: "pitch" },
	{ playerId: "creator", area: "pitch" },
	{ playerId: "substitute", area: "bench" },
];

describe("deriveMatchStatsFromEvents", () => {
	it("assumes starters who are not substituted play the full match", () => {
		const stats = deriveMatchStatsFromEvents(selectedPlayers, [], 90);

		expect(stats.find((stat) => stat.playerId === "starter")).toMatchObject({
			appearanceType: "started",
			minutes: 90,
		});
		expect(stats.find((stat) => stat.playerId === "substitute")).toMatchObject({
			appearanceType: "unusedSubstitute",
			minutes: 0,
		});
	});

	it("calculates substitutions and aggregates timed events", () => {
		const events: MatchTimelineEvent[] = [
			{ id: "goal", type: "goal", minute: 20, playerId: "starter", secondaryPlayerId: "creator" },
			{ id: "card", type: "yellowCard", minute: 42, playerId: "starter" },
			{ id: "sub", type: "substitution", minute: 65, playerId: "substitute", secondaryPlayerId: "starter" },
		];

		const stats = deriveMatchStatsFromEvents(selectedPlayers, events, 90);

		expect(stats.find((stat) => stat.playerId === "starter")).toMatchObject({
			goals: 1,
			yellowCards: 1,
			minutes: 65,
		});
		expect(stats.find((stat) => stat.playerId === "creator")?.assists).toBe(1);
		expect(stats.find((stat) => stat.playerId === "substitute")).toMatchObject({
			appearanceType: "substituteUsed",
			minutes: 25,
		});
	});
});
