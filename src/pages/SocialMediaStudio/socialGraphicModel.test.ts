import { describe, expect, it } from "vitest";

import type { ClubTeamProfile } from "../../stores/clubTeams";
import type { Match } from "../../stores/match";
import type { Player } from "../../stores/players";
import {
	aggregateScorers,
	applySocialFixtureOverride,
	getClubScore,
	getDefaultHeadline,
	getOpponentScore,
	toSocialFixture,
} from "./socialGraphicModel";

const teamProfiles: ClubTeamProfile[] = [
	{
		id: "team-1",
		displayName: "Under 18s",
		shortName: "U18",
		isActive: true,
		sortOrder: 0,
		competitions: [],
	},
];

function createMatch(overrides: Partial<Match> = {}): Match {
	return {
		id: "match-1",
		seasonId: "season-1",
		team: "team-1",
		opponent: "Riverside",
		competition: "League",
		date: "2026-08-10T14:00:00.000Z",
		venue: "home",
		location: "Colts Ground",
		state: "upcoming",
		isCompleted: false,
		isLineupLocked: false,
		selectedFormation: "4-3-3",
		postponements: [],
		selectedPlayers: [],
		...overrides,
	};
}

describe("social graphic model", () => {
	it("maps match records to template-safe fixture data", () => {
		const fixture = toSocialFixture(createMatch(), teamProfiles);

		expect(fixture).toEqual({
			id: "match-1",
			teamName: "Under 18s",
			opponent: "Riverside",
			competition: "League",
			date: "2026-08-10T14:00:00.000Z",
			venue: "home",
			location: "Colts Ground",
			playerOfTheMatch: "",
			result: undefined,
			scorers: [],
		});
	});

	it("uses the marked match award to seed the editable Player of the Match name", () => {
		const players: Player[] = [
			{ id: "player-1", name: "Alex Smith", positions: [], appearances: 0, number: 9, isActive: true },
		];
		const fixture = toSocialFixture(createMatch({
			playerStats: [
				{ playerId: "player-1", goals: 1, assists: 0, yellowCards: 0, redCards: 0, minutes: 90, isMOTM: true, note: "" },
			],
		}), teamProfiles, players);

		expect(fixture.playerOfTheMatch).toBe("Alex Smith");
		expect(applySocialFixtureOverride(fixture, { playerOfTheMatch: "A. Smith" }).playerOfTheMatch).toBe("A. Smith");
	});

	it("applies graphic-only copy and score overrides without changing the match fixture", () => {
		const fixture = toSocialFixture(
			createMatch({ result: { homeGoals: 2, awayGoals: 1 } }),
			teamProfiles
		);
		const editedFixture = applySocialFixtureOverride(fixture, {
			opponent: "Riverside Athletic",
			competition: "County Cup",
			date: "2026-08-10T19:30",
			location: "Colts Ground, High Street, Kingsbridge",
			homeGoals: 4,
		});

		expect(editedFixture).toMatchObject({
			opponent: "Riverside Athletic",
			competition: "County Cup",
			date: "2026-08-10T19:30",
			location: "Colts Ground, High Street, Kingsbridge",
			result: { homeGoals: 4, awayGoals: 1 },
		});
		expect(fixture).toMatchObject({
			opponent: "Riverside",
			competition: "League",
			location: "Colts Ground",
			result: { homeGoals: 2, awayGoals: 1 },
		});
	});

	it("groups duplicate scorer records and keeps one total per player", () => {
		const players: Player[] = [
			{ id: "player-1", name: "Alex Smith", positions: [], appearances: 0, number: 9, isActive: true },
			{ id: "player-2", name: "Jamie Jones", positions: [], appearances: 0, number: 10, isActive: true },
		];
		const match = createMatch({
			playerStats: [
				{ playerId: "player-1", goals: 1, assists: 0, yellowCards: 0, redCards: 0, minutes: 45, isMOTM: false, note: "" },
				{ playerId: "player-1", goals: 2, assists: 0, yellowCards: 0, redCards: 0, minutes: 45, isMOTM: false, note: "" },
				{ playerId: "player-2", goals: 1, assists: 0, yellowCards: 0, redCards: 0, minutes: 90, isMOTM: false, note: "" },
			],
		});

		expect(aggregateScorers(match, players)).toEqual([
			{ playerId: "player-1", name: "Alex Smith", goals: 3 },
			{ playerId: "player-2", name: "Jamie Jones", goals: 1 },
		]);
	});

	it("presents completed scores from the club perspective", () => {
		const homeFixture = toSocialFixture(
			createMatch({ result: { homeGoals: 3, awayGoals: 1 } }),
			teamProfiles
		);
		const awayFixture = toSocialFixture(
			createMatch({ venue: "away", result: { homeGoals: 2, awayGoals: 4 } }),
			teamProfiles
		);

		expect(getClubScore(homeFixture)).toBe(3);
		expect(getOpponentScore(homeFixture)).toBe(1);
		expect(getClubScore(awayFixture)).toBe(4);
		expect(getOpponentScore(awayFixture)).toBe(2);
	});

	it("provides stable default headlines for every graphic type", () => {
		expect(getDefaultHeadline("upcomingFixtures")).toBe("Fixtures");
		expect(getDefaultHeadline("fixture")).toBe("Matchday");
		expect(getDefaultHeadline("result")).toBe("Full time");
	});
});
