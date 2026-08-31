import type { ClubCalendarItem } from "../../utils/fixtureWorkflow";

export type CalendarFilter = "All" | "Match" | "Training" | "Meeting" | "Social";

export function startOfLocalDay(date: Date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfLocalMonth(date: Date) {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isSameLocalMonth(first: Date, second: Date) {
	return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth();
}

export function getLocalDateKey(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export function getItemsForMonth(
	items: ClubCalendarItem[],
	month: Date,
	filter: CalendarFilter
) {
	return items.filter((item) => {
		const date = new Date(item.start);
		return isSameLocalMonth(date, month) && (filter === "All" || item.kind === filter);
	});
}

export function getListItems(
	items: ClubCalendarItem[],
	month: Date,
	today: Date,
	filter: CalendarFilter
) {
	const monthItems = getItemsForMonth(items, month, filter);
	if (!isSameLocalMonth(month, today)) return monthItems;

	const todayStart = startOfLocalDay(today).getTime();
	return monthItems.filter((item) => startOfLocalDay(new Date(item.start)).getTime() >= todayStart);
}

export function buildMonthGrid(month: Date) {
	const firstDay = startOfLocalMonth(month);
	const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate();
	const days: Array<Date | null> = Array.from({ length: firstDay.getDay() }, () => null);

	for (let day = 1; day <= daysInMonth; day += 1) {
		days.push(new Date(firstDay.getFullYear(), firstDay.getMonth(), day));
	}

	while (days.length % 7 !== 0) days.push(null);
	return days;
}
