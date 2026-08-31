import { describe, expect, it } from "vitest";

import { clampMovedBounds } from "./TemplateCanvasOverlay";
import type { CanvasTemplateElement } from "./TemplateCanvasOverlay";

const playerImage: CanvasTemplateElement = {
	id: "player-image",
	label: "Player image",
	x: 105,
	y: 90,
	width: 1044,
	height: 1164,
	minimumWidth: 48,
	minimumHeight: 32,
	resizeMode: "both",
};

describe("template canvas movement bounds", () => {
	it("keeps ordinary elements within the canvas", () => {
		expect(clampMovedBounds(playerImage, 0, 200, 1254, 1254).y).toBe(90);
	});

	it("allows overflow elements to move beyond an edge while remaining recoverable", () => {
		const overflowPlayer = { ...playerImage, allowOverflow: true };

		expect(clampMovedBounds(overflowPlayer, 0, 200, 1254, 1254).y).toBe(290);
		expect(clampMovedBounds(overflowPlayer, 0, 5000, 1254, 1254).y).toBe(1222);
	});
});
