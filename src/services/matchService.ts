import type {
	LineupFormation,
	Match,
	MatchFixtureInput,
	MatchNotes,
	MatchPlayerStat,
	MatchPlayerStatField,
	MatchPlayerStatValue,
	MatchResult,
	MatchState,
	SelectedPlayer,
} from "../stores/match";

const emptyMatchNotes: MatchNotes = {
	availability: "",
	tactical: "",
	injuries: "",
	general: "",
};

function createEmptyPlayerStat(playerId: string): MatchPlayerStat {
	return {
		playerId,
		goals: 0,
		assists: 0,
		yellowCards: 0,
		redCards: 0,
		minutes: 0,
		isMOTM: false,
		note: "",
	};
}

export function createMatchRecord(match: MatchFixtureInput): Match {
	return {
		id: crypto.randomUUID(),
		team: match.team,
		opponent: match.opponent,
		date: match.date,
		venue: match.venue,
		state: "upcoming",
		isCompleted: false,
		isLineupLocked: false,
		selectedFormation: "4-4-2",
		notes: emptyMatchNotes,
		postponements: [],
		selectedPlayers: [],
		playerStats: [],
	};
}

export function updateMatchFixtureRecord(
	match: Match,
	updatedFixture: MatchFixtureInput
): Match {
	if (match.isCompleted) {
		return match;
	}

	return {
		...match,
		team: updatedFixture.team,
		opponent: updatedFixture.opponent,
		date: updatedFixture.date,
		venue: updatedFixture.venue,
	};
}

export function postponeMatchRecord(
	match: Match,
	newDate: string,
	reason?: string
): Match {
	if (match.isCompleted) {
		return match;
	}

	return {
		...match,
		postponements: [
			...match.postponements,
			{
				id: crypto.randomUUID(),
				oldDate: match.date,
				newDate,
				reason,
				changedAt: new Date().toISOString(),
			},
		],
		date: newDate,
		state: "postponed",
	};
}

export function restoreMatchRecord(match: Match): Match {
	if (match.isCompleted || match.state !== "postponed") {
		return match;
	}

	return {
		...match,
		state: "upcoming",
	};
}

export function setMatchResultRecord(match: Match, result: MatchResult): Match {
	if (match.isCompleted) {
		return match;
	}

	const nextState: MatchState =
		result.homeGoals > result.awayGoals
			? "won"
			: result.homeGoals < result.awayGoals
				? "lost"
				: "draw";

	return {
		...match,
		result,
		state: nextState,
		isCompleted: true,
	};
}

export function setSelectedPlayersRecord(
	match: Match,
	selectedPlayers: SelectedPlayer[]
): Match {
	if (match.isLineupLocked) {
		return match;
	}

	return {
		...match,
		selectedPlayers,
	};
}

export function setLineupFormationRecord(
	match: Match,
	formation: LineupFormation
): Match {
	if (match.isLineupLocked) {
		return match;
	}

	return {
		...match,
		selectedFormation: formation,
	};
}

export function updateSelectedPlayerPositionRecord(
	match: Match,
	playerId: string,
	x: number,
	y: number,
	area?: "pitch" | "bench",
	positionIndex?: number
): Match {
	if (match.isLineupLocked) {
		return match;
	}

	return {
		...match,
		selectedPlayers: match.selectedPlayers.map((selectedPlayer) => {
			if (selectedPlayer.playerId !== playerId) {
				return selectedPlayer;
			}

			return {
				...selectedPlayer,
				x,
				y,
				area: area ?? selectedPlayer.area,
				positionIndex,
			};
		}),
	};
}

export function removeSelectedPlayerRecord(
	match: Match,
	playerId: string
): Match {
	if (match.isLineupLocked) {
		return match;
	}

	return {
		...match,
		selectedPlayers: match.selectedPlayers.filter(
			(player) => player.playerId !== playerId
		),
	};
}

export function toggleLineupLockedRecord(match: Match): Match {
	return {
		...match,
		isLineupLocked: !match.isLineupLocked,
	};
}

export function updateMatchNotesRecord(
	match: Match,
	notes: MatchNotes
): Match {
	return {
		...match,
		notes,
	};
}

export function updateMatchPlayerStatRecord(
	match: Match,
	playerId: string,
	field: MatchPlayerStatField,
	value: MatchPlayerStatValue
): Match {
	const currentStats = match.playerStats ?? [];

	const existingStat = currentStats.find((stat) => stat.playerId === playerId);

	if (!existingStat) {
		return {
			...match,
			playerStats: [
				...currentStats,
				{
					...createEmptyPlayerStat(playerId),
					[field]: value,
				},
			],
		};
	}

	return {
		...match,
		playerStats: currentStats.map((stat) =>
			stat.playerId === playerId
				? {
						...stat,
						[field]: value,
					}
				: stat
		),
	};
}