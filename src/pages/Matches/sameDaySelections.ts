import type { Match } from "../../stores/match";

export type SameDaySelection = {
	matchId: string;
	team: string;
	opponent: string;
	date: string;
	isLineupLocked: boolean;
};

export function getSameDaySelectionsByPlayer(
	matches: Match[],
	currentMatch: Match
): Record<string, SameDaySelection[]> {
	const currentDateKey = getLocalDateKey(currentMatch.date);
	const selections: Record<string, SameDaySelection[]> = {};

	for (const match of matches) {
		if (
			match.id === currentMatch.id ||
			match.state === "postponed" ||
			getLocalDateKey(match.date) !== currentDateKey
		) {
			continue;
		}

		const playerIds = match.selectedPlayerIds ?? match.selectedPlayers.map(
			(selectedPlayer) => selectedPlayer.playerId
		);
		for (const playerId of new Set(playerIds)) {
			selections[playerId] = [
				...(selections[playerId] ?? []),
				{
					matchId: match.id,
					team: match.team,
					opponent: match.opponent,
					date: match.date,
					isLineupLocked: match.isLineupLocked,
				},
			];
		}
	}

	return selections;
}

function getLocalDateKey(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value.slice(0, 10);
	return [
		date.getFullYear(),
		String(date.getMonth() + 1).padStart(2, "0"),
		String(date.getDate()).padStart(2, "0"),
	].join("-");
}
