import { describe, expect, it } from "vitest";

import type { Match } from "./match";
import { mergeMatchSummaries } from "./match";

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

describe("match summary merging", () => {
	it("keeps loaded match details while refreshing same-day selection summaries", () => {
		const summary = createMatch({ selectedPlayerIds: ["player-1"] });
		const detail = createMatch({
			isDetailLoaded: true,
			selectedPlayers: [{ playerId: "player-2", area: "bench" }],
		});

		const [merged] = mergeMatchSummaries([summary], [detail]);

		expect(merged.isDetailLoaded).toBe(true);
		expect(merged.selectedPlayers).toEqual([
			{ playerId: "player-2", area: "bench" },
		]);
		expect(merged.selectedPlayerIds).toEqual(["player-2"]);
	});
});
