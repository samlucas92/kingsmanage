import { describe, expect, it } from "vitest";
import type { Match } from "../stores/match";
import { getPlayerStatsSummary } from "./statsService";

const playerId = "sam-lucas";
const selectedSeasonId = "2026-2027";

function createMatch({
	seasonId = selectedSeasonId,
	competition = "League",
	competitionType = "league",
	goals = 0,
}: {
	seasonId?: string;
	competition?: string;
	competitionType?: Match["competitionType"];
	goals?: number;
} = {}) {
	return {
		id: crypto.randomUUID(),
		seasonId,
		team: "first",
		opponent: "Rovers",
		competition,
		competitionType,
		date: "2026-09-01T14:00:00.000Z",
		venue: "home",
		state: "won",
		isCompleted: true,
		isLineupLocked: true,
		selectedFormation: "4-4-2",
		postponements: [],
		selectedPlayers: [{ playerId, area: "pitch", positionIndex: 0 }],
		playerStats: [
			{
				playerId,
				appearanceType: "started",
				goals,
				assists: 0,
				yellowCards: 0,
				redCards: 0,
				minutes: 90,
				isMOTM: false,
				note: "",
			},
		],
	} satisfies Match;
}

describe("getPlayerStatsSummary", () => {
	it("adds only selected-season competitive stats to the historical baseline", () => {
		const summary = getPlayerStatsSummary({
			playerId,
			playerName: "Sam Lucas",
			selectedSeasonId,
			preSeasonStats: { appearances: 276, goals: 55 },
			matches: [
				createMatch({ goals: 1 }),
				createMatch({ competition: "Friendly", competitionType: "friendly", goals: 5 }),
				createMatch({ seasonId: "2025-2026", goals: 2 }),
			],
		});

		expect(summary).toMatchObject({
			preSeasonApps: 276,
			preSeasonGoals: 55,
			seasonApps: 1,
			seasonGoals: 1,
			trackedCareerApps: 1,
			trackedCareerGoals: 1,
			careerApps: 277,
			careerGoals: 56,
		});
	});

	it("recognises legacy competition labels as friendlies", () => {
		const summary = getPlayerStatsSummary({
			playerId,
			playerName: "Sam Lucas",
			selectedSeasonId,
			preSeasonStats: { appearances: 276, goals: 55 },
			matches: [
				createMatch({ competition: "Pre-season Friendly", competitionType: undefined, goals: 3 }),
			],
		});

		expect(summary.seasonApps).toBe(0);
		expect(summary.careerGoals).toBe(55);
	});
});
