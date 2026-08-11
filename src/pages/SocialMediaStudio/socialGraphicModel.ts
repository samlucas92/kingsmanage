import type { ClubTeamProfile } from "../../stores/clubTeams";
import { getClubTeamLabel } from "../../stores/clubTeams";
import type { Match } from "../../stores/match";
import type { Player } from "../../stores/players";
import type { SportFormation } from "../../constants/sports";
import { resolveLineupPosition } from "../../utils/lineupPosition";
import type {
	SocialFixture,
	SocialFixtureOverride,
	SocialGraphicKind,
	SocialLineup,
	SocialScorer,
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
		oppositionScorers: [],
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

export function formatScorersForInput(scorers: SocialScorer[]) {
	return scorers.map((scorer) => `${scorer.name}${scorer.goals > 1 ? ` x${scorer.goals}` : ""}`).join("\n");
}

export function parseScorersInput(value: string): SocialScorer[] {
	return value
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line, index) => {
			const match = line.match(/^(.*?)(?:\s+[x×](\d+))?$/i);
			const name = match?.[1]?.trim() || line;
			const goals = Math.max(1, Number.parseInt(match?.[2] ?? "1", 10));
			return {
				playerId: `opposition-scorer-${index}`,
				name,
				goals,
			};
		});
}

export function toSocialLineup(
	match: Match,
	players: Player[],
	formations: SportFormation[]
): SocialLineup {
	const formation = formations.find((candidate) => candidate.key === match.selectedFormation)
		?? formations[0];
	const playersById = new Map(players.map((player) => [player.id, player]));

	return {
		formationKey: formation?.key ?? match.selectedFormation,
		formationName: formation?.name ?? (match.selectedFormation || "Lineup"),
		players: [...match.selectedPlayers]
			.sort((first, second) => {
				if (first.area !== second.area) return first.area === "pitch" ? -1 : 1;
				const firstIndex = first.positionIndex ?? formation?.slots.findIndex(
					(slot) => slot.key === first.positionKey
				) ?? -1;
				const secondIndex = second.positionIndex ?? formation?.slots.findIndex(
					(slot) => slot.key === second.positionKey
				) ?? -1;
				return (firstIndex < 0 ? Number.MAX_SAFE_INTEGER : firstIndex) -
					(secondIndex < 0 ? Number.MAX_SAFE_INTEGER : secondIndex);
			})
			.map((selectedPlayer) => {
				const player = playersById.get(selectedPlayer.playerId);
				const resolvedPosition = resolveLineupPosition(
					selectedPlayer,
					formation?.slots ?? []
				);
				return {
					playerId: selectedPlayer.playerId,
					name: player?.name ?? "Unknown player",
					number: player?.number,
					position: resolvedPosition.slot?.label ?? player?.positions[0] ?? "",
					role: selectedPlayer.area === "pitch" ? "starter" as const : "substitute" as const,
					x: selectedPlayer.area === "pitch" ? resolvedPosition.x : undefined,
					y: selectedPlayer.area === "pitch" ? resolvedPosition.y : undefined,
				};
			}),
	};
}

export function withLineupCaptain(
	lineup: SocialLineup,
	playerIndex: number,
	isCaptain: boolean
): SocialLineup {
	return {
		...lineup,
		players: lineup.players.map((player, index) => ({
			...player,
			isCaptain: isCaptain && index === playerIndex && player.role === "starter",
		})),
	};
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
		oppositionScorers: override.oppositionScorers ?? fixture.oppositionScorers,
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
		case "lineup":
			return "Team lineup";
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
		case "lineup":
			return "Match lineup";
		case "upcomingFixtures":
		default:
			return "Upcoming fixtures";
	}
}
