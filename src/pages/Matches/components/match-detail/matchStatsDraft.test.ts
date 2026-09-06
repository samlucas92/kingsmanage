import { describe, expect, it } from "vitest";

import type { MatchPlayerStat, SelectedPlayer } from "../../../../stores/match";
import {
	buildMatchStatsDraft,
	calculateMinutesPlayed,
	getParticipationMinute,
	updateMotmDraft,
	updateStatsForMatchDuration,
} from "./matchStatsDraft";

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

describe("match report participation", () => {
	it("calculates starter and substitute minutes from event times", () => {
		expect(calculateMinutesPlayed("started", 74, 90)).toBe(74);
		expect(calculateMinutesPlayed("substituteUsed", 62, 90)).toBe(28);
		expect(calculateMinutesPlayed("unusedSubstitute", 62, 90)).toBe(0);
	});

	it("reconstructs a substitution minute from saved minutes", () => {
		const substitute = {
			...createStat("substitute", false),
			appearanceType: "substituteUsed" as const,
			minutes: 28,
		};

		expect(getParticipationMinute(substitute, 90)).toBe(62);
	});

	it("preserves event times when the match length changes", () => {
		const fullMatchStarter = createStat("starter", false);
		const substitute = {
			...createStat("substitute", false),
			appearanceType: "substituteUsed" as const,
			minutes: 25,
		};

		const updated = updateStatsForMatchDuration(
			[fullMatchStarter, substitute],
			90,
			80
		);

		expect(updated[0].minutes).toBe(80);
		expect(updated[1].minutes).toBe(15);
	});

	it("defaults selected starters to a full match and bench players to did not play", () => {
		const selectedPlayers: SelectedPlayer[] = [
			{ playerId: "starter", area: "pitch" },
			{ playerId: "substitute", area: "bench" },
		];

		const draft = buildMatchStatsDraft(selectedPlayers, [], 80);

		expect(draft[0]).toMatchObject({ appearanceType: "started", minutes: 80 });
		expect(draft[1]).toMatchObject({
			appearanceType: "unusedSubstitute",
			minutes: 0,
		});
	});
});
