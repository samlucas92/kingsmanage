import type { ClubEvent, ClubEventAvailabilityStatus } from "../types/events";

export type TrainingAvailabilitySummary = {
	total: number;
	available: number;
	declined: number;
	unanswered: number;
	percentage: number;
};

type TrainingAvailabilityEventWindow = {
	events: ClubEvent[];
	seasonStartDate?: string;
	seasonEndDate?: string;
	untilDate?: string;
	now?: string | Date;
};

export function getTrainingAvailabilitySummary({
	playerId,
	events,
	seasonStartDate,
	seasonEndDate,
	untilDate,
	now,
}: {
	playerId?: string;
	events: ClubEvent[];
	seasonStartDate?: string;
	seasonEndDate?: string;
	untilDate?: string;
	now?: string | Date;
}): TrainingAvailabilitySummary {
	if (!playerId) {
		return emptyTrainingAvailabilitySummary();
	}

	const trainingEvents = getCompletedTrainingEvents({
		events,
		seasonStartDate,
		seasonEndDate,
		untilDate,
		now,
	});

	const statuses = trainingEvents.map(
		(event) =>
			event.availabilityResponses.find((response) => response.playerId === playerId)
				?.status ?? "Unanswered"
	);

	const available = countStatus(statuses, "Available");
	const declined = countStatus(statuses, "Declined");
	const unanswered = countStatus(statuses, "Unanswered");
	const total = statuses.length;

	return {
		total,
		available,
		declined,
		unanswered,
		percentage: total > 0 ? Math.round((available / total) * 100) : 0,
	};
}

export function getCompletedTrainingEvents({
	events,
	seasonStartDate,
	seasonEndDate,
	untilDate,
	now = new Date(),
}: TrainingAvailabilityEventWindow): ClubEvent[] {
	const seasonStart = seasonStartDate ? new Date(seasonStartDate).getTime() : Number.NEGATIVE_INFINITY;
	const seasonEnd = seasonEndDate ? new Date(seasonEndDate).getTime() : Number.POSITIVE_INFINITY;
	const until = untilDate ? new Date(untilDate).getTime() : Number.POSITIVE_INFINITY;
	const currentTime = now instanceof Date ? now.getTime() : new Date(now).getTime();
	const latestAllowed = Math.min(seasonEnd, until, currentTime);

	return events.filter((event) => {
		if (event.type !== "Training") {
			return false;
		}

		const eventTime = new Date(event.startDateTime).getTime();
		return eventTime >= seasonStart && eventTime <= latestAllowed;
	});
}

function countStatus(
	statuses: ClubEventAvailabilityStatus[],
	status: ClubEventAvailabilityStatus
) {
	return statuses.filter((item) => item === status).length;
}

function emptyTrainingAvailabilitySummary(): TrainingAvailabilitySummary {
	return {
		total: 0,
		available: 0,
		declined: 0,
		unanswered: 0,
		percentage: 0,
	};
}
