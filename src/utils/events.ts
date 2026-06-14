import type { Player } from "../stores/players";
import type {
	ClubEvent,
	ClubEventAvailabilityStatus,
} from "../types/events";

export type EventPlayerAvailabilityGroup = {
	status: ClubEventAvailabilityStatus;
	label: string;
	players: Player[];
};

export type EventSeenGroup = {
	label: string;
	players: Player[];
};

export function getPlayerAvailabilityStatus(
	event: ClubEvent,
	playerId: string
): ClubEventAvailabilityStatus {
	return (
		event.availabilityResponses?.find((response) => response.playerId === playerId)?.status ??
		"Unanswered"
	);
}

export function hasPlayerSeenEvent(event: ClubEvent, playerId: string) {
	return event.seenBy?.some((seen) => seen.playerId === playerId) ?? false;
}

export function getAvailabilityGroups(
	event: ClubEvent,
	players: Player[]
): EventPlayerAvailabilityGroup[] {
	return [
		{
			status: "Available",
			label: "Available",
			players: players.filter(
				(player) => getPlayerAvailabilityStatus(event, player.id) === "Available"
			),
		},
		{
			status: "Declined",
			label: "Declined",
			players: players.filter(
				(player) => getPlayerAvailabilityStatus(event, player.id) === "Declined"
			),
		},
		{
			status: "Unanswered",
			label: "Unanswered",
			players: players.filter(
				(player) => getPlayerAvailabilityStatus(event, player.id) === "Unanswered"
			),
		},
	];
}

export function getSeenGroups(event: ClubEvent, players: Player[]): EventSeenGroup[] {
	return [
		{
			label: "Seen but unanswered",
			players: players.filter(
				(player) =>
					hasPlayerSeenEvent(event, player.id) &&
					getPlayerAvailabilityStatus(event, player.id) === "Unanswered"
			),
		},
		{
			label: "Not seen",
			players: players.filter((player) => !hasPlayerSeenEvent(event, player.id)),
		},
	];
}

export function getEventCounts(event: ClubEvent) {
	const availabilityResponses = event.availabilityResponses ?? [];
	const seenBy = event.seenBy ?? [];

	return {
		seen: seenBy.length,
		available: availabilityResponses.filter((response) => response.status === "Available").length,
		declined: availabilityResponses.filter((response) => response.status === "Declined").length,
		unanswered: availabilityResponses.filter((response) => response.status === "Unanswered").length,
	};
}
