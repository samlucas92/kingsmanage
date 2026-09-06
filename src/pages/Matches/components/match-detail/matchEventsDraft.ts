import type {
	MatchPlayerStat,
	MatchTimelineEvent,
	SelectedPlayer,
} from "../../../../stores/match";

export function deriveMatchStatsFromEvents(
	selectedPlayers: SelectedPlayer[],
	matchEvents: MatchTimelineEvent[],
	matchDurationMinutes: number,
	existingStats: MatchPlayerStat[] = []
) {
	const duration = Math.min(Math.max(Math.round(matchDurationMinutes), 1), 180);
	const savedByPlayer = new Map(existingStats.map((stat) => [stat.playerId, stat]));
	const statsByPlayer = new Map<string, MatchPlayerStat>();
	const activeSince = new Map<string, number>();

	for (const player of selectedPlayers) {
		if (statsByPlayer.has(player.playerId)) continue;
		const saved = savedByPlayer.get(player.playerId);
		statsByPlayer.set(player.playerId, {
			playerId: player.playerId,
			appearanceType: player.area === "pitch" ? "started" : "unusedSubstitute",
			goals: 0,
			assists: 0,
			yellowCards: 0,
			redCards: 0,
			minutes: 0,
			isMOTM: saved?.isMOTM ?? false,
			note: saved?.note ?? "",
		});
		if (player.area === "pitch") activeSince.set(player.playerId, 0);
	}

	const orderedEvents = matchEvents
		.map((matchEvent, index) => ({ matchEvent, index }))
		.sort((left, right) => left.matchEvent.minute - right.matchEvent.minute || left.index - right.index)
		.map(({ matchEvent }) => matchEvent);

	for (const matchEvent of orderedEvents) {
		const stat = statsByPlayer.get(matchEvent.playerId);
		if (!stat) continue;
		const minute = Math.min(Math.max(Math.round(matchEvent.minute), 0), duration);

		if (matchEvent.type === "goal") {
			stat.goals += 1;
			const assistStat = matchEvent.secondaryPlayerId
				? statsByPlayer.get(matchEvent.secondaryPlayerId)
				: undefined;
			if (assistStat) assistStat.assists += 1;
			continue;
		}

		if (matchEvent.type === "yellowCard") {
			stat.yellowCards += 1;
			continue;
		}

		if (matchEvent.type === "redCard") {
			stat.redCards += 1;
			continue;
		}

		if (!matchEvent.secondaryPlayerId) continue;
		const playerOffSince = activeSince.get(matchEvent.secondaryPlayerId);
		const playerOffStat = statsByPlayer.get(matchEvent.secondaryPlayerId);
		if (playerOffSince !== undefined && playerOffStat) {
			playerOffStat.minutes += Math.max(0, minute - playerOffSince);
			activeSince.delete(matchEvent.secondaryPlayerId);
		}

		if (!activeSince.has(matchEvent.playerId)) {
			activeSince.set(matchEvent.playerId, minute);
			if (stat.appearanceType === "unusedSubstitute") {
				stat.appearanceType = "substituteUsed";
			}
		}
	}

	for (const [playerId, enteredAt] of activeSince) {
		const stat = statsByPlayer.get(playerId);
		if (stat) stat.minutes += duration - enteredAt;
	}

	return selectedPlayers
		.filter((player, index, players) =>
			players.findIndex((candidate) => candidate.playerId === player.playerId) === index
		)
		.map((player) => statsByPlayer.get(player.playerId)!);
}

export function sortMatchEvents(matchEvents: MatchTimelineEvent[]) {
	return matchEvents
		.map((matchEvent, index) => ({ matchEvent, index }))
		.sort((left, right) => left.matchEvent.minute - right.matchEvent.minute || left.index - right.index)
		.map(({ matchEvent }) => matchEvent);
}
