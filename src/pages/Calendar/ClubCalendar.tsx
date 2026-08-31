import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useEventStore } from "../../stores/events";
import { useMatchStore } from "../../stores/match";
import { useSeasonStore } from "../../stores/seasons";
import {
	buildClubCalendar,
	getCalendarConflictIds,
	type ClubCalendarItem,
} from "../../utils/fixtureWorkflow";
import {
	buildMonthGrid,
	getItemsForMonth,
	getListItems,
	getLocalDateKey,
	isSameLocalMonth,
	startOfLocalDay,
	startOfLocalMonth,
	type CalendarFilter,
} from "./calendarModel";

type CalendarView = "list" | "calendar";

const filters: CalendarFilter[] = ["All", "Match", "Training", "Meeting", "Social"];
const filterLabels: Record<CalendarFilter, string> = {
	All: "All activity",
	Match: "Matches",
	Training: "Trainings",
	Meeting: "Meetings",
	Social: "Socials",
};
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ClubCalendar() {
	const events = useEventStore((state) => state.events);
	const matches = useMatchStore((state) => state.matches);
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const loadEvents = useEventStore((state) => state.loadEvents);
	const loadMatches = useMatchStore((state) => state.loadMatches);
	const loadSeasons = useSeasonStore((state) => state.loadSeasons);
	const [filter, setFilter] = useState<CalendarFilter>("All");
	const [view, setView] = useState<CalendarView>("list");
	const [today] = useState(() => startOfLocalDay(new Date()));
	const [visibleMonth, setVisibleMonth] = useState(() => startOfLocalMonth(today));
	const [selectedDay, setSelectedDay] = useState("");

	useEffect(() => {
		void loadSeasons();
		void loadEvents();
	}, [loadEvents, loadSeasons]);

	useEffect(() => {
		if (activeSeasonId) void loadMatches(activeSeasonId);
	}, [activeSeasonId, loadMatches]);

	const items = useMemo(() => buildClubCalendar(matches, events), [events, matches]);
	const conflictIds = useMemo(() => getCalendarConflictIds(items), [items]);
	const monthItems = useMemo(
		() => getItemsForMonth(items, visibleMonth, filter),
		[filter, items, visibleMonth]
	);
	const listItems = useMemo(
		() => getListItems(items, visibleMonth, today, filter),
		[filter, items, today, visibleMonth]
	);
	const groupedItems = groupByDay(listItems);

	function moveMonth(offset: number) {
		setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
		setSelectedDay("");
	}

	function goToToday() {
		setVisibleMonth(startOfLocalMonth(today));
		setSelectedDay(getLocalDateKey(today));
	}

	return (
		<div className="space-y-4 lg:space-y-6">
			<header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-xs font-black uppercase tracking-[0.18em] text-yepset-700">Club operations</p>
					<h1 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Club calendar</h1>
					<p className="mt-1 text-sm text-slate-600">Matches and club events in one place, without duplicate fixture entries.</p>
				</div>
				<Link to="/?tab=events" className="rounded-xl bg-yepset-700 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-yepset-800">
					Add event
				</Link>
			</header>

			<section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
				<div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
					<div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
						{filters.map((option) => (
							<button key={option} type="button" onClick={() => setFilter(option)} className={`shrink-0 rounded-full px-3 py-2 text-sm font-bold ${filter === option ? "bg-yepset-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
								{filterLabels[option]}
							</button>
						))}
					</div>
					<div className="flex items-center justify-between gap-2 sm:justify-end">
						<div className="flex rounded-xl bg-slate-100 p-1">
							<ViewButton active={view === "list"} onClick={() => setView("list")}>List</ViewButton>
							<ViewButton active={view === "calendar"} onClick={() => setView("calendar")}>Calendar</ViewButton>
						</div>
						{!isSameLocalMonth(visibleMonth, today) && (
							<button type="button" onClick={goToToday} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Today</button>
						)}
					</div>
				</div>

				<div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
					<button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">‹</button>
					<h2 className="text-base font-black text-slate-950 sm:text-lg">{formatMonth(visibleMonth)}</h2>
					<button type="button" onClick={() => moveMonth(1)} aria-label="Next month" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">›</button>
				</div>
			</section>

			{view === "list" ? (
				<ListView groupedItems={groupedItems} conflictIds={conflictIds} />
			) : (
				<MonthView
					month={visibleMonth}
					items={monthItems}
					today={today}
					selectedDay={selectedDay}
					onSelectDay={setSelectedDay}
					conflictIds={conflictIds}
				/>
			)}
		</div>
	);
}

function ViewButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
	return <button type="button" onClick={onClick} className={`rounded-lg px-3 py-1.5 text-sm font-bold ${active ? "bg-white text-yepset-700 shadow-sm" : "text-slate-500"}`}>{children}</button>;
}

function ListView({ groupedItems, conflictIds }: { groupedItems: Array<[string, ClubCalendarItem[]]>; conflictIds: Set<string> }) {
	if (groupedItems.length === 0) {
		return <EmptyCalendar />;
	}

	return (
		<div className="space-y-5">
			{groupedItems.map(([day, dayItems]) => (
				<section key={day}>
					<h2 className="mb-2 text-sm font-black uppercase tracking-wide text-slate-500">{formatDay(day)}</h2>
					<div className="space-y-2">
						{dayItems.map((item) => <CalendarRow key={item.id} item={item} hasConflict={conflictIds.has(item.id)} />)}
					</div>
				</section>
			))}
		</div>
	);
}

function MonthView({ month, items, today, selectedDay, onSelectDay, conflictIds }: {
	month: Date;
	items: ClubCalendarItem[];
	today: Date;
	selectedDay: string;
	onSelectDay: (day: string) => void;
	conflictIds: Set<string>;
}) {
	const itemsByDay = groupMapByDay(items);
	const defaultSelectedDay = isSameLocalMonth(month, today)
		? getLocalDateKey(today)
		: items.length > 0
			? getLocalDateKey(new Date(items[0].start))
			: getLocalDateKey(month);
	const selectedDayInMonth = selectedDay.startsWith(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`);
	const effectiveSelectedDay = selectedDayInMonth ? selectedDay : defaultSelectedDay;
	const selectedItems = itemsByDay.get(effectiveSelectedDay) ?? [];

	return (
		<section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
			<div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
				{weekdays.map((weekday) => <div key={weekday} className="px-1 py-2 text-center text-[10px] font-black uppercase tracking-wide text-slate-500 sm:text-xs">{weekday}</div>)}
			</div>
			<div className="grid grid-cols-7">
				{buildMonthGrid(month).map((day, index) => {
					if (!day) return <div key={`empty-${index}`} className="min-h-20 border-b border-r border-slate-100 bg-slate-50/60 sm:min-h-28" />;
					const key = getLocalDateKey(day);
					const dayItems = itemsByDay.get(key) ?? [];
					const isPast = day.getTime() < today.getTime();
					const isToday = key === getLocalDateKey(today);
					const isSelected = key === effectiveSelectedDay;
					return (
						<div key={key} className={`min-h-20 border-b border-r border-slate-100 p-1 sm:min-h-28 sm:p-2 ${isPast ? "bg-slate-100/80 text-slate-400" : "bg-white"} ${isSelected ? "ring-2 ring-inset ring-yepset-500" : ""}`}>
							<button type="button" onClick={() => onSelectDay(key)} className={`grid h-7 w-7 place-items-center rounded-full text-xs font-black sm:text-sm ${isToday ? "bg-yepset-700 text-white" : isPast ? "text-slate-400" : "text-slate-700"}`}>
								{day.getDate()}
							</button>
							<div className={`mt-1 flex flex-wrap gap-1 sm:hidden ${isPast ? "opacity-50" : ""}`}>
								{dayItems.slice(0, 4).map((item) => <span key={item.id} className={`h-1.5 w-1.5 rounded-full ${getItemDotClass(item.kind)}`} />)}
							</div>
							<div className={`mt-1 hidden space-y-1 sm:block ${isPast ? "opacity-55" : ""}`}>
								{dayItems.slice(0, 3).map((item) => (
									<Link key={item.id} to={item.to} className="block truncate rounded-md bg-yepset-50 px-1.5 py-1 text-[10px] font-bold text-yepset-800 hover:bg-yepset-100">
										{formatTime(item.start)} {item.title}
									</Link>
								))}
								{dayItems.length > 3 && <button type="button" onClick={() => onSelectDay(key)} className="text-[10px] font-bold text-slate-500">+{dayItems.length - 3} more</button>}
							</div>
						</div>
					);
				})}
			</div>
			<div className="border-t border-slate-200 p-3 sm:hidden">
				<h3 className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">{formatDay(effectiveSelectedDay)}</h3>
				{selectedItems.length === 0 ? (
					<p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No activity on this day.</p>
				) : (
					<div className="space-y-2">{selectedItems.map((item) => <CalendarRow key={item.id} item={item} hasConflict={conflictIds.has(item.id)} />)}</div>
				)}
			</div>
		</section>
	);
}

function EmptyCalendar() {
	return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-500">No calendar items match these filters in this month.</div>;
}

function CalendarRow({ item, hasConflict }: { item: ClubCalendarItem; hasConflict: boolean }) {
	return (
		<Link to={item.to} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-yepset-300 hover:shadow-md">
			<div className="w-14 shrink-0 text-center">
				<p className="text-lg font-black text-slate-950">{formatTime(item.start)}</p>
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-2">
					<span className="rounded-full bg-yepset-50 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-yepset-700">{item.kind}</span>
					{item.match && item.event && <span className="rounded-full bg-green-50 px-2 py-1 text-[11px] font-bold text-green-700">Linked fixture</span>}
					{hasConflict && <span className="rounded-full bg-red-50 px-2 py-1 text-[11px] font-bold text-red-700">Conflict</span>}
				</div>
				<h3 className="mt-1 truncate text-base font-black text-slate-950">{item.title}</h3>
				<p className="mt-1 truncate text-sm text-slate-500">{item.location || "Location not set"}</p>
			</div>
			<span className="self-center text-xl text-slate-400">›</span>
		</Link>
	);
}

function groupByDay(items: ClubCalendarItem[]): Array<[string, ClubCalendarItem[]]> {
	return [...groupMapByDay(items).entries()];
}

function groupMapByDay(items: ClubCalendarItem[]) {
	const groups = new Map<string, ClubCalendarItem[]>();
	for (const item of items) {
		const key = getLocalDateKey(new Date(item.start));
		groups.set(key, [...(groups.get(key) ?? []), item]);
	}
	return groups;
}

function formatTime(value: string) {
	return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatMonth(date: Date) {
	return date.toLocaleDateString([], { month: "long", year: "numeric" });
}

function formatDay(day: string) {
	return new Date(`${day}T12:00:00`).toLocaleDateString([], {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

function getItemDotClass(kind: ClubCalendarItem["kind"]) {
	if (kind === "Match") return "bg-blue-600";
	if (kind === "Training") return "bg-green-600";
	if (kind === "Meeting") return "bg-amber-500";
	return "bg-purple-600";
}
