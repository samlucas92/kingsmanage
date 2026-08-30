import { describe, expect, it } from "vitest";

import {
	createUpcomingEditorialTemplate,
	getUpcomingFixtureRowLayouts,
	parseUpcomingEditorialDefinition,
	serializeUpcomingEditorialDefinition,
	upcomingEditorialDefaultDefinition,
	upcomingEditorialDefaultSource,
} from "./upcomingEditorialTemplate";

describe("editable upcoming fixtures template", () => {
	it("round-trips the bundled definition", () => {
		const definition = parseUpcomingEditorialDefinition(
			upcomingEditorialDefaultSource
		);

		expect(definition).toEqual(upcomingEditorialDefaultDefinition);
		expect(serializeUpcomingEditorialDefinition(definition)).toBe(
			upcomingEditorialDefaultSource
		);
	});

	it("creates a canvas template from a valid custom definition", () => {
		const definition = {
			...upcomingEditorialDefaultDefinition,
			canvas: {
				...upcomingEditorialDefaultDefinition.canvas,
				height: 1700,
				sponsorFreeHeight: 1350,
			},
		};

		const template = createUpcomingEditorialTemplate(definition);

		expect(template).toMatchObject({
			id: "upcoming-editorial-gold",
			width: 1365,
			height: 1700,
		});
		expect(template.resolveHeight?.({
			kind: "upcomingFixtures",
			clubName: "Club",
			clubHandle: "@club",
			headline: "Fixtures",
			footer: "Come on",
			fixtures: [],
			fields: { showSponsors: false },
			assets: { sponsors: [] },
		})).toBe(1350);
	});

	it("distributes fixture rows evenly for each selected fixture count", () => {
		const twoRows = getUpcomingFixtureRowLayouts(
			upcomingEditorialDefaultDefinition,
			2
		);
		const fiveRows = getUpcomingFixtureRowLayouts(
			upcomingEditorialDefaultDefinition,
			5
		);
		const eightRows = getUpcomingFixtureRowLayouts(
			upcomingEditorialDefaultDefinition,
			8
		);
		const fixtureList = upcomingEditorialDefaultDefinition.fixtureList;

		const twoRowTopGap = twoRows[0].y - fixtureList.top;
		const twoRowMiddleGap = twoRows[1].y -
			(twoRows[0].y + twoRows[0].height);
		const twoRowBottomGap = fixtureList.bottom -
			(twoRows[1].y + twoRows[1].height);
		expect(twoRowTopGap).toBeCloseTo(twoRowMiddleGap);
		expect(twoRowTopGap).toBeCloseTo(twoRowBottomGap);

		const fiveRowTopGap = fiveRows[0].y - fixtureList.top;
		const fiveRowBottomGap = fixtureList.bottom -
			(fiveRows[4].y + fiveRows[4].height);
		expect(fiveRowTopGap).toBeCloseTo(fixtureList.compactRowGap);
		expect(fiveRowBottomGap).toBeCloseTo(fiveRowTopGap);
		expect(twoRowTopGap).toBeGreaterThan(fiveRowTopGap);

		expect(eightRows).toHaveLength(8);
		expect(eightRows.every((row) => row.height > 0)).toBe(true);
		expect(eightRows.slice(1).every((row, index) => (
			row.y > eightRows[index].y + eightRows[index].height
		))).toBe(true);
		const eightRowTopGap = eightRows[0].y - fixtureList.top;
		const eightRowBottomGap = fixtureList.bottom -
			(eightRows[7].y + eightRows[7].height);
		expect(eightRowTopGap).toBeCloseTo(eightRowBottomGap);
	});

	it("rejects missing required layout values", () => {
		const candidate = JSON.parse(upcomingEditorialDefaultSource);
		delete candidate.header.logoX;

		expect(() => parseUpcomingEditorialDefinition(
			JSON.stringify(candidate)
		)).toThrow("template.header.logoX is required.");
	});

	it("migrates browser drafts created before nested row positioning", () => {
		const candidate = JSON.parse(upcomingEditorialDefaultSource);
		delete candidate.fixtureRow.calendarYRatio;
		delete candidate.fixtureRow.locationIconSize;
		delete candidate.fixtureRow.competitionX;
		delete candidate.fixtureRow.competitionWidth;
		delete candidate.fixtureRow.venueX;
		delete candidate.fixtureRow.venueWidth;
		delete candidate.fixtureRowOverrides;

		const definition = parseUpcomingEditorialDefinition(JSON.stringify(candidate));

		expect(definition.fixtureRow.calendarYRatio).toBe(0.28);
		expect(definition.fixtureRow.locationIconSize).toBe(40);
		expect(definition.fixtureRow.competitionX).toBe(205);
		expect(definition.fixtureRow.venueWidth).toBe(235);
		expect(definition.fixtureRowOverrides).toEqual([]);
	});

	it("rejects unsupported schema versions and invalid colours", () => {
		const unsupportedVersion = {
			...upcomingEditorialDefaultDefinition,
			version: 2,
		};
		const invalidColour = {
			...upcomingEditorialDefaultDefinition,
			theme: {
				...upcomingEditorialDefaultDefinition.theme,
				accent: "gold",
			},
		};

		expect(() => parseUpcomingEditorialDefinition(
			JSON.stringify(unsupportedVersion)
		)).toThrow("template.version must be 1.");
		expect(() => parseUpcomingEditorialDefinition(
			JSON.stringify(invalidColour)
		)).toThrow("template.theme.accent must be a six-digit hex colour.");
	});
});
