import { describe, expect, it } from "vitest";

import type { Match } from "../../stores/match";
import { getSameDaySelectionsByPlayer } from "./sameDaySelections";

function createMatch(overrides: Partial<Match> = {}): Match {
	return {
		id: "match-1",
		team: "team-1",
		opponent: "Opposition",
		date: "2026-09-02T10:00:00.000Z",
		venue: "home",
		state: "upcoming",
		isCompleted: false,
		isLineupLocked: false,
		selectedFormation: "4-3-3",
		postponements: [],
		selectedPlayers: [],
		...overrides,
	};
}

describe("same-day match selections", () => {
	it("links other matches on the same day and keeps doubles informational", () => {
		const currentMatch = createMatch();
		const otherMatch = createMatch({
			id: "match-2",
			team: "team-2",
			opponent: "Other opposition",
			date: "2026-09-02T15:00:00.000Z",
			selectedPlayerIds: ["player-1"],
		});

		expect(getSameDaySelectionsByPlayer(
			[currentMatch, otherMatch],
			currentMatch
		)["player-1"]).toEqual([expect.objectContaining({
			matchId: "match-2",
			team: "team-2",
		})]);
	});

	it("ignores matches on other days and postponed fixtures", () => {
		const currentMatch = createMatch();
		const selections = getSameDaySelectionsByPlayer([
			currentMatch,
			createMatch({
				id: "match-2",
				date: "2026-09-03T10:00:00.000Z",
				selectedPlayerIds: ["player-1"],
			}),
			createMatch({
				id: "match-3",
				state: "postponed",
				selectedPlayerIds: ["player-2"],
			}),
		], currentMatch);

		expect(selections).toEqual({});
	});
});
