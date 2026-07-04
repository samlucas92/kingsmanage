import { describe, expect, it } from "vitest";

import { calculateMonthlyPrice } from "./billingCalculator";

describe("subscription pricing", () => {
	it.each([
		[1, 15],
		[2, 20],
		[5, 35],
	])("prices %i clubs incrementally", (clubs, expected) => {
		expect(calculateMonthlyPrice(clubs, 15, 5)).toBe(expected);
	});
});
