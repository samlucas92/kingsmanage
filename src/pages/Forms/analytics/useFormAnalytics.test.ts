import { describe, expect, it } from "vitest";

import { calculateEngagedDelta, formAnalyticsInactivityMs } from "./useFormAnalytics";

describe("form analytics engaged time", () => {
	it("counts time while visible, focused, and recently active", () => {
		expect(calculateEngagedDelta({ now: 5_000, lastTick: 0, lastActivity: 0, isVisible: true, isFocused: true })).toBe(5_000);
	});

	it("stops counting when hidden or unfocused", () => {
		expect(calculateEngagedDelta({ now: 5_000, lastTick: 0, lastActivity: 0, isVisible: false, isFocused: true })).toBe(0);
		expect(calculateEngagedDelta({ now: 5_000, lastTick: 0, lastActivity: 0, isVisible: true, isFocused: false })).toBe(0);
	});

	it("counts only the active portion of a tick crossing the inactivity threshold", () => {
		expect(calculateEngagedDelta({
			now: formAnalyticsInactivityMs + 5_000,
			lastTick: formAnalyticsInactivityMs - 5_000,
			lastActivity: 0,
			isVisible: true,
			isFocused: true,
		})).toBe(5_000);
	});
});
