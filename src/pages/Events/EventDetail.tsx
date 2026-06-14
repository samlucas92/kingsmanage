import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuthStore } from "../../stores/auth";
import { useEventStore } from "../../stores/events";
import { usePlayerStore, type Player } from "../../stores/players";
import type { ClubEvent, ClubEventAvailabilityStatus } from "../../types/events";
import {
	getAvailabilityGroups,
	getPlayerAvailabilityStatus,
	hasPlayerSeenEvent,
} from "../../utils/events";

export default function EventDetail() {
	const { id } = useParams<{ id: string }>();
	const currentUser = useAuthStore((state) => state.currentUser);
	const selectedEvent = useEventStore((state) => state.selectedEvent);
	const isLoadingSelectedEvent = useEventStore((state) => state.isLoadingSelectedEvent);
	const selectedEventLoadError = useEventStore((state) => state.selectedEventLoadError);
	const loadEvent = useEventStore((state) => state.loadEvent);
	const setAvailability = useEventStore((state) => state.setAvailability);
	const setPlayerAvailability = useEventStore((state) => state.setPlayerAvailability);
	const clearSelectedEvent = useEventStore((state) => state.clearSelectedEvent);

	const players = usePlayerStore((state) => state.players);
	const loadPlayers = usePlayerStore((state) => state.loadPlayers);
	const isLoadingPlayers = usePlayerStore((state) => state.isLoadingPlayers);
	const playerLoadError = usePlayerStore((state) => state.playerLoadError);

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

	async function handleOwnAvailabilityChange(status: ClubEventAvailabilityStatus) {
		if (!selectedEvent) {
			return;
		}

		await setAvailability(selectedEvent.id, status);
	}

	async function handlePlayerAvailabilityChange(
		playerId: string,
		status: ClubEventAvailabilityStatus
	) {
		if (!selectedEvent) {
			return;
		}

		if (isManagementRole) {
			await setPlayerAvailability(selectedEvent.id, playerId, status);
			return;
		}

		if (playerId === linkedPlayerId && status !== "Unanswered") {
			await setAvailability(selectedEvent.id, status);
		}
	}

	const activePlayers = players.filter((player) => player.isActive);
	const availabilityGroups = getAvailabilityGroups(selectedEvent, activePlayers);

	return (
		<div className="space-y-6">
			<div>
				<Link
					to="/"
					className="text-sm font-semibold text-blue-700 hover:text-blue-900"
				>
					Back to dashboard
				</Link>
			</div>

			<section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div>
						<div className="flex flex-wrap gap-2">
							<EventPill label={selectedEvent.type} />
							<EventPill label={getTeamScopeLabel(selectedEvent.teamScope)} />
							{selectedEvent.matchLinks.some((matchLink) => matchLink.matchId) && (
								<EventPill label="Linked match" />
							)}
						</div>

						<h1 className="mt-3 text-3xl font-bold text-slate-900">
							{selectedEvent.title}
						</h1>

						<p className="mt-2 text-sm text-slate-600">
							{formatDateTime(selectedEvent.startDateTime)}
							{selectedEvent.location ? ` · ${selectedEvent.location}` : ""}
						</p>

						{selectedEvent.description && (
							<p className="mt-4 text-sm text-slate-700">{selectedEvent.description}</p>
						)}
					</div>

					{linkedPlayerId && (
						<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
							<p className="text-sm font-bold text-slate-900">Your availability</p>
							<p className="mt-1 text-sm text-slate-500">Current: {currentPlayerStatus}</p>

							<div className="mt-3 flex flex-wrap gap-2">
								<AvailabilityButton
									isSelected={currentPlayerStatus === "Available"}
									label="Available"
									onClick={() => void handleOwnAvailabilityChange("Available")}
								/>
								<AvailabilityButton
									isSelected={currentPlayerStatus === "Declined"}
									label="Declined"
									onClick={() => void handleOwnAvailabilityChange("Declined")}
								/>
							</div>
						</div>
					)}
				</div>
			</section>

			<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<h2 className="text-lg font-bold text-slate-900">Availability</h2>
				<p className="mt-1 text-sm text-slate-500">
					{isManagementRole
						? "Update player availability and check who has seen the event."
						: "View player responses. You can only update your own availability."}
				</p>

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
					{availabilityGroups.map((group) => (
						<PlayerGroup
							key={group.status}
							currentPlayerId={linkedPlayerId}
							event={selectedEvent}
							isManagementRole={isManagementRole}
							label={group.label}
							onAvailabilityChange={handlePlayerAvailabilityChange}
							players={group.players}
						/>
					))}
				</div>
			</section>
		</div>
	);
}

function PlayerGroup({
	currentPlayerId,
	event,
	isManagementRole,
	label,
	onAvailabilityChange,
	players,
}: {
	currentPlayerId: string;
	event: ClubEvent;
	isManagementRole: boolean;
	label: string;
	onAvailabilityChange: (
		playerId: string,
		status: ClubEventAvailabilityStatus
	) => Promise<void>;
	players: Player[];
}) {
	return (
		<section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
			<div className="flex items-center justify-between gap-3">
				<h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">
					{label}
				</h3>

				<span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">
					{players.length}
				</span>
			</div>

			<div className="mt-3 space-y-2">
				{players.map((player) => {
					const status = getPlayerAvailabilityStatus(event, player.id);
					const hasSeen = hasPlayerSeenEvent(event, player.id);
					const canUpdatePlayer = isManagementRole || player.id === currentPlayerId;

					return (
						<div
							key={player.id}
							className="rounded-xl border border-slate-200 bg-white px-4 py-3"
						>
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<p className="truncate text-sm font-bold text-slate-900">{player.name}</p>
										{hasSeen && (
											<span className="text-xs font-semibold text-slate-400">Seen</span>
										)}
									</div>

									<p className="mt-0.5 text-xs text-slate-500">{status}</p>
								</div>

								{canUpdatePlayer && (
									<div className="flex flex-wrap gap-2">
										<AvailabilityButton
											isSelected={status === "Available"}
											label="Available"
											onClick={() => void onAvailabilityChange(player.id, "Available")}
										/>
										<AvailabilityButton
											isSelected={status === "Declined"}
											label="Declined"
											onClick={() => void onAvailabilityChange(player.id, "Declined")}
										/>
										{isManagementRole && (
											<AvailabilityButton
												isSelected={status === "Unanswered"}
												label="Unanswered"
												onClick={() => void onAvailabilityChange(player.id, "Unanswered")}
											/>
										)}
									</div>
								)}
							</div>
						</div>
					);
				})}

				{players.length === 0 && (
					<p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
						No players in this group.
					</p>
				)}
			</div>
		</section>
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
			className={`rounded-xl px-3 py-2 text-xs font-bold ${
				isSelected
					? "bg-blue-700 text-white"
					: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
			}`}
		>
			{label}
		</button>
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

function getTeamScopeLabel(teamScope: string) {
	if (teamScope === "First") {
		return "First Team";
	}

	if (teamScope === "Second") {
		return "Second Team";
	}

	return "Both Teams";
}

function formatDateTime(value: string) {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "Date TBC";
	}

	return date.toLocaleString("en-GB", {
		weekday: "short",
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}
