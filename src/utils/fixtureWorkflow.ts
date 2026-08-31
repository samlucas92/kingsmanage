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

export function buildClubCalendar(matches: Match[], events: ClubEvent[]) {
	const matchesById = new Map(matches.map((match) => [match.id, match]));
	const includedMatchIds = new Set<string>();
	const items: ClubCalendarItem[] = [];

	for (const event of events) {
		const linkedMatch = event.matchLinks
			.map((link) => link.matchId ? matchesById.get(link.matchId) : undefined)
			.find(Boolean);

		if (linkedMatch) {
			for (const link of event.matchLinks) {
				if (link.matchId) includedMatchIds.add(link.matchId);
			}
		}

		items.push({
			id: `event:${event.id}`,
			kind: event.type,
			title: linkedMatch ? getMatchTitle(linkedMatch) : event.title,
			start: event.startDateTime,
			end: event.endDateTime,
			location: event.location,
			team: linkedMatch?.team ?? event.teamScope,
			to: linkedMatch ? `/matches/${linkedMatch.id}` : `/events/${event.id}`,
			match: linkedMatch,
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
