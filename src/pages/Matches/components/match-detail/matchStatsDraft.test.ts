import { describe, expect, it } from "vitest";

import type { MatchPlayerStat } from "../../../../stores/match";
import { updateMotmDraft } from "./matchStatsDraft";

function createStat(playerId: string, isMOTM: boolean): MatchPlayerStat {
	return {
		playerId,
		appearanceType: "started",
		goals: 0,
		assists: 0,
		yellowCards: 0,
		redCards: 0,
		minutes: 90,
		isMOTM,
		note: "",
	};
}

describe("match report MOTM selection", () => {
	it("keeps existing winners when another player is selected", () => {
		const updated = updateMotmDraft([
			createStat("player-one", true),
			createStat("player-two", false),
		], "player-two", true);

		expect(updated.filter((stat) => stat.isMOTM).map((stat) => stat.playerId)).toEqual([
			"player-one",
			"player-two",
		]);
	});

	it("only clears the player being unticked", () => {
		const updated = updateMotmDraft([
			createStat("player-one", true),
			createStat("player-two", true),
		], "player-one", false);

		expect(updated.filter((stat) => stat.isMOTM).map((stat) => stat.playerId)).toEqual([
			"player-two",
		]);
	});
});
