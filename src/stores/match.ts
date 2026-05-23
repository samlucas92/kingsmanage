import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { seedMatches } from "../data/seedMatches";
import {
	createMatchRecord,
	normaliseMatchSeason,
	postponeMatchRecord,
	removeSelectedPlayerRecord,
	restoreMatchRecord,
	setLineupFormationRecord,
	setMatchResultRecord,
	setSelectedPlayersRecord,
	toggleLineupLockedRecord,
	updateMatchFixtureRecord,
	updateMatchNotesRecord,
	updateMatchPlayerStatRecord,
	updateSelectedPlayerPositionRecord,
} from "../services/matchService";

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
	minutes: number;
	isMOTM: boolean;
	note: string;
};

export type MatchPlayerStatField =
	| "goals"
	| "assists"
	| "yellowCards"
	| "redCards"
	| "minutes"
	| "isMOTM"
	| "note";

export type MatchPlayerStatValue = number | boolean | string;

export type ClubTeam = "first" | "second";

export type Match = {
	id: string;
	seasonId?: string;
	team: ClubTeam;
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
	seasonId?: string;
	team: ClubTeam;
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
		value: MatchPlayerStatValue
	) => void;
};

function normaliseMatchStore(matches: Match[]) {
	return matches.map(normaliseMatchSeason);
}

export const useMatchStore = create<MatchStore>()(
	persist(
		(set) => ({
			matches: normaliseMatchStore(seedMatches),

			addMatch: (match) =>
				set((state) => ({
					matches: [...state.matches, createMatchRecord(match)],
				})),

			updateMatchFixture: (matchId, updatedFixture) =>
				set((state) => ({
					matches: state.matches.map((match) =>
						match.id === matchId
							? updateMatchFixtureRecord(match, updatedFixture)
							: match
					),
				})),

			postponeMatch: (matchId, newDate, reason) =>
				set((state) => ({
					matches: state.matches.map((match) =>
						match.id === matchId
							? postponeMatchRecord(match, newDate, reason)
							: match
					),
				})),

			restoreMatch: (matchId) =>
				set((state) => ({
					matches: state.matches.map((match) =>
						match.id === matchId ? restoreMatchRecord(match) : match
					),
				})),

			setResult: (matchId, result) =>
				set((state) => ({
					matches: state.matches.map((match) =>
						match.id === matchId ? setMatchResultRecord(match, result) : match
					),
				})),

			setSelectedPlayers: (matchId, selectedPlayers) =>
				set((state) => ({
					matches: state.matches.map((match) =>
						match.id === matchId
							? setSelectedPlayersRecord(match, selectedPlayers)
							: match
					),
				})),

			setLineupFormation: (matchId, formation) =>
				set((state) => ({
					matches: state.matches.map((match) =>
						match.id === matchId
							? setLineupFormationRecord(match, formation)
							: match
					),
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
					matches: state.matches.map((match) =>
						match.id === matchId
							? updateSelectedPlayerPositionRecord(
									match,
									playerId,
									x,
									y,
									area,
									positionIndex
								)
							: match
					),
				})),

			removeSelectedPlayer: (matchId, playerId) =>
				set((state) => ({
					matches: state.matches.map((match) =>
						match.id === matchId
							? removeSelectedPlayerRecord(match, playerId)
							: match
					),
				})),

			toggleLineupLocked: (matchId) =>
				set((state) => ({
					matches: state.matches.map((match) =>
						match.id === matchId ? toggleLineupLockedRecord(match) : match
					),
				})),

			updateMatchNotes: (matchId, notes) =>
				set((state) => ({
					matches: state.matches.map((match) =>
						match.id === matchId ? updateMatchNotesRecord(match, notes) : match
					),
				})),

			updateMatchPlayerStat: (matchId, playerId, field, value) =>
				set((state) => ({
					matches: state.matches.map((match) =>
						match.id === matchId
							? updateMatchPlayerStatRecord(match, playerId, field, value)
							: match
					),
				})),
		}),
		{
			name: "kingsbridge-colts-match-store",
			storage: createJSONStorage(() => localStorage),
			version: 2,
			migrate: (persistedState) => {
				const state = persistedState as Partial<MatchStore>;

				return {
					...state,
					matches: normaliseMatchStore(state.matches ?? seedMatches),
				};
			},
		}
	)
);