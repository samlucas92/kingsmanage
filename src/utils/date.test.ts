import { describe, expect, it } from "vitest";

import { formatDateForInput, toUtcIsoString } from "./date";

describe("date utilities", () => {
	it("round-trips a UTC instant through a local datetime input", () => {
		const instant = "2026-08-09T18:15:00.000Z";
		const localInput = formatDateForInput(instant);

		expect(toUtcIsoString(localInput)).toBe(instant);
	});

	it("preserves an existing UTC timestamp", () => {
		expect(toUtcIsoString("2026-08-09T18:15:00Z")).toBe(
			"2026-08-09T18:15:00.000Z"
		);
	});

	it("rejects invalid timestamps before they reach the API", () => {
		expect(() => toUtcIsoString("not-a-date")).toThrow(
			"Date and time is invalid."
		);
	});
});
