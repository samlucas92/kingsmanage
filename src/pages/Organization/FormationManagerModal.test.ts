import { describe, expect, it } from "vitest";
import { getFormationPosition } from "./formationEditor";

describe("formation editor positioning", () => {
	const surface = { left: 100, top: 50, width: 400, height: 500 };

	it("converts a pointer location into internal formation coordinates", () => {
		expect(getFormationPosition(300, 300, surface)).toEqual({
			x: 50,
			y: 50,
		});
	});

	it("keeps dragged positions inside the visible playing surface", () => {
		expect(getFormationPosition(0, 1_000, surface)).toEqual({
			x: 5,
			y: 95,
		});
	});
});
