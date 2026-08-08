import { describe, expect, it } from "vitest";

import type { ClubTeamProfile } from "../../stores/clubTeams";
import type { Match } from "../../stores/match";
import {
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
			result: undefined,
		});
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
		expect(getDefaultHeadline("upcomingFixtures")).toBe("Upcoming fixtures");
		expect(getDefaultHeadline("fixture")).toBe("Matchday");
		expect(getDefaultHeadline("result")).toBe("Full time");
	});
});
