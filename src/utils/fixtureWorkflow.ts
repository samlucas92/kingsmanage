import type { Match } from "../stores/match";
import type { ClubEvent, ClubEventType } from "../types/events";

export type ClubCalendarItem = {
	id: string;
	kind: ClubEventType | "Match";
	title: string;
	start: string;
	end?: string | null;
	location: string;
	team: string;
	to: string;
	match?: Match;
	event?: ClubEvent;
};

export type FixtureAction = {
	id: string;
	tone: "critical" | "attention";
	title: string;
	detail: string;
	to: string;
};

export type MatchdayStageId =
	| "fixture"
	| "availability"
	| "squad"
	| "lineup"
	| "communications"
	| "result";

export type MatchdayActionId =
	| "link-event"
	| "availability"
	| "squad"
	| "lineup"
	| "communications"
	| "result"
	| "stats";

export type MatchdayWorkflowStage = {
	id: MatchdayStageId;
	label: string;
	status: string;
	detail: string;
	tone: "success" | "warning" | "info" | "neutral";
};

export type MatchdayWorkflow = {
	stages: MatchdayWorkflowStage[];
	completedStageCount: number;
	trackedStageCount: number;
	nextAction: {
		id: MatchdayActionId;
		label: string;
		detail: string;
	};
};

export function buildClubCalendar(matches: Match[], events: ClubEvent[]) {
	const matchesById = new Map(matches.map((match) => [match.id, match]));
	const includedMatchIds = new Set<string>();
	const items: ClubCalendarItem[] = [];

	for (const event of events) {
		const linkedMatches = event.matchLinks
			.map((link) => link.matchId ? matchesById.get(link.matchId) : undefined)
			.filter((match): match is Match => Boolean(match));
		const linkedMatch = linkedMatches[0];
		const isMultiTeamMatchday = linkedMatches.length > 1;

		if (linkedMatch) {
			for (const link of event.matchLinks) {
				if (link.matchId) includedMatchIds.add(link.matchId);
			}
		}

		items.push({
			id: `event:${event.id}`,
			kind: event.type,
			title: linkedMatch && !isMultiTeamMatchday ? getMatchTitle(linkedMatch) : event.title,
			start: event.startDateTime,
			end: event.endDateTime,
			location: event.location,
			team: isMultiTeamMatchday ? "Both" : linkedMatch?.team ?? event.teamScope,
			to: linkedMatch && !isMultiTeamMatchday ? `/matches/${linkedMatch.id}` : `/events/${event.id}`,
			match: isMultiTeamMatchday ? undefined : linkedMatch,
			event,
		});
	}

	for (const match of matches) {
		if (includedMatchIds.has(match.id)) continue;

		items.push({
			id: `match:${match.id}`,
			kind: "Match",
			title: getMatchTitle(match),
			start: match.date,
			end: new Date(new Date(match.date).getTime() + 2 * 60 * 60 * 1000).toISOString(),
			location: match.location ?? "",
			team: match.team,
			to: `/matches/${match.id}`,
			match,
		});
	}

	return items.sort((first, second) =>
		new Date(first.start).getTime() - new Date(second.start).getTime()
	);
}

export function getCalendarConflictIds(items: ClubCalendarItem[]) {
	const conflicts = new Set<string>();

	for (let index = 0; index < items.length; index += 1) {
		const first = items[index];
		const firstStart = new Date(first.start).getTime();
		const firstEnd = new Date(first.end ?? firstStart + 90 * 60 * 1000).getTime();

		for (let candidateIndex = index + 1; candidateIndex < items.length; candidateIndex += 1) {
			const second = items[candidateIndex];
			const secondStart = new Date(second.start).getTime();
			if (secondStart >= firstEnd) break;

			const secondEnd = new Date(second.end ?? secondStart + 90 * 60 * 1000).getTime();
			const sameTeam = first.team === "Both" || second.team === "Both" || first.team === second.team;
			const sameLocation = Boolean(
				first.location && second.location &&
				first.location.trim().toLowerCase() === second.location.trim().toLowerCase()
			);

			if (secondStart < firstEnd && firstStart < secondEnd && (sameTeam || sameLocation)) {
				conflicts.add(first.id);
				conflicts.add(second.id);
			}
		}
	}

	return conflicts;
}

