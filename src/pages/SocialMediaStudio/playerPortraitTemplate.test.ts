import { describe, expect, it } from "vitest";

import {
	parsePlayerPortraitDefinition,
	playerPortraitDefaultDefinition,
	playerPortraitDefaultSource,
} from "./templates/playerPortraitTemplate";

describe("player portrait circle overlay", () => {
	it("adds the circle layer to a saved definition from the earlier template", () => {
		const legacyDefinition = JSON.parse(playerPortraitDefaultSource) as {
			elements: Record<string, unknown>;
		};
		delete legacyDefinition.elements["circle-overlay"];

		expect(
			parsePlayerPortraitDefinition(JSON.stringify(legacyDefinition)).elements[
				"circle-overlay"
			]
		).toEqual(playerPortraitDefaultDefinition.elements["circle-overlay"]);
	});
});
