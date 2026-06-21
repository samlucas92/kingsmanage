import { Link } from "react-router-dom";

import { useAuthStore } from "../../../stores/auth";
import { getClubTeamLabel, useClubTeamStore } from "../../../stores/clubTeams";
import type { ClubEvent, ClubEventAvailabilityStatus } from "../../../types/events";
import { getEventCounts, getPlayerAvailabilityStatus } from "../../../utils/events";

type DashboardEventCardProps = {
	event: ClubEvent;
	currentPlayerId?: string | null;
	onSetAvailability?: (eventId: string, status: ClubEventAvailabilityStatus) => Promise<void>;
};

export default function DashboardEventCard({
	currentPlayerId,
	event,
	onSetAvailability,
}: DashboardEventCardProps) {
	const currentUser = useAuthStore((state) => state.currentUser);
	const teamProfiles = useClubTeamStore((state) => state.profiles);
	const isManagementRole = currentUser?.role === "Admin" || currentUser?.role === "Coach";
	const linkedMatches = getLinkedMatchActions(event);
	const dateSummary = getEventDateSummary(event.startDateTime);
	const canUpdateOwnAvailability = Boolean(currentPlayerId && onSetAvailability);
	const currentStatus = currentPlayerId
		? getPlayerAvailabilityStatus(event, currentPlayerId)
		: "Unanswered";

	const counts = getEventCounts(event);

	return (
		<div className="rounded-xl border border-slate-200 p-4">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start">
				<EventDateBadge summary={dateSummary} />

				<div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap gap-2">
							<Pill label={event.type} />
							<Pill label={event.teamScope === "Both" ? "Both Teams" : getClubTeamLabel(teamProfiles, event.teamScope)} />
							{linkedMatches.length > 0 && <Pill label="Linked match" />}
						</div>

						<Link
							to={`/events/${event.id}`}
							className="mt-2 block text-lg font-bold text-slate-900 hover:text-blue-700"
						>
							{event.title}
						</Link>

						<p className="mt-1 text-sm font-semibold text-slate-700">
							{dateSummary.fullLabel}
						</p>

						{event.location && (
							<p className="mt-1 text-sm text-slate-500">{event.location}</p>
						)}

						{isManagementRole && linkedMatches.length > 0 && (
							<div className="mt-3 flex flex-wrap gap-2">
								{linkedMatches.map((matchLink) => (
									<Link
										key={`${matchLink.team}-${matchLink.matchId}`}
										to={`/matches/${matchLink.matchId}`}
										className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
									>
										Open {getClubTeamLabel(teamProfiles, matchLink.team)} match
									</Link>
								))}
							</div>
						)}

						<p className="mt-3 text-xs font-semibold text-slate-500">
							Seen {counts.seen} · Available {counts.available} · Declined {counts.declined}
						</p>
					</div>

					{canUpdateOwnAvailability && (
						<div className="min-w-48 rounded-xl bg-slate-50 p-3">
							<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
								Your availability
							</p>

							<div className="mt-2 flex flex-wrap gap-2">
								<AvailabilityButton
									isSelected={currentStatus === "Available"}
									label="Available"
									onClick={() => void onSetAvailability?.(event.id, "Available")}
								/>
								<AvailabilityButton
									isSelected={currentStatus === "Declined"}
									label="Declined"
									onClick={() => void onSetAvailability?.(event.id, "Declined")}
								/>
								{isManagementRole && (
									<AvailabilityButton
										isSelected={currentStatus === "Unanswered"}
										label="Unanswered"
										onClick={() => void onSetAvailability?.(event.id, "Unanswered")}
									/>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function EventDateBadge({ summary }: { summary: EventDateSummary }) {
	return (
		<div className="flex shrink-0 items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-blue-900 lg:w-32 lg:flex-col lg:items-start lg:gap-1">
			<div>
				<p className="text-xs font-black uppercase tracking-wide text-blue-700">
					{summary.relativeLabel}
				</p>

				<div className="mt-1 flex items-baseline gap-1 lg:block">
					<p className="text-3xl font-black leading-none">{summary.dayNumber}</p>
					<p className="text-sm font-black uppercase tracking-wide">{summary.monthLabel}</p>
				</div>
			</div>

			<div className="text-right lg:text-left">
				<p className="text-sm font-bold">{summary.weekdayLabel}</p>
				<p className="text-sm font-semibold text-blue-700">{summary.timeLabel}</p>
			</div>
		</div>
	);
}

function Pill({ label }: { label: string }) {
	return (
		<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
			{label}
		</span>
	);
}

function AvailabilityButton({
	isSelected,
	label,
	onClick,
}: {
	isSelected: boolean;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
				isSelected
					? "bg-blue-700 text-white"
					: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
			}`}
		>
			{label}
		</button>
	);
}

function getLinkedMatchActions(event: ClubEvent) {
	return (event.matchLinks ?? [])
		.filter((matchLink) => Boolean(matchLink.matchId))
		.map((matchLink) => ({
			team: matchLink.team,
			matchId: matchLink.matchId as string,
		}));
}

type EventDateSummary = {
	relativeLabel: string;
	weekdayLabel: string;
	dayNumber: string;
	monthLabel: string;
	timeLabel: string;
	fullLabel: string;
};

function getEventDateSummary(value: string): EventDateSummary {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return {
			relativeLabel: "Date TBC",
			weekdayLabel: "TBC",
			dayNumber: "--",
			monthLabel: "",
			timeLabel: "Time TBC",
			fullLabel: "Date and time to be confirmed",
		};
	}

	const relativeLabel = getRelativeDateLabel(date);
	const weekdayLabel = date.toLocaleDateString("en-GB", { weekday: "short" });
	const dayNumber = date.toLocaleDateString("en-GB", { day: "2-digit" });
	const monthLabel = date.toLocaleDateString("en-GB", { month: "short" });
	const timeLabel = date.toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
	});
	const fullLabel = date.toLocaleString("en-GB", {
		weekday: "long",
		day: "2-digit",
		month: "long",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

	return {
		relativeLabel,
		weekdayLabel,
		dayNumber,
		monthLabel,
		timeLabel,
		fullLabel,
	};
}

function getRelativeDateLabel(date: Date) {
	const today = startOfDay(new Date());
	const eventDay = startOfDay(date);
	const daysDifference = Math.round(
		(eventDay.getTime() - today.getTime()) / 86_400_000
	);

	if (daysDifference === 0) {
		return "Today";
	}

	if (daysDifference === 1) {
		return "Tomorrow";
	}

	if (daysDifference > 1 && daysDifference <= 14) {
		return `In ${daysDifference} days`;
	}

	if (daysDifference === -1) {
		return "Yesterday";
	}

	if (daysDifference < 0) {
		return "Past";
	}

	return date.toLocaleDateString("en-GB", { weekday: "short" });
}

function startOfDay(date: Date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