export function getFixtureActions(matches: Match[], events: ClubEvent[], now = new Date()) {
	const eventsById = new Map(events.map((event) => [event.id, event]));
	const items = buildClubCalendar(matches, events);
	const conflicts = getCalendarConflictIds(items);
	const actions: FixtureAction[] = [];

	for (const match of matches) {
		const matchDate = new Date(match.date);
		const hoursUntilMatch = (matchDate.getTime() - now.getTime()) / 3_600_000;
		const linkedEvent = match.clubEventId ? eventsById.get(match.clubEventId) : undefined;

		if (matchDate >= now && !linkedEvent) {
			actions.push({
				id: `event:${match.id}`,
				tone: "critical",
				title: `${match.opponent}: calendar event missing`,
				detail: "Availability and event reminders are unavailable until this fixture is linked.",
				to: `/matches/${match.id}`,
			});
		}

		if (hoursUntilMatch >= 0 && hoursUntilMatch <= 72 && match.selectedPlayers.length === 0) {
			actions.push({
				id: `squad:${match.id}`,
				tone: hoursUntilMatch <= 24 ? "critical" : "attention",
				title: `${match.opponent}: squad not selected`,
				detail: `Kick-off is ${formatRelativeHours(hoursUntilMatch)}.`,
				to: `/matches/${match.id}`,
			});
		}

		if (hoursUntilMatch >= 0 && hoursUntilMatch <= 24 && !match.isLineupLocked) {
			actions.push({
				id: `lineup:${match.id}`,
				tone: "attention",
				title: `${match.opponent}: lineup unlocked`,
				detail: "Review and lock the matchday lineup before kick-off.",
				to: `/matches/${match.id}`,
			});
		}

		if (matchDate < now && !match.isCompleted && match.state !== "postponed") {
			actions.push({
				id: `result:${match.id}`,
				tone: "attention",
				title: `${match.opponent}: result outstanding`,
				detail: "This fixture has passed but has not been completed.",
				to: `/matches/${match.id}`,
			});
		}
	}

	for (const item of items) {
		if (!conflicts.has(item.id) || new Date(item.start) < now) continue;
		actions.push({
			id: `conflict:${item.id}`,
			tone: "critical",
			title: `${item.title}: schedule conflict`,
			detail: "This overlaps another item for the same team or location.",
			to: item.to,
		});
	}

	return actions
		.sort((first, second) => first.tone === second.tone ? 0 : first.tone === "critical" ? -1 : 1)
		.slice(0, 12);
}

export function getMatchReadiness(match: Match, linkedEvent?: ClubEvent) {
	return [
		{ label: "Calendar event linked", complete: Boolean(linkedEvent), detail: "Enables availability and reminders." },
		{ label: "Competition and location set", complete: Boolean(match.competition && match.location), detail: "Required for clear fixture information." },
		{ label: "Availability collected", complete: Boolean(linkedEvent?.availabilityResponses.length), detail: "At least one player has responded." },
		{ label: "Squad selected", complete: match.selectedPlayers.length > 0, detail: `${match.selectedPlayers.length} players selected.` },
		{ label: "Lineup locked", complete: match.isLineupLocked, detail: "Confirms the final matchday selection." },
	];
}

export function getMatchdayWorkflow(
	match: Match,
	linkedEvent: ClubEvent | undefined,
	activePlayerIds: string[],
	now: Date
): MatchdayWorkflow {
	const hasFixtureDetails = Boolean(match.competition && match.location);
	const availability = getAvailabilitySummary(linkedEvent, activePlayerIds);
	const starterCount = match.selectedPlayers.filter(
		(player) => player.area === "pitch"
	).length;
	const hasFullStartingTeam = starterCount >= 11;
	const kickoffHasPassed = new Date(match.date).getTime() <= now.getTime();
	const isPostponed = match.state === "postponed";

	const stages: MatchdayWorkflowStage[] = [
		{
			id: "fixture",
			label: "Fixture",
			status: linkedEvent && hasFixtureDetails ? "Complete" : "Needs attention",
			detail: !linkedEvent
				? "Add to the club calendar"
				: hasFixtureDetails
					? "Calendar and details ready"
					: "Competition or location missing",
			tone: linkedEvent && hasFixtureDetails ? "success" : "warning",
		},
		{
			id: "availability",
			label: "Availability",
			status: availability.complete ? "Complete" : linkedEvent ? "In progress" : "Unavailable",
			detail: linkedEvent
				? `${availability.available} available · ${availability.awaiting} awaiting`
				: "Link the calendar event first",
			tone: availability.complete ? "success" : linkedEvent ? "info" : "neutral",
		},
		{
			id: "squad",
			label: "Squad",
			status: hasFullStartingTeam ? "Complete" : starterCount > 0 ? "In progress" : "Not started",
			detail: `${starterCount}/11 starters · ${Math.max(match.selectedPlayers.length - starterCount, 0)} bench`,
			tone: hasFullStartingTeam ? "success" : starterCount > 0 ? "info" : "neutral",
		},
		{
			id: "lineup",
			label: "Lineup",
			status: match.isLineupLocked ? "Complete" : hasFullStartingTeam ? "Ready" : "Waiting for squad",
			detail: match.isLineupLocked ? "Formation and selection locked" : "Confirm the existing team selection",
			tone: match.isLineupLocked ? "success" : hasFullStartingTeam ? "warning" : "neutral",
		},
		{
			id: "communications",
			label: "Communications",
			status: match.isLineupLocked ? "Ready" : "Upcoming",
			detail: match.isLineupLocked ? "Generate the matchday post" : "Available after lineup confirmation",
			tone: match.isLineupLocked ? "info" : "neutral",
		},
		{
			id: "result",
			label: "Result",
			status: match.isCompleted ? "Complete" : kickoffHasPassed && !isPostponed ? "Ready" : isPostponed ? "Postponed" : "Upcoming",
			detail: match.isCompleted
				? "Result entered and stats unlocked"
				: kickoffHasPassed && !isPostponed
					? "Enter the final score"
					: isPostponed
						? "Awaiting a new fixture date"
						: "Available after kickoff",
			tone: match.isCompleted ? "success" : kickoffHasPassed && !isPostponed ? "warning" : "neutral",
		},
	];

	return {
		stages,
		completedStageCount: stages.filter(
			(stage) => stage.id !== "communications" && stage.tone === "success"
		).length,
		trackedStageCount: stages.filter((stage) => stage.id !== "communications").length,
		nextAction: getNextMatchdayAction({
			match,
			linkedEvent,
			availabilityComplete: availability.complete,
			hasFullStartingTeam,
			kickoffHasPassed,
			isPostponed,
		}),
	};
}

