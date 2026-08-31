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

type CalendarFilter = "All" | "Match" | "Training" | "Meeting" | "Social";

const filters: CalendarFilter[] = ["All", "Match", "Training", "Meeting", "Social"];

export default function ClubCalendar() {
	const events = useEventStore((state) => state.events);
	const matches = useMatchStore((state) => state.matches);
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const loadEvents = useEventStore((state) => state.loadEvents);
	const loadMatches = useMatchStore((state) => state.loadMatches);
	const loadSeasons = useSeasonStore((state) => state.loadSeasons);
	const [filter, setFilter] = useState<CalendarFilter>("All");
	const [showPast, setShowPast] = useState(false);

	useEffect(() => {
		void loadSeasons();
		void loadEvents();
	}, [loadEvents, loadSeasons]);

	useEffect(() => {
		if (activeSeasonId) void loadMatches(activeSeasonId);
	}, [activeSeasonId, loadMatches]);

	const items = useMemo(() => buildClubCalendar(matches, events), [events, matches]);
	const conflictIds = useMemo(() => getCalendarConflictIds(items), [items]);
	const visibleItems = useMemo(() => {
		const now = Date.now();
		return items.filter((item) =>
			(filter === "All" || item.kind === filter) &&
			(showPast || new Date(item.start).getTime() >= now - 2 * 60 * 60 * 1000)
		);
	}, [filter, items, showPast]);
	const groupedItems = groupByDay(visibleItems);

	return (
		<div className="space-y-4 lg:space-y-6">
			<header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-xs font-black uppercase tracking-[0.18em] text-yepset-700">Club operations</p>
					<h1 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Club calendar</h1>
					<p className="mt-1 text-sm text-slate-600">Matches and club events in one agenda, without duplicate fixture entries.</p>
				</div>
				<Link to="/?tab=events" className="rounded-xl bg-yepset-700 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-yepset-800">
					Add event
				</Link>
			</header>

			<section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
				<div className="flex flex-wrap gap-2">
					{filters.map((option) => (
						<button key={option} type="button" onClick={() => setFilter(option)} className={`rounded-full px-3 py-2 text-sm font-bold ${filter === option ? "bg-yepset-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
							{option === "All" ? "All activity" : `${option}s`}
						</button>
					))}
					<button type="button" onClick={() => setShowPast((current) => !current)} className="ml-auto rounded-full border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700">
						{showPast ? "Hide past" : "Show past"}
					</button>
				</div>
			</section>

			{groupedItems.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-500">No calendar items match these filters.</div>
			) : (
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
			)}
		</div>
	);
}

function CalendarRow({ item, hasConflict }: { item: ClubCalendarItem; hasConflict: boolean }) {
	return (
		<Link to={item.to} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-yepset-300 hover:shadow-md">
			<div className="w-14 shrink-0 text-center">
				<p className="text-lg font-black text-slate-950">{new Date(item.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
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

function groupByDay(items: ClubCalendarItem[]) {
	const groups = new Map<string, ClubCalendarItem[]>();
	for (const item of items) {
		const key = new Date(item.start).toISOString().slice(0, 10);
		groups.set(key, [...(groups.get(key) ?? []), item]);
	}
	return [...groups.entries()];
}

function formatDay(day: string) {
	return new Date(`${day}T12:00:00`).toLocaleDateString([], {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}
