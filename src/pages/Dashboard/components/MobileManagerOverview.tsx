import { Link } from "react-router-dom";

import type { Match } from "../../../stores/match";
import { formatCurrency } from "../../../utils/format";
import { getVenueLabel } from "../../../utils/matches";

type AvailabilitySummary = {
	available: number;
	declined: number;
	unanswered: number;
};

export default function MobileManagerOverview({
	availability,
	financeOutstanding,
	isAdmin,
	nextMatch,
	recentMatches,
}: {
	availability: AvailabilitySummary;
	financeOutstanding: number;
	isAdmin: boolean;
	nextMatch?: Match;
	recentMatches: Match[];
}) {
	const responseTotal =
		availability.available + availability.declined + availability.unanswered;
	const availabilityPercentage =
		responseTotal > 0 ? Math.round((availability.available / responseTotal) * 100) : 0;

	return (
		<div className="space-y-3 lg:hidden">
			<section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
				<div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
					<h2 className="text-sm font-black text-slate-950">Next match</h2>
					{nextMatch?.competition && (
						<span className="max-w-[55%] truncate rounded-full bg-yepset-50 px-2.5 py-1 text-[10px] font-black text-yepset-800">
							{nextMatch.competition}
						</span>
					)}
				</div>

				{nextMatch ? (
					<div className="p-4">
						<div className="flex items-center gap-3">
							<div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-yepset-700 text-white shadow-sm">
								<OpponentIcon />
							</div>

							<div className="min-w-0 flex-1">
								<p className="truncate text-lg font-black tracking-[-.02em] text-slate-950">
									vs {nextMatch.opponent}
								</p>
								<p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
									<CalendarIcon />
									{formatMatchDate(nextMatch.date)}
								</p>
								<p className="mt-1 flex items-center gap-1.5 truncate text-xs font-semibold text-slate-600">
									<LocationIcon />
									{getVenueLabel(nextMatch.venue)}
									{nextMatch.location ? ` · ${nextMatch.location}` : ""}
								</p>
							</div>

							<div className="shrink-0 text-center">
								<p className="text-2xl font-black text-slate-950">
									{availability.available}
									<span className="text-base text-yepset-600">/{responseTotal}</span>
								</p>
								<p className="text-[9px] font-bold text-slate-500">Available</p>
							</div>
						</div>

						<div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
							<div
								className="h-full rounded-full bg-yepset-600"
								style={{ width: `${availabilityPercentage}%` }}
							/>
						</div>

						<div className="mt-4 grid grid-cols-2 gap-2.5">
							<Link
								to={`/matches/${nextMatch.id}`}
								className="flex min-h-11 items-center justify-center rounded-xl bg-yepset-700 px-3 text-sm font-black text-white"
							>
								View match
							</Link>
							<Link
								to={`/matches/${nextMatch.id}`}
								className="flex min-h-11 items-center justify-center rounded-xl border border-yepset-600 bg-white px-3 text-sm font-black text-yepset-700"
							>
								Pick team
							</Link>
						</div>
					</div>
				) : (
					<p className="px-4 py-6 text-sm text-slate-500">
						No upcoming fixtures in the active season.
					</p>
				)}
			</section>

			<section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
				<h2 className="text-sm font-black text-slate-950">Availability summary</h2>
				<div className="mt-4 grid grid-cols-3 divide-x divide-slate-100">
					<AvailabilityMetric
						count={availability.available}
						icon="✓"
						label="Available"
						tone="good"
					/>
					<AvailabilityMetric
						count={availability.unanswered}
						icon="?"
						label="Unanswered"
						tone="waiting"
					/>
					<AvailabilityMetric
						count={availability.declined}
						icon="×"
						label="Unavailable"
						tone="bad"
					/>
				</div>
			</section>

			<section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
				<div className="flex items-center justify-between px-4 py-3">
					<h2 className="text-sm font-black text-slate-950">Recent matches</h2>
					<Link to="/matches" className="text-xs font-black text-yepset-700">
						View all
					</Link>
				</div>

				{recentMatches.length > 0 ? (
					<div className="divide-y divide-slate-100 border-t border-slate-100">
						{recentMatches.map((match) => (
							<Link
								key={match.id}
								to={`/matches/${match.id}`}
								className="flex items-center gap-3 px-4 py-3"
							>
								<span className="w-14 shrink-0 text-[10px] font-bold text-slate-500">
									{formatShortDate(match.date)}
								</span>
								<span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-800">
									vs {match.opponent}
								</span>
								{match.result && (
									<span className="rounded-md bg-yepset-50 px-2 py-1 text-xs font-black text-yepset-800">
										{match.result.homeGoals} - {match.result.awayGoals}
									</span>
								)}
							</Link>
						))}
					</div>
				) : (
					<p className="border-t border-slate-100 px-4 py-5 text-sm text-slate-500">
						No completed results in the active season.
					</p>
				)}
			</section>

			{isAdmin && (
				<Link
					to="/finance"
					className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
				>
					<div>
						<p className="text-sm font-black text-slate-950">Finance attention</p>
						<p className="mt-1 text-xs font-semibold text-slate-500">Open balances and payments</p>
					</div>
					<p className={`font-black ${financeOutstanding > 0 ? "text-red-700" : "text-yepset-700"}`}>
						{formatCurrency(financeOutstanding)}
					</p>
				</Link>
			)}
		</div>
	);
}

function AvailabilityMetric({
	count,
	icon,
	label,
	tone,
}: {
	count: number;
	icon: string;
	label: string;
	tone: "good" | "waiting" | "bad";
}) {
	const toneClass =
		tone === "good"
			? "bg-green-600"
			: tone === "waiting"
				? "bg-amber-400"
				: "bg-red-600";

	return (
		<div className="flex flex-col items-center px-1 text-center">
			<span className={`grid h-7 w-7 place-items-center rounded-full text-sm font-black text-white ${toneClass}`}>
				{icon}
			</span>
			<strong className="mt-1.5 text-base text-slate-950">{count}</strong>
			<span className="text-[9px] font-bold text-slate-500">{label}</span>
		</div>
	);
}

function formatMatchDate(value: string) {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "Date TBC";
	}

	return date.toLocaleString("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function formatShortDate(value: string) {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "TBC";
	}

	return date.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
	});
}

function OpponentIcon() {
	return (
		<svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
			<path d="M12 3 5 6v5c0 4.7 2.9 8.2 7 10 4.1-1.8 7-5.3 7-10V6l-7-3Z" />
			<path d="m9 11 2 2 4-4" />
		</svg>
	);
}

function CalendarIcon() {
	return (
		<svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
			<path d="M7 3v3m10-3v3M4 9h16M5 5h14v15H5z" />
		</svg>
	);
}

function LocationIcon() {
	return (
		<svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
			<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
			<circle cx="12" cy="10" r="2.5" />
		</svg>
	);
}
