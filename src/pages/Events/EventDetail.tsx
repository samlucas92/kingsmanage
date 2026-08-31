import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import ConfirmationModal from "../../components/compositions/ConfirmationModal";
import { useAuthStore } from "../../stores/auth";
import { useEventStore } from "../../stores/events";
import { useMatchStore } from "../../stores/match";
import { getClubTeamLabel, useClubTeamStore } from "../../stores/clubTeams";
import { downloadClubEventCalendarFile } from "../../utils/calendar";
import { usePlayerStore, type Player } from "../../stores/players";
import type { ClubEvent, ClubEventAvailabilityStatus } from "../../types/events";
import {
	getAvailabilityGroups,
	getPlayerAvailabilityStatus,
	hasPlayerSeenEvent,
} from "../../utils/events";
import { EventAvailabilityGroup } from "./EventAvailabilityGroup";
import EventEditModal from "./EventEditModal";

export default function EventDetail() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const currentUser = useAuthStore((state) => state.currentUser);
	const selectedEvent = useEventStore((state) => state.selectedEvent);
	const isLoadingSelectedEvent = useEventStore((state) => state.isLoadingSelectedEvent);
	const selectedEventLoadError = useEventStore((state) => state.selectedEventLoadError);
	const loadEvent = useEventStore((state) => state.loadEvent);
	const deleteEvent = useEventStore((state) => state.deleteEvent);
	const updateEvent = useEventStore((state) => state.updateEvent);
	const setPlayerAvailability = useEventStore((state) => state.setPlayerAvailability);
	const clearSelectedEvent = useEventStore((state) => state.clearSelectedEvent);
	const loadMatches = useMatchStore((state) => state.loadMatches);
	const teamProfiles = useClubTeamStore((state) => state.profiles);

	const players = usePlayerStore((state) => state.players);
	const loadPlayers = usePlayerStore((state) => state.loadPlayers);
	const isLoadingPlayers = usePlayerStore((state) => state.isLoadingPlayers);
	const playerLoadError = usePlayerStore((state) => state.playerLoadError);

	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isDeletingEvent, setIsDeletingEvent] = useState(false);
	const [deleteError, setDeleteError] = useState("");
	const [responseFilter, setResponseFilter] = useState<ResponseChaseFilter>("all");
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [deleteLinkedMatches, setDeleteLinkedMatches] = useState(true);

	const isManagementRole = currentUser?.role === "Admin" || currentUser?.role === "Coach";
	const linkedPlayerId = currentUser?.playerId ?? "";

	useEffect(() => {
		if (!id) {
			return;
		}

		void loadEvent(id, currentUser?.role === "Player");

		return () => {
			clearSelectedEvent();
		};
	}, [clearSelectedEvent, currentUser?.role, id, loadEvent]);

	useEffect(() => {
		void loadPlayers();
	}, [loadPlayers]);

	if (!id) {
		return <EmptyState message="Event id is missing." />;
	}

	if (isLoadingSelectedEvent) {
		return <EmptyState message="Loading event..." />;
	}

	if (selectedEventLoadError) {
		return <EmptyState message={selectedEventLoadError} />;
	}

	if (!selectedEvent) {
		return <EmptyState message="Event was not found." />;
	}

	const currentPlayerStatus = linkedPlayerId
		? getPlayerAvailabilityStatus(selectedEvent, linkedPlayerId)
		: "Unanswered";
	const activePlayers = players.filter((player) => player.isActive);
	const responseFilterCounts = getResponseFilterCounts(selectedEvent, activePlayers);
	const filteredAvailabilityPlayers = getResponseFilteredPlayers(
		selectedEvent,
		activePlayers,
		responseFilter
	);
	const availabilityGroups = getAvailabilityGroups(selectedEvent, filteredAvailabilityPlayers);
	const visibleAvailabilityGroups = availabilityGroups.filter(
		(group) => responseFilter === "all" || group.players.length > 0
	);
	const linkedMatches = getLinkedMatchActions(selectedEvent);
	const dateSummary = getEventDateSummary(selectedEvent.startDateTime);

	async function handlePlayerAvailabilityChange(
		playerId: string,
		status: ClubEventAvailabilityStatus
	) {
		if (!selectedEvent) {
			return;
		}

		if (!isManagementRole) return;
		await setPlayerAvailability(selectedEvent.id, playerId, status);
	}

	function openDeleteEventModal() {
		setDeleteError("");
		setDeleteLinkedMatches(true);
		setIsDeleteModalOpen(true);
	}

	function handleDownloadCalendarFile() {
		if (!selectedEvent) {
			return;
		}

		downloadClubEventCalendarFile(selectedEvent);
	}

	async function handleConfirmDeleteEvent() {
		if (!selectedEvent || isDeletingEvent) {
			return;
		}

		setIsDeletingEvent(true);
		setDeleteError("");

		try {
			await deleteEvent(selectedEvent.id, deleteLinkedMatches ? "delete" : "detach");
			await loadMatches(undefined, true);
			navigate("/", { replace: true });
		} catch (error) {
			setDeleteError(error instanceof Error ? error.message : "Failed to delete event.");
			setIsDeletingEvent(false);
		}
	}

	return (
		<div className="space-y-3 lg:space-y-6">
			<div className="hidden lg:block">
				<Link
					to="/"
					className="text-sm font-semibold text-yepset-700 hover:text-yepset-900"
				>
					Back to dashboard
				</Link>
			</div>

			<section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div>
						<div className="flex flex-wrap gap-2">
							<EventPill label={selectedEvent.type} />
							<EventPill label={selectedEvent.teamScope === "Both" ? "Both Teams" : getClubTeamLabel(teamProfiles, selectedEvent.teamScope)} />
							{linkedMatches.length > 0 && <EventPill label="Linked match" />}
						</div>

						<h1 className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">
							{selectedEvent.title}
						</h1>

						<EventDateHero
							location={selectedEvent.location}
							summary={dateSummary}
						/>

						{selectedEvent.description && (
							<p className="mt-4 text-sm text-slate-700">{selectedEvent.description}</p>
						)}

						{deleteError && (
							<div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
								{deleteError}
							</div>
						)}
					</div>

					<div className="flex flex-col gap-3 lg:min-w-72">
						<EventCalendarActions onDownloadCalendarFile={handleDownloadCalendarFile} />

						{isManagementRole && (
							<EventManagementActions
								isDeletingEvent={isDeletingEvent}
								linkedMatches={linkedMatches}
								onDeleteEvent={openDeleteEventModal}
								onEditEvent={() => setIsEditModalOpen(true)}
							/>
						)}

						{linkedPlayerId && (
							<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
								<p className="text-sm font-bold text-slate-900">Your availability</p>
								<p className="mt-1 text-sm text-slate-500">Current: {currentPlayerStatus}</p>
								{!isManagementRole && (
									<p className="mt-2 text-xs font-semibold text-slate-400">
										Availability is read-only on the event page.
									</p>
								)}
							</div>
						)}
					</div>
				</div>
			</section>

			<section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
				<h2 className="text-lg font-bold text-slate-900">Availability</h2>
				<p className="mt-1 text-sm text-slate-500">
					{isManagementRole
						? "Update player availability and check who has seen the event."
						: "View player responses. Availability is read-only on this page."}
				</p>

				{isManagementRole && (
					<ResponseChasingFilters
						counts={responseFilterCounts}
						selectedFilter={responseFilter}
						onFilterChange={setResponseFilter}
					/>
				)}

				{playerLoadError && (
					<div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
						Player list could not be loaded, so responses cannot be grouped by name yet.
					</div>
				)}

				{isLoadingPlayers && (
					<div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
						Loading players...
					</div>
				)}

				<div className="mt-5 space-y-5">
					{visibleAvailabilityGroups.map((group) => (
						<EventAvailabilityGroup
							key={group.status}
							event={selectedEvent}
							isManagementRole={isManagementRole}
							label={group.label}
							onAvailabilityChange={handlePlayerAvailabilityChange}
							players={group.players}
						/>
					))}

					{visibleAvailabilityGroups.length === 0 && (
						<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
							No players match this response filter.
						</div>
					)}
				</div>
			</section>
			<ConfirmationModal
				confirmText="Delete event"
				isBusy={isDeletingEvent}
				isOpen={isDeleteModalOpen}
				message={linkedMatches.length === 0 ? getDeleteEventConfirmationMessage(0) : "Choose what happens to the linked match record."}
				onCancel={() => setIsDeleteModalOpen(false)}
				onConfirm={handleConfirmDeleteEvent}
				title="Delete event?"
				variant="danger"
			>
				{linkedMatches.length > 0 && (
					<div className="space-y-2">
						<label className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3"><input type="radio" checked={deleteLinkedMatches} onChange={() => setDeleteLinkedMatches(true)} /><span><strong className="block text-sm text-red-900">Delete event and linked match</strong><span className="text-xs text-red-700">Removes the complete fixture record.</span></span></label>
						<label className="flex gap-3 rounded-xl border border-slate-200 p-3"><input type="radio" checked={!deleteLinkedMatches} onChange={() => setDeleteLinkedMatches(false)} /><span><strong className="block text-sm text-slate-900">Delete event only</strong><span className="text-xs text-slate-600">Keeps the match and removes its calendar link.</span></span></label>
					</div>
				)}
			</ConfirmationModal>
			<EventEditModal
				event={selectedEvent}
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				onSave={async (request) => {
					await updateEvent(selectedEvent.id, request);
					await loadMatches(undefined, true);
				}}
			/>
		</div>
	);
}

