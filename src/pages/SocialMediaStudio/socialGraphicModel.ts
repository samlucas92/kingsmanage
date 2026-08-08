import type { ClubTeamProfile } from "../../stores/clubTeams";
import { getClubTeamLabel } from "../../stores/clubTeams";
import type { Match } from "../../stores/match";
import type { Player } from "../../stores/players";
import type {
	SocialFixture,
	SocialFixtureOverride,
	SocialGraphicKind,
} from "./types";

export function toSocialFixture(
	match: Match,
	teamProfiles: ClubTeamProfile[],
	players: Player[] = []
): SocialFixture {
	return {
		id: match.id,
		teamName: getClubTeamLabel(teamProfiles, match.team),
		opponent: match.opponent,
		competition: match.competition?.trim() || "Fixture",
		date: match.date,
		venue: match.venue,
		location: match.location?.trim() || "Venue to be confirmed",
		playerOfTheMatch: getPlayerOfTheMatch(match, players),
		result: match.result,
		scorers: aggregateScorers(match, players),
	};
}

export function getPlayerOfTheMatch(match: Match, players: Player[]) {
	const playerOfTheMatchId = match.playerStats?.find((stat) => stat.isMOTM)?.playerId;
	if (!playerOfTheMatchId) return "";

	return players.find((player) => player.id === playerOfTheMatchId)?.name ?? "";
}

export function aggregateScorers(match: Match, players: Player[]) {
	const goalTotals = new Map<string, number>();

	(match.playerStats ?? []).forEach((stat) => {
		if (stat.goals <= 0) return;
		goalTotals.set(stat.playerId, (goalTotals.get(stat.playerId) ?? 0) + stat.goals);
	});

	const playerNames = new Map(players.map((player) => [player.id, player.name]));
	return [...goalTotals.entries()]
		.map(([playerId, goals]) => ({
			playerId,
			name: playerNames.get(playerId) ?? "Unknown player",
			goals,
		}))
		.sort((first, second) => second.goals - first.goals || first.name.localeCompare(second.name));
}

export function applySocialFixtureOverride(
	fixture: SocialFixture,
	override: SocialFixtureOverride | undefined
): SocialFixture {
	if (!override) return fixture;

	const result = fixture.result
		? {
			homeGoals: override.homeGoals ?? fixture.result.homeGoals,
			awayGoals: override.awayGoals ?? fixture.result.awayGoals,
		}
		: fixture.result;

	return {
		...fixture,
		teamName: override.teamName ?? fixture.teamName,
		opponent: override.opponent ?? fixture.opponent,
		competition: override.competition ?? fixture.competition,
		date: override.date ?? fixture.date,
		venue: override.venue ?? fixture.venue,
		location: override.location ?? fixture.location,
		playerOfTheMatch: override.playerOfTheMatch ?? fixture.playerOfTheMatch,
		result,
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
			return "Fixtures";
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
