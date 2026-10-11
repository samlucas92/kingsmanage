import { describe, expect, it } from "vitest";
import type { MatchTimelineEvent, SelectedPlayer } from "../../../../stores/match";
import { deriveMatchStatsFromEvents, parseMatchEventMinute } from "./matchEventsDraft";

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

describe("parseMatchEventMinute", () => {
	it("keeps an empty minute invalid instead of turning it into zero", () => {
		expect(parseMatchEventMinute("", 90)).toBeNull();
		expect(parseMatchEventMinute("   ", 90)).toBeNull();
	});

	it("accepts minutes within the match and rejects values outside it", () => {
		expect(parseMatchEventMinute("0", 90)).toBe(0);
		expect(parseMatchEventMinute("46", 90)).toBe(46);
		expect(parseMatchEventMinute("91", 90)).toBeNull();
		expect(parseMatchEventMinute("not a minute", 90)).toBeNull();
	});
});
