import { describe, expect, it } from "vitest";

import { upcomingEditorialDefaultDefinition } from "./templates/upcomingEditorialTemplate";
import {
	getUpcomingTemplateElements,
	updateUpcomingTemplateElement,
} from "./upcomingTemplateElements";

describe("upcoming fixture visual template elements", () => {
	it("describes the editable regions from the bundled definition", () => {
		const elements = getUpcomingTemplateElements(
			upcomingEditorialDefaultDefinition,
			true
		);

		expect(elements.map((element) => element.id)).toEqual([
			"section-heading",
			"headline",
			"club-crest",
			"fixture-list",
			"sponsor-section",
		]);
		expect(elements.find((element) => element.id === "club-crest")).toMatchObject({
			x: 1000,
			y: 45,
			width: 285,
			height: 345,
		});
	});

	it("moves a fixture-list group and keeps its child columns aligned", () => {
		const definition = updateUpcomingTemplateElement(
			upcomingEditorialDefaultDefinition,
			"fixture-list",
			{ x: 82, y: 452, width: 1200, height: 800 }
		);

		expect(definition.fixtureList).toMatchObject({ top: 452, bottom: 1252 });
		expect(definition.fixtureRow).toMatchObject({
			frameX: 82,
			frameWidth: 1200,
			calendarX: 122,
			locationX: 1050,
		});
	});

	it("resizes and moves the sponsor section as a three-card group", () => {
		const definition = updateUpcomingTemplateElement(
			upcomingEditorialDefaultDefinition,
			"sponsor-section",
			{ x: 80, y: 1280, width: 1200, height: 300 }
		);

		expect(definition.sponsors).toMatchObject({
			top: 1314,
			titleX: 680,
			cardX: 80,
			cardWidth: (1200 - 70) / 3,
			cardHeight: 210,
		});
	});
});
