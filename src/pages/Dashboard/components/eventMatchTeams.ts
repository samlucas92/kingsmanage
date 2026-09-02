import { FIRST_TEAM_ID, SECOND_TEAM_ID } from "../../../stores/clubTeams";
import type {
	ClubEventTeamScope,
	CreateMatchForEventRequest,
	EventClubTeam,
	EventMatchVenue,
} from "../../../types/events";

export type MatchTeamDraft = {
	teamId: string;
	matchId: string;
	opponent: string;
	competition: string;
	location: string;
	venue: EventMatchVenue;
};

export function createMatchTeamDraft(teamId: string): MatchTeamDraft {
	return {
		teamId,
		matchId: "",
		opponent: "",
		competition: "",
		location: "",
		venue: "Home",
	};
}

export function getLegacyTeam(teamId: string): EventClubTeam {
	return teamId === SECOND_TEAM_ID ? "Second" : "First";
}

export function getLegacyTeamScope(teamIds: string[]): ClubEventTeamScope {
	if (teamIds.length === 1 && teamIds[0] === FIRST_TEAM_ID) {
		return "First";
	}

	if (teamIds.length === 1 && teamIds[0] === SECOND_TEAM_ID) {
		return "Second";
	}

	return "Both";
}

export function buildCreateMatchRequest({
	draft,
	eventStartDateTime,
	seasonId,
}: {
	draft: MatchTeamDraft;
	eventStartDateTime: string;
	seasonId: string;
}): CreateMatchForEventRequest {
	return {
		seasonId,
		team: getLegacyTeam(draft.teamId),
		teamId: draft.teamId,
		opponent: draft.opponent.trim(),
		competition: draft.competition.trim(),
		date: new Date(eventStartDateTime).toISOString(),
		venue: draft.venue,
		location: draft.location.trim(),
		selectedFormation: "FourThreeThree",
	};
}

export function summariseMatchLocations(locations: string[]) {
	const uniqueLocations = locations
		.map((location) => location.trim())
		.filter(Boolean)
		.filter((location, index, values) =>
			values.findIndex((candidate) => candidate.toLocaleLowerCase() === location.toLocaleLowerCase()) === index
		);

	if (uniqueLocations.length === 0) return "";
	if (uniqueLocations.length === 1) return uniqueLocations[0];
	return "Multiple venues";
}
