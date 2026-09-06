import type { MatchPlayerStat } from "../../../../stores/match";

export function updateMotmDraft(
	stats: MatchPlayerStat[],
	playerId: string,
	isMOTM: boolean
) {
	return stats.map((stat) =>
		stat.playerId === playerId ? { ...stat, isMOTM } : stat
	);
}
