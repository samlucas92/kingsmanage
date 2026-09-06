import type {
	MatchAppearanceType,
	MatchPlayerStat,
	SelectedPlayer,
} from "../../../../stores/match";

export const DEFAULT_MATCH_DURATION = 90;

export function clampMatchMinute(value: number, matchDuration: number) {
	if (!Number.isFinite(value)) return 0;
	return Math.min(Math.max(Math.round(value), 0), matchDuration);
}

export function calculateMinutesPlayed(
	appearanceType: MatchAppearanceType | undefined,
	eventMinute: number,
	matchDuration: number
) {
	const safeMinute = clampMatchMinute(eventMinute, matchDuration);

	if (appearanceType === "unusedSubstitute" || appearanceType === "unspecified") {
		return 0;
	}

	return appearanceType === "substituteUsed"
		? matchDuration - safeMinute
		: safeMinute;
}

export function getParticipationMinute(
	stat: MatchPlayerStat,
	matchDuration: number
) {
	const safeMinutesPlayed = clampMatchMinute(stat.minutes, matchDuration);
	return stat.appearanceType === "substituteUsed"
		? matchDuration - safeMinutesPlayed
		: safeMinutesPlayed;
}

export function buildMatchStatsDraft(
	selectedPlayers: SelectedPlayer[],
	playerStats: MatchPlayerStat[],
	matchDuration = DEFAULT_MATCH_DURATION
): MatchPlayerStat[] {
	return selectedPlayers.map((selectedPlayer) => {
		const savedStat = playerStats.find(
			(stat) => stat.playerId === selectedPlayer.playerId
		);
		const fallbackAppearance: MatchAppearanceType =
			selectedPlayer.area === "pitch" ? "started" : "unusedSubstitute";
		const appearanceType =
			savedStat?.appearanceType && savedStat.appearanceType !== "unspecified"
				? savedStat.appearanceType
				: fallbackAppearance;

		return {
			playerId: selectedPlayer.playerId,
			appearanceType,
			goals: savedStat?.goals ?? 0,
			assists: savedStat?.assists ?? 0,
			yellowCards: savedStat?.yellowCards ?? 0,
			redCards: savedStat?.redCards ?? 0,
			minutes:
				savedStat?.minutes ??
				(appearanceType === "started" ? matchDuration : 0),
			isMOTM: savedStat?.isMOTM ?? false,
			note: savedStat?.note ?? "",
		} satisfies MatchPlayerStat;
	});
}

export function updateStatsForMatchDuration(
	stats: MatchPlayerStat[],
	previousDuration: number,
	nextDuration: number
) {
	return stats.map((stat) => {
		if (stat.appearanceType === "unusedSubstitute") {
			return { ...stat, minutes: 0 };
		}

		if (stat.appearanceType === "substituteUsed") {
			const cameOnAt = getParticipationMinute(stat, previousDuration);
			return {
				...stat,
				minutes: calculateMinutesPlayed("substituteUsed", cameOnAt, nextDuration),
			};
		}

		const playedFullMatch = stat.minutes >= previousDuration;
		return {
			...stat,
			minutes: playedFullMatch
				? nextDuration
				: clampMatchMinute(stat.minutes, nextDuration),
		};
	});
}

export function updateMotmDraft(
	stats: MatchPlayerStat[],
	playerId: string,
	isMOTM: boolean
) {
	return stats.map((stat) =>
		stat.playerId === playerId ? { ...stat, isMOTM } : stat
	);
}