function ResponseChasingFilters({
	counts,
	selectedFilter,
	onFilterChange,
}: {
	counts: ResponseFilterCounts;
	selectedFilter: ResponseChaseFilter;
	onFilterChange: (filter: ResponseChaseFilter) => void;
}) {
	const filters: ResponseChasingFilterDefinition[] = [
		{
			id: "all",
			label: "All players",
			description: "Show every active player.",
			count: counts.all,
		},
		{
			id: "unanswered",
			label: "Unanswered",
			description: "Players who have not given a response.",
			count: counts.unanswered,
		},
		{
			id: "unseen",
			label: "Unseen",
			description: "Players who have not opened this event.",
			count: counts.unseen,
		},
		{
			id: "seen-unanswered",
			label: "Seen but unanswered",
			description: "Players who have seen it but still need chasing.",
			count: counts.seenUnanswered,
		},
	];

	return (
		<div className="mt-5 rounded-2xl border border-yepset-100 bg-yepset-50 p-4">
			<div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-sm font-black uppercase tracking-wide text-yepset-700">
						Response chasing
					</p>
					<p className="mt-1 text-sm font-semibold text-yepset-950">
						Filter the availability list by who needs a nudge.
					</p>
				</div>

				<p className="text-xs font-semibold text-yepset-700">
					{counts.unanswered} unanswered · {counts.unseen} unseen
				</p>
			</div>

			<div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
				{filters.map((filter) => (
					<button
						key={filter.id}
						type="button"
						onClick={() => onFilterChange(filter.id)}
						className={`rounded-xl border px-4 py-3 text-left transition ${
							selectedFilter === filter.id
								? "border-yepset-700 bg-white shadow-sm"
								: "border-yepset-100 bg-yepset-100/40 hover:bg-white"
						}`}
					>
						<div className="flex items-center justify-between gap-3">
							<span className="text-sm font-bold text-slate-900">{filter.label}</span>
							<span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-yepset-700">
								{filter.count}
							</span>
						</div>
						<p className="mt-1 text-xs font-semibold text-slate-500">
							{filter.description}
						</p>
					</button>
				))}
			</div>
		</div>
	);
}


function EventCalendarActions({
	onDownloadCalendarFile,
}: {
	onDownloadCalendarFile: () => void;
}) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
			<p className="text-sm font-bold text-slate-900">Calendar</p>
			<p className="mt-1 text-sm text-slate-500">
				Download this event as an .ics file and add it to your calendar.
			</p>

			<button
				type="button"
				onClick={onDownloadCalendarFile}
				className="mt-3 w-full rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"
			>
				Download calendar file
			</button>
		</div>
	);
}

function EventManagementActions({
	isDeletingEvent,
	linkedMatches,
	onDeleteEvent,
	onEditEvent,
}: {
	isDeletingEvent: boolean;
	linkedMatches: LinkedMatchAction[];
	onDeleteEvent: () => void;
	onEditEvent: () => void;
}) {
	const teamProfiles = useClubTeamStore((state) => state.profiles);

	return (
		<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
			<p className="text-sm font-bold text-slate-900">Admin actions</p>
			<button type="button" onClick={onEditEvent} className="mt-3 w-full rounded-xl border border-yepset-200 bg-white px-4 py-2 text-sm font-bold text-yepset-700 hover:bg-yepset-50">Edit event</button>

			{linkedMatches.length > 0 && (
				<div className="mt-3 space-y-2">
					{linkedMatches.map((matchLink) => (
						<Link
							key={`${matchLink.team}-${matchLink.matchId}`}
							to={`/matches/${matchLink.matchId}`}
							className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"
						>
							<span>{getClubTeamLabel(teamProfiles, matchLink.team)} match</span>
							<span>Open</span>
						</Link>
					))}
				</div>
			)}

			{linkedMatches.length === 0 && (
				<p className="mt-2 text-sm text-slate-500">
					No linked matches for this event yet.
				</p>
			)}

			<button
				type="button"
				disabled={isDeletingEvent}
				onClick={onDeleteEvent}
				className="mt-4 w-full rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{isDeletingEvent ? "Deleting event..." : "Delete event"}
			</button>
		</div>
	);
}

