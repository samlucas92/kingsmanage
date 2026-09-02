import { describe, expect, it } from "vitest";

import { FIRST_TEAM_ID, SECOND_TEAM_ID } from "../../../stores/clubTeams";
import {
	buildCreateMatchRequest,
	createMatchTeamDraft,
	getLegacyTeamScope,
	summariseMatchLocations,
} from "./eventMatchTeams";

const THIRD_TEAM_ID = "33333333-3333-3333-3333-333333333303";

describe("multi-team event match creation", () => {
	it("uses explicit team ids while retaining legacy scope compatibility", () => {
		expect(getLegacyTeamScope([FIRST_TEAM_ID])).toBe("First");
		expect(getLegacyTeamScope([SECOND_TEAM_ID])).toBe("Second");
		expect(getLegacyTeamScope([FIRST_TEAM_ID, SECOND_TEAM_ID, THIRD_TEAM_ID])).toBe("Both");
	});

	it("creates an independent match request for each team's opponent", () => {
		const firsts = {
			...createMatchTeamDraft(FIRST_TEAM_ID),
			opponent: "Town Firsts",
			competition: "Premier Division",
			location: "Memorial Ground",
		};
		const thirds = {
			...createMatchTeamDraft(THIRD_TEAM_ID),
			opponent: "Town Thirds",
			competition: "Division Three",
			location: "Town Sports Ground",
			venue: "Away" as const,
		};

		const requests = [firsts, thirds].map((draft) => buildCreateMatchRequest({
			draft,
			eventStartDateTime: "2026-09-12T14:00:00.000Z",
			seasonId: "season-1",
		}));

		expect(requests).toEqual([
			expect.objectContaining({
				teamId: FIRST_TEAM_ID,
				opponent: "Town Firsts",
				competition: "Premier Division",
				location: "Memorial Ground",
				venue: "Home",
			}),
			expect.objectContaining({
				teamId: THIRD_TEAM_ID,
				opponent: "Town Thirds",
				competition: "Division Three",
				location: "Town Sports Ground",
				venue: "Away",
			}),
		]);
	});

	it("summarises different team grounds as multiple venues", () => {
		expect(summariseMatchLocations(["Memorial Ground", "Town Sports Ground"]))
			.toBe("Multiple venues");
		expect(summariseMatchLocations([" Memorial Ground ", "memorial ground"]))
			.toBe("Memorial Ground");
	});
});
