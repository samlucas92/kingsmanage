import { describe, expect, it } from "vitest";

import {
	createDifferenceOverlayPixels,
	parsePlayerPortraitDefinition,
	playerPortraitDefaultDefinition,
	playerPortraitDefaultSource,
} from "./templates/playerPortraitTemplate";

describe("player portrait circle overlay", () => {
	it("keeps changed pixels and makes the shared template transparent", () => {
		const withCircle = new Uint8ClampedArray([
			255, 215, 0, 255,
			20, 40, 60, 255,
		]);
		const withoutCircle = new Uint8ClampedArray([
			20, 40, 60, 255,
			20, 40, 60, 255,
		]);

		expect(createDifferenceOverlayPixels(withCircle, withoutCircle)).toEqual(
			new Uint8ClampedArray([
				255, 215, 0, 255,
				20, 40, 60, 0,
			])
		);
	});

	it("ignores tiny compression differences outside the circle", () => {
		const withCircle = new Uint8ClampedArray([52, 61, 70, 255]);
		const withoutCircle = new Uint8ClampedArray([48, 60, 72, 255]);

		expect(createDifferenceOverlayPixels(withCircle, withoutCircle)[3]).toBe(0);
	});

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
