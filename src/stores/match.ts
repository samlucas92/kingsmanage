import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { seedMatches } from "../data/seedMatches";

export type MatchState = "upcoming" | "won" | "lost" | "draw" | "postponed";

export type LineupFormation = "4-4-2" | "4-3-3" | "3-5-2" | "4-2-3-1";

export type PostponementAudit = {
	id: string;
	oldDate: string;
	newDate: string;
	reason?: string;
	changedAt: string;
};

export type MatchResult = {
	homeGoals: number;
	awayGoals: number;
};

export type MatchNotes = {
	availability: string;
	tactical: string;
	injuries: string;
	general: string;
};

export type SelectedPlayer = {
	playerId: string;
	x: number;
	y: number;
	area: "pitch" | "bench";
	positionIndex?: number;
};

export type MatchPlayerStat = {
	playerId: string;
	goals: number;
	assists: number;
	yellowCards: number;
	redCards: number;
};

export type MatchPlayerStatField =
	| "goals"
	| "assists"
	| "yellowCards"
	| "redCards";

export type Match = {
	id: string;
	opponent: string;
	date: string;
	venue: "home" | "away";
	state: MatchState;
	result?: MatchResult;
	isCompleted: boolean;
	isLineupLocked: boolean;
	selectedFormation: LineupFormation;
	notes?: MatchNotes;
	postponements: PostponementAudit[];
	selectedPlayers: SelectedPlayer[];
	playerStats?: MatchPlayerStat[];
};

export type MatchFixtureInput = {
	opponent: string;
	date: string;
	venue: "home" | "away";
};

type MatchStore = {
	matches: Match[];

	addMatch: (match: MatchFixtureInput) => void;

	updateMatchFixture: (
		matchId: string,
		match: MatchFixtureInput
	) => void;

	postponeMatch: (matchId: string, newDate: string, reason?: string) => void;

	restoreMatch: (matchId: string) => void;

	setResult: (matchId: string, result: MatchResult) => void;

	setSelectedPlayers: (
		matchId: string,
		selectedPlayers: SelectedPlayer[]
	) => void;

	setLineupFormation: (
		matchId: string,
		formation: LineupFormation
	) => void;

	updateSelectedPlayerPosition: (
		matchId: string,
		playerId: string,
		x: number,
		y: number,
		area?: "pitch" | "bench",
		positionIndex?: number
	) => void;

	removeSelectedPlayer: (matchId: string, playerId: string) => void;

	toggleLineupLocked: (matchId: string) => void;

	updateMatchNotes: (matchId: string, notes: MatchNotes) => void;

	updateMatchPlayerStat: (
		matchId: string,
		playerId: string,
		field: MatchPlayerStatField,
		value: number
	) => void;
};

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
	};
}

export const useMatchStore = create<MatchStore>()(
	persist(
		(set) => ({
			matches: seedMatches,

			addMatch: (match) =>
				set((state) => ({
					matches: [
						...state.matches,
						{
							id: crypto.randomUUID(),
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
						},
					],
				})),

			updateMatchFixture: (matchId, updatedFixture) =>
				set((state) => ({
					matches: state.matches.map((match) => {
						if (match.id !== matchId || match.isCompleted) {
							return match;
						}

						return {
							...match,
							opponent: updatedFixture.opponent,
							date: updatedFixture.date,
							venue: updatedFixture.venue,
						};
					}),
				})),

			postponeMatch: (matchId, newDate, reason) =>
				set((state) => ({
					matches: state.matches.map((match) => {
						if (match.id !== matchId || match.isCompleted) {
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
					}),
				})),

			restoreMatch: (matchId) =>
				set((state) => ({
					matches: state.matches.map((match) => {
						if (
							match.id !== matchId ||
							match.isCompleted ||
							match.state !== "postponed"
						) {
							return match;
						}

						return {
							...match,
							state: "upcoming",
						};
					}),
				})),

			setResult: (matchId, result) =>
				set((state) => ({
					matches: state.matches.map((match) => {
						if (match.id !== matchId || match.isCompleted) {
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
					}),
				})),

			setSelectedPlayers: (matchId, selectedPlayers) =>
				set((state) => ({
					matches: state.matches.map((match) => {
						if (match.id !== matchId || match.isLineupLocked) {
							return match;
						}

						return {
							...match,
							selectedPlayers,
						};
					}),
				})),

			setLineupFormation: (matchId, formation) =>
				set((state) => ({
					matches: state.matches.map((match) => {
						if (match.id !== matchId || match.isLineupLocked) {
							return match;
						}

						return {
							...match,
							selectedFormation: formation,
						};
					}),
				})),

			updateSelectedPlayerPosition: (
				matchId,
				playerId,
				x,
				y,
				area,
				positionIndex
			) =>
				set((state) => ({
					matches: state.matches.map((match) => {
						if (match.id !== matchId || match.isLineupLocked) {
							return match;
						}

						return {
							...match,
							selectedPlayers: match.selectedPlayers.map(
								(selectedPlayer) => {
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
								}
							),
						};
					}),
				})),

			removeSelectedPlayer: (matchId, playerId) =>
				set((state) => ({
					matches: state.matches.map((match) => {
						if (match.id !== matchId || match.isLineupLocked) {
							return match;
						}

						return {
							...match,
							selectedPlayers: match.selectedPlayers.filter(
								(player) => player.playerId !== playerId
							),
						};
					}),
				})),

			toggleLineupLocked: (matchId) =>
				set((state) => ({
					matches: state.matches.map((match) =>
						match.id === matchId
							? {
									...match,
									isLineupLocked: !match.isLineupLocked,
								}
							: match
					),
				})),

			updateMatchNotes: (matchId, notes) =>
				set((state) => ({
					matches: state.matches.map((match) =>
						match.id === matchId
							? {
									...match,
									notes,
								}
							: match
					),
				})),

			updateMatchPlayerStat: (matchId, playerId, field, value) =>
				set((state) => ({
					matches: state.matches.map((match) => {
						if (match.id !== matchId) {
							return match;
						}

						const currentStats = match.playerStats ?? [];
						const existingStat = currentStats.find(
							(stat) => stat.playerId === playerId
						);

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
					}),
				})),
		}),
		{
			name: "kingsbridge-colts-match-store",
			storage: createJSONStorage(() => localStorage),
		}
	)
);