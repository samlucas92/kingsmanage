import { describe, expect, it } from "vitest";

import type { Match } from "../../stores/match";
import { defaultClubTeamProfiles } from "../../stores/clubTeams";
import { parseMatchImportCsv } from "./bulkMatchCsv";

describe("parseMatchImportCsv", () => {
	it("parses quoted fields and UK dates", () => {
		const result = parseMatchImportCsv(
			[
				"date,time,team,opponent,venue,location,competition",
				'05/09/2026,15:00,First Team,Example United,Home,"The Recreation Ground, Main Road",League',
			].join("\n"),
			defaultClubTeamProfiles
		);

		expect(result.fileErrors).toEqual([]);
		expect(result.rows).toHaveLength(1);
		expect(result.rows[0]).toMatchObject({
			date: "2026-09-05",
			time: "15:00",
			teamName: "First Team",
			opponent: "Example United",
			venue: "home",
			location: "The Recreation Ground, Main Road",
			competition: "League",
			errors: [],
		});
	});

	it("returns row-level validation errors", () => {
		const result = parseMatchImportCsv(
			[
				"date,time,team,opponent,venue,location,competition",
				"not-a-date,26:00,Missing Team,,Somewhere,Home,",
			].join("\n"),
			defaultClubTeamProfiles
		);

		expect(result.rows[0].errors).toEqual(expect.arrayContaining([
			"Use a valid date (YYYY-MM-DD or DD/MM/YYYY).",
			"Use a valid 24-hour time (HH:mm).",
			"Team “Missing Team” was not found.",
			"Opponent is required.",
			"Venue must be Home or Away.",
			"Competition is required.",
		]));
	});

	it("flags a match already in the selected season", () => {
		const csv = [
			"date,time,team,opponent,venue,location,competition",
			"2026-09-05,15:00,First Team,Example United,Home,The Rec,League",
		].join("\n");
		const parsed = parseMatchImportCsv(csv, defaultClubTeamProfiles);
		const existingMatch = {
			team: parsed.rows[0].teamId,
			opponent: "Example United",
			date: parsed.rows[0].dateTime,
		} as Match;

		const result = parseMatchImportCsv(csv, defaultClubTeamProfiles, [existingMatch]);

		expect(result.rows[0].errors).toContain(
			"This match already exists in the selected season."
		);
	});

	it("requires every supported column", () => {
		const result = parseMatchImportCsv(
			"date,time,team,opponent\n2026-09-05,15:00,First Team,Example United",
			defaultClubTeamProfiles
		);

		expect(result.rows).toEqual([]);
		expect(result.fileErrors[0]).toContain("venue, location, competition");
	});
});
