import { describe, expect, it } from "vitest";

import {
	createUpcomingEditorialTemplate,
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

	it("rejects missing required layout values", () => {
		const candidate = JSON.parse(upcomingEditorialDefaultSource);
		delete candidate.header.logoX;

		expect(() => parseUpcomingEditorialDefinition(
			JSON.stringify(candidate)
		)).toThrow("template.header.logoX is required.");
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
