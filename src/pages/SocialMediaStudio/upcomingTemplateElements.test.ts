import { describe, expect, it } from "vitest";

import {
	getUpcomingFixtureRowDefinition,
	parseUpcomingEditorialDefinition,
	serializeUpcomingEditorialDefinition,
	setUpcomingFixtureRowUnlocked,
	upcomingEditorialDefaultDefinition,
} from "./templates/upcomingEditorialTemplate";
import {
	getUpcomingTemplateElements,
	getUpcomingTemplateParentId,
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

	it("drills from the fixture list into visible rows and their children", () => {
		const rows = getUpcomingTemplateElements(
			upcomingEditorialDefaultDefinition,
			true,
			2,
			"fixture-list"
		);
		const children = getUpcomingTemplateElements(
			upcomingEditorialDefaultDefinition,
			true,
			2,
			"fixture-row:0"
		);

		expect(rows.map((element) => element.id)).toEqual([
			"fixture-list",
			"fixture-row:0",
			"fixture-row:1",
		]);
		expect(children.map((element) => element.id)).toEqual([
			"fixture-row:0",
			"fixture-calendar:0",
			"fixture-date:0",
			"fixture-competition:0",
			"fixture-crest:0",
			"fixture-versus:0",
			"fixture-opponent:0",
			"fixture-location-icon:0",
			"fixture-venue:0",
			"fixture-location:0",
		]);
		expect(getUpcomingTemplateParentId("fixture-opponent:0")).toBe("fixture-row:0");
		expect(getUpcomingTemplateParentId("fixture-row:0")).toBe("fixture-list");
	});

	it("can unlock one row without changing the shared text layout", () => {
		const unlocked = setUpcomingFixtureRowUnlocked(
			upcomingEditorialDefaultDefinition,
			1,
			true
		);
		const opponent = getUpcomingTemplateElements(
			unlocked,
			true,
			2,
			"fixture-row:1"
		).find((element) => element.id === "fixture-opponent:1");
		const definition = updateUpcomingTemplateElement(
			unlocked,
			"fixture-opponent:1",
			{
				x: opponent?.x ?? 0,
				y: opponent?.y ?? 0,
				width: 130,
				height: opponent?.height ?? 72,
			},
			2
		);

		expect(definition.fixtureRow.opponentWidth).toBe(250);
		expect(getUpcomingFixtureRowDefinition(definition, 0).opponentWidth).toBe(250);
		expect(getUpcomingFixtureRowDefinition(definition, 1).opponentWidth).toBe(130);
		expect(definition.fixtureRowOverrides[1]).toMatchObject({
			unlocked: true,
			values: { opponentWidth: 130 },
		});
		const reparsed = parseUpcomingEditorialDefinition(
			serializeUpcomingEditorialDefinition(definition)
		);
		expect(reparsed.fixtureRowOverrides[0]).toBeNull();
		expect(reparsed.fixtureRowOverrides[1]).toMatchObject({ unlocked: true });

		const relinked = setUpcomingFixtureRowUnlocked(definition, 1, false);
		expect(getUpcomingFixtureRowDefinition(relinked, 1).opponentWidth).toBe(250);
		expect(relinked.fixtureRowOverrides[1]?.values.opponentWidth).toBe(130);
		expect(
			getUpcomingFixtureRowDefinition(
				setUpcomingFixtureRowUnlocked(relinked, 1, true),
				1
			).opponentWidth
		).toBe(130);
	});

	it("edits a selected row child as shared template layout", () => {
		const opponent = getUpcomingTemplateElements(
			upcomingEditorialDefaultDefinition,
			true,
			3,
			"fixture-row:1"
		).find((element) => element.id === "fixture-opponent:1");
		expect(opponent).toBeDefined();

		const definition = updateUpcomingTemplateElement(
			upcomingEditorialDefaultDefinition,
			"fixture-opponent:1",
			{
				x: 700,
				y: (opponent?.y ?? 0) + 12,
				width: 220,
				height: opponent?.height ?? 42,
			},
			3
		);

		expect(definition.fixtureRow.opponentX).toBe(700);
		expect(definition.fixtureRow.opponentWidth).toBe(220);
		expect(definition.fixtureRow.opponentYRatio).toBeGreaterThan(
			upcomingEditorialDefaultDefinition.fixtureRow.opponentYRatio
		);
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
