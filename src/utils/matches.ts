import type { ClubTeam, Match, MatchState } from "../stores/match";

export function sortMatchesAscending(firstMatch: Match, secondMatch: Match) {
	return new Date(firstMatch.date).getTime() - new Date(secondMatch.date).getTime();
}

export function sortMatchesDescending(firstMatch: Match, secondMatch: Match) {
	return new Date(secondMatch.date).getTime() - new Date(firstMatch.date).getTime();
}

export function getTeamLabel(team: ClubTeam | string) {
	if (team === "First" || team === "first") {
		return "First Team";
	}

	if (team === "Second" || team === "second") {
		return "Second Team";
	}

	return "Team";
}

export function getVenueLabel(venue: Match["venue"] | string) {
	if (venue === "Home" || venue === "home") {
		return "Home";
	}

	return "Away";
}

export function getMatchStatusLabel(state: MatchState | string) {
	if (state === "won" || state === "Won") {
		return "Won";
	}

	if (state === "lost" || state === "Lost") {
		return "Lost";
	}

	if (state === "draw" || state === "Draw") {
		return "Draw";
	}

	if (state === "postponed" || state === "Postponed") {
		return "Postponed";
	}

	return "Upcoming";
}

export function getMatchStatusTone(state: MatchState | string) {
	if (state === "won" || state === "Won") {
		return "success";
	}

	if (state === "lost" || state === "Lost") {
		return "danger";
	}

	if (state === "draw" || state === "Draw") {
		return "warning";
	}

	if (state === "postponed" || state === "Postponed") {
		return "neutral";
	}

	return "info";
}