function getAvailabilitySummary(
	linkedEvent: ClubEvent | undefined,
	activePlayerIds: string[]
) {
	const activePlayers = new Set(activePlayerIds);
	const responses = (linkedEvent?.availabilityResponses ?? []).filter((response) =>
		activePlayers.has(response.playerId)
	);
	const respondedPlayerIds = new Set(
		responses
			.filter((response) => response.status !== "Unanswered")
			.map((response) => response.playerId)
	);
	const available = new Set(
		responses
			.filter((response) => response.status === "Available")
			.map((response) => response.playerId)
	).size;
	const awaiting = Math.max(activePlayers.size - respondedPlayerIds.size, 0);

	return {
		available,
		awaiting,
		complete: Boolean(linkedEvent && activePlayers.size > 0 && awaiting === 0),
	};
}

function getNextMatchdayAction({
	match,
	linkedEvent,
	availabilityComplete,
	hasFullStartingTeam,
	kickoffHasPassed,
	isPostponed,
}: {
	match: Match;
	linkedEvent?: ClubEvent;
	availabilityComplete: boolean;
	hasFullStartingTeam: boolean;
	kickoffHasPassed: boolean;
	isPostponed: boolean;
}): MatchdayWorkflow["nextAction"] {
	if (match.isCompleted) {
		return {
			id: "stats",
			label: "Review match report",
			detail: "Complete player statistics, awards and notes using the existing match report tools.",
		};
	}

	if (!linkedEvent) {
		return {
			id: "link-event",
			label: "Add match to calendar",
			detail: "Unlock availability responses and keep the fixture in the club calendar.",
		};
	}

	if (!availabilityComplete && !kickoffHasPassed) {
		return {
			id: "availability",
			label: "Review availability",
			detail: "Open the linked event to see responses and follow up before selecting the squad.",
		};
	}

	if (kickoffHasPassed && !isPostponed) {
		return {
			id: "result",
			label: "Enter result",
			detail: "Record the final score to unlock the player report and statistics.",
		};
	}

	if (!hasFullStartingTeam) {
		return {
			id: "squad",
			label: "Finish squad selection",
			detail: "Use the existing squad selector and formation pitch below.",
		};
	}

	if (!match.isLineupLocked) {
		return {
			id: "lineup",
			label: "Confirm lineup",
			detail: "Lock the current formation and selected players when they are final.",
		};
	}

	if (!kickoffHasPassed && !isPostponed) {
		return {
			id: "communications",
			label: "Generate matchday post",
			detail: "Open the existing post generator with the confirmed team selection.",
		};
	}

	return {
		id: "stats",
		label: "Review match report",
		detail: "Complete player statistics, awards and notes using the existing match report tools.",
	};
}

function getMatchTitle(match: Match) {
	return match.venue === "home"
		? `vs ${match.opponent}`
		: `at ${match.opponent}`;
}

function formatRelativeHours(hours: number) {
	if (hours < 1) return "in under an hour";
	if (hours < 24) return `in ${Math.ceil(hours)} hours`;
	return `in ${Math.ceil(hours / 24)} days`;
}
