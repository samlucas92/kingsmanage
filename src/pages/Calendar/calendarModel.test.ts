import { describe, expect, it } from "vitest";

import type { ClubCalendarItem } from "../../utils/fixtureWorkflow";
import {
	buildMonthGrid,
	getItemsForMonth,
	getListItems,
	getLocalDateKey,
} from "./calendarModel";

const items: ClubCalendarItem[] = [
	createItem("past", "2026-08-03T18:00:00", "Training"),
	createItem("today", "2026-08-17T09:00:00", "Match"),
	createItem("future", "2026-08-29T15:00:00", "Match"),
	createItem("next-month", "2026-09-02T18:00:00", "Meeting"),
];

describe("calendarModel", () => {
	it("shows today through month end for the current month list", () => {
		const visible = getListItems(items, new Date(2026, 7, 1), new Date(2026, 7, 17, 20), "All");

		expect(visible.map((item) => item.id)).toEqual(["today", "future"]);
	});

	it("shows an entire month after navigating away from the current month", () => {
		const visible = getListItems(items, new Date(2026, 7, 1), new Date(2026, 8, 1), "All");

		expect(visible.map((item) => item.id)).toEqual(["past", "today", "future"]);
	});

	it("filters month items by activity type", () => {
		const visible = getItemsForMonth(items, new Date(2026, 7, 1), "Match");

		expect(visible.map((item) => item.id)).toEqual(["today", "future"]);
	});

	it("builds a complete Sunday-first month grid", () => {
		const days = buildMonthGrid(new Date(2026, 7, 1));

		expect(days).toHaveLength(42);
		expect(days[6] && getLocalDateKey(days[6])).toBe("2026-08-01");
		expect(days[36] && getLocalDateKey(days[36])).toBe("2026-08-31");
	});
});

function createItem(id: string, start: string, kind: ClubCalendarItem["kind"]): ClubCalendarItem {
	return {
		id,
		kind,
		title: id,
		start,
		location: "The Hut",
		team: "First",
		to: `/events/${id}`,
	};
}
