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
	venue: EventMatchVenue;
};

export function createMatchTeamDraft(teamId: string): MatchTeamDraft {
	return {
		teamId,
		matchId: "",
		opponent: "",
		competition: "",
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
	eventLocation,
	eventStartDateTime,
	seasonId,
}: {
	draft: MatchTeamDraft;
	eventLocation: string;
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
		location: eventLocation.trim(),
		selectedFormation: "FourThreeThree",
	};
}
