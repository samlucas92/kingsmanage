import { describe, expect, it } from "vitest";

import { calculateBackgroundAlpha } from "./backgroundRemoval";

describe("background removal feathering", () => {
	it("fully removes pixels inside the tolerance", () => {
		expect(calculateBackgroundAlpha(255, 40, 50, 20)).toBe(0);
	});

	it("keeps pixels beyond the feathered edge", () => {
		expect(calculateBackgroundAlpha(255, 75, 50, 20)).toBe(255);
	});

	it("creates a soft transparent edge", () => {
		expect(calculateBackgroundAlpha(255, 60, 50, 20)).toBe(128);
	});
});
