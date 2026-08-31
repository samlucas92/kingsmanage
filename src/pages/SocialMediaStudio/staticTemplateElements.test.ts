import { describe, expect, it } from "vitest";

import { getStaticTemplateElements } from "./staticTemplateElements";
import { playerPortraitDefaultDefinition } from "./templates/playerPortraitTemplate";

describe("static player portrait canvas elements", () => {
	it("keeps decorative full-canvas layers from intercepting player editing", () => {
		const elements = getStaticTemplateElements(
			"player-portrait-club",
			playerPortraitDefaultDefinition,
			false
		);

		expect(elements.map((element) => element.id)).toEqual([
			"player-image",
			"player-name",
			"shirt-number",
		]);
		expect(elements.find((element) => element.id === "player-image")?.allowOverflow)
			.toBe(true);
	});
});