function EventPill({ label }: { label: string }) {
	return (
		<span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
			{label}
		</span>
	);
}

function EmptyState({ message }: { message: string }) {
	return (
		<div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-500">
			{message}
		</div>
	);
}

type ResponseChaseFilter = "all" | "unanswered" | "unseen" | "seen-unanswered";

type LinkedMatchAction = {
	team: string;
	matchId: string;
};

type ResponseFilterCounts = {
	all: number;
	unanswered: number;
	unseen: number;
	seenUnanswered: number;
};

type ResponseChasingFilterDefinition = {
	id: ResponseChaseFilter;
	label: string;
	description: string;
	count: number;
};

function getResponseFilterCounts(
	event: ClubEvent,
	players: Player[]
): ResponseFilterCounts {
	return {
		all: players.length,
		unanswered: players.filter(
			(player) => getPlayerAvailabilityStatus(event, player.id) === "Unanswered"
		).length,
		unseen: players.filter((player) => !hasPlayerSeenEvent(event, player.id)).length,
		seenUnanswered: players.filter(
			(player) =>
				hasPlayerSeenEvent(event, player.id) &&
				getPlayerAvailabilityStatus(event, player.id) === "Unanswered"
		).length,
	};
}

function getResponseFilteredPlayers(
	event: ClubEvent,
	players: Player[],
	filter: ResponseChaseFilter
) {
	if (filter === "unanswered") {
		return players.filter(
			(player) => getPlayerAvailabilityStatus(event, player.id) === "Unanswered"
		);
	}

	if (filter === "unseen") {
		return players.filter((player) => !hasPlayerSeenEvent(event, player.id));
	}

	if (filter === "seen-unanswered") {
		return players.filter(
			(player) =>
				hasPlayerSeenEvent(event, player.id) &&
				getPlayerAvailabilityStatus(event, player.id) === "Unanswered"
		);
	}

	return players;
}

function getLinkedMatchActions(event: ClubEvent): LinkedMatchAction[] {
	return (event.matchLinks ?? [])
		.filter((matchLink) => Boolean(matchLink.matchId))
		.map((matchLink) => ({
			team: matchLink.team,
			matchId: matchLink.matchId as string,
		}));
}

function getDeleteEventConfirmationMessage(linkedMatchCount: number) {
	if (linkedMatchCount === 0) {
		return "This will delete the event. This cannot be undone.";
	}

	if (linkedMatchCount === 1) {
		return "This will delete the event and its linked match. This cannot be undone.";
	}

	return `This will delete the event and its ${linkedMatchCount} linked matches. This cannot be undone.`;
}

function EventDateHero({
	location,
	summary,
}: {
	location?: string | null;
	summary: EventDateSummary;
}) {
	return (
		<div className="mt-5 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-950 sm:flex-row sm:items-center">
			<div className="flex shrink-0 items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
				<div>
					<p className="text-xs font-black uppercase tracking-wide text-blue-700">
						{summary.relativeLabel}
					</p>
					<div className="mt-1 flex items-baseline gap-1">
						<p className="text-4xl font-black leading-none">{summary.dayNumber}</p>
						<p className="text-sm font-black uppercase tracking-wide">{summary.monthLabel}</p>
					</div>
				</div>
			</div>

			<div>
				<p className="text-base font-bold text-blue-950">{summary.fullLabel}</p>
				<p className="mt-1 text-sm font-semibold text-blue-700">
					{summary.weekdayLabel} · {summary.timeLabel}
				</p>
				{location && (
					<p className="mt-2 text-sm font-semibold text-slate-700">{location}</p>
				)}
			</div>
		</div>
	);
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
