import type { ClubTeamProfile } from "../../stores/clubTeams";
import { getClubTeamLabel } from "../../stores/clubTeams";
import type { Match } from "../../stores/match";
import type { SocialFixture, SocialGraphicKind } from "./types";

export function toSocialFixture(
	match: Match,
	teamProfiles: ClubTeamProfile[]
): SocialFixture {
	return {
		id: match.id,
		teamName: getClubTeamLabel(teamProfiles, match.team),
		opponent: match.opponent,
		competition: match.competition?.trim() || "Fixture",
		date: match.date,
		venue: match.venue,
		location: match.location?.trim() || "Venue to be confirmed",
		result: match.result,
	};
}

export function getClubScore(fixture: SocialFixture) {
	if (!fixture.result) return null;

	return fixture.venue === "home"
		? fixture.result.homeGoals
		: fixture.result.awayGoals;
}

export function getOpponentScore(fixture: SocialFixture) {
	if (!fixture.result) return null;

	return fixture.venue === "home"
		? fixture.result.awayGoals
		: fixture.result.homeGoals;
}

export function getDefaultHeadline(kind: SocialGraphicKind) {
	switch (kind) {
		case "fixture":
			return "Matchday";
		case "result":
			return "Full time";
		case "upcomingFixtures":
		default:
			return "Upcoming fixtures";
	}
}

export function getGraphicKindLabel(kind: SocialGraphicKind) {
	switch (kind) {
		case "fixture":
			return "Single fixture";
		case "result":
			return "Result";
		case "upcomingFixtures":
		default:
			return "Upcoming fixtures";
	}
}
