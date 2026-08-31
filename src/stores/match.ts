import { create } from "zustand";
import { matchApi } from "../services/matchApi";
import { useSeasonStore } from "./seasons";

export type MatchState = "upcoming" | "won" | "lost" | "draw" | "postponed";
export type LineupFormation = string;

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
	x?: number;
	y?: number;
	area: "pitch" | "bench";
	positionKey?: string;
	positionIndex?: number;
};

export type MatchPlayerStat = {
	playerId: string;
	appearanceType?: MatchAppearanceType;
	goals: number;
	assists: number;
	yellowCards: number;
	redCards: number;
	minutes: number;
	isMOTM: boolean;
	note: string;
};

export type MatchAppearanceType =
	| "unspecified"
	| "started"
	| "substituteUsed"
	| "unusedSubstitute";

export type MatchPlayerStatField =
	| "goals"
	| "assists"
	| "yellowCards"
	| "redCards"
	| "minutes"
	| "isMOTM"
	| "note";

export type MatchPlayerStatValue = number | boolean | string;
export type ClubTeam = string;
export type MatchCompetitionType = "unknown" | "league" | "cup" | "friendly" | "tournament";

export type Match = {
	id: string;
	seasonId?: string;
	clubEventId?: string | null;
	team: ClubTeam;
	opponent: string;
	competition?: string;
	competitionType?: MatchCompetitionType;
	date: string;
	venue: "home" | "away";
	location?: string;
	state: MatchState;
	result?: MatchResult;
	isCompleted: boolean;
	isLineupLocked: boolean;
	selectedFormation: LineupFormation;
	notes?: MatchNotes;
	postponements: PostponementAudit[];
	selectedPlayers: SelectedPlayer[];
	playerStats?: MatchPlayerStat[];
	isDetailLoaded?: boolean;
};

export type MatchFixtureInput = {
	seasonId?: string;
	team: ClubTeam;
	opponent: string;
	date: string;
	venue: "home" | "away";
	location: string;
	competition: string;
	formationKey?: LineupFormation;
};

type MatchStore = {
	matches: Match[];
	isLoadingMatches: boolean;
	hasLoadedMatches: boolean;
	loadedSeasonId: string;
	matchLoadError: string;
	loadMatches: (seasonId?: string, force?: boolean) => Promise<void>;
	loadMatch: (matchId: string, force?: boolean) => Promise<void>;
	addMatch: (match: MatchFixtureInput, createEvent?: boolean) => Promise<void>;
	updateMatchFixture: (
		matchId: string,
		match: MatchFixtureInput
	) => Promise<void>;
	deleteMatch: (matchId: string, linkedEvent?: "delete" | "detach") => Promise<void>;
	postponeMatch: (
		matchId: string,
		newDate: string,
		reason?: string
	) => Promise<void>;
	restoreMatch: (matchId: string) => Promise<void>;
	setResult: (matchId: string, result: MatchResult) => Promise<void>;
	clearResult: (matchId: string) => Promise<void>;
	setSelectedPlayers: (
		matchId: string,
		selectedPlayers: SelectedPlayer[]
	) => Promise<void>;
	setLineupFormation: (
		matchId: string,
		formation: LineupFormation
	) => Promise<void>;
	updateSelectedPlayerPosition: (
		matchId: string,
		playerId: string,
		x: number,
		y: number,
		area?: "pitch" | "bench",
		positionIndex?: number
	) => Promise<void>;
	removeSelectedPlayer: (matchId: string, playerId: string) => Promise<void>;
	toggleLineupLocked: (matchId: string) => Promise<void>;
	updateMatchNotes: (
		matchId: string,
		notes: MatchNotes
	) => Promise<void>;
	updateMatchPlayerStats: (
		matchId: string,
		playerStats: MatchPlayerStat[]
	) => Promise<void>;
};

const emptyMatchNotes: MatchNotes = {
	availability: "",
	tactical: "",
	injuries: "",
	general: "",
};

function normaliseMatch(match: Match): Match {
	return {
		...match,
		notes: match.notes ?? emptyMatchNotes,
		postponements: match.postponements ?? [],
		selectedPlayers: match.selectedPlayers ?? [],
		playerStats: match.playerStats ?? [],
	};
}

function normaliseMatchStore(matches: Match[]) {
	return matches.map(normaliseMatch);
}

function replaceMatch(matches: Match[], updatedMatch: Match) {
	const normalisedMatch = normaliseMatch(updatedMatch);
	const exists = matches.some((match) => match.id === normalisedMatch.id);

	if (!exists) {
		return [...matches, normalisedMatch];
	}

	return matches.map((match) =>
		match.id === normalisedMatch.id ? normalisedMatch : match
	);
}

function getDefaultSeasonId() {
	return useSeasonStore.getState().activeSeasonId || undefined;
}

export const useMatchStore = create<MatchStore>()((set, get) => ({
	matches: [],
	isLoadingMatches: false,
	hasLoadedMatches: false,
	loadedSeasonId: "",
	matchLoadError: "",

	loadMatches: async (seasonId, force = false) => {
		const requestedSeasonId = seasonId ?? getDefaultSeasonId() ?? "";

		if (get().isLoadingMatches) {
			return;
		}

		if (
			get().hasLoadedMatches &&
			get().loadedSeasonId === requestedSeasonId &&
			!force
		) {
			return;
		}

		set({
			isLoadingMatches: true,
			matchLoadError: "",
		});

		try {
			const matches = requestedSeasonId
				? await matchApi.getSeasonMatches(requestedSeasonId)
				: await matchApi.getMatches();

			set({
				matches: normaliseMatchStore(matches),
				isLoadingMatches: false,
				hasLoadedMatches: true,
				loadedSeasonId: requestedSeasonId,
			});
		} catch (error) {
			set({
				isLoadingMatches: false,
				matchLoadError:
					error instanceof Error ? error.message : "Failed to load matches.",
			});
		}
	},

	loadMatch: async (matchId, force = false) => {
		const currentMatch = get().matches.find((match) => match.id === matchId);

		if (!force && currentMatch?.isDetailLoaded) {
			return;
		}

		set({
			isLoadingMatches: true,
			matchLoadError: "",
		});

		try {
			const match = await matchApi.getMatch(matchId);

			set((state) => ({
				matches: replaceMatch(state.matches, match),
				isLoadingMatches: false,
			}));
		} catch (error) {
			set({
				isLoadingMatches: false,
				matchLoadError:
					error instanceof Error ? error.message : "Failed to load match.",
			});
		}
	},

	addMatch: async (match, createEvent = true) => {
		const createdMatch = await matchApi.createMatch({
			...match,
			seasonId: match.seasonId ?? getDefaultSeasonId(),
		}, createEvent);

		set((state) => ({
			matches: replaceMatch(state.matches, createdMatch),
			hasLoadedMatches: true,
		}));
	},

	updateMatchFixture: async (matchId, updatedFixture) => {
		let currentMatch = get().matches.find((match) => match.id === matchId);

		if (!currentMatch?.isDetailLoaded) {
			currentMatch = await matchApi.getMatch(matchId);
		}

		if (!currentMatch) {
			return;
		}

		const updatedMatch: Match = {
			...currentMatch,
			seasonId: updatedFixture.seasonId ?? currentMatch.seasonId,
			team: updatedFixture.team,
			opponent: updatedFixture.opponent,
			date: updatedFixture.date,
			venue: updatedFixture.venue,
			location: updatedFixture.location,
			competition: updatedFixture.competition,
		};

		const savedMatch = await matchApi.updateMatch(matchId, updatedMatch);

		set((state) => ({
			matches: replaceMatch(state.matches, savedMatch),
		}));
	},

	deleteMatch: async (matchId, linkedEvent = "delete") => {
		await matchApi.deleteMatch(matchId, linkedEvent);
		set((state) => ({
			matches: state.matches.filter((match) => match.id !== matchId),
		}));
	},

	postponeMatch: async (matchId, newDate, reason) => {
		const savedMatch = await matchApi.postponeMatch(matchId, {
			newDate,
			reason,
		});

		set((state) => ({
			matches: replaceMatch(state.matches, savedMatch),
		}));
	},

	restoreMatch: async (matchId) => {
		const savedMatch = await matchApi.restoreMatch(matchId);

		set((state) => ({
			matches: replaceMatch(state.matches, savedMatch),
		}));
	},

	setResult: async (matchId, result) => {
		const savedMatch = await matchApi.setResult(matchId, result);

		set((state) => ({
			matches: replaceMatch(state.matches, savedMatch),
		}));
	},

	clearResult: async (matchId) => {
		const savedMatch = await matchApi.clearResult(matchId);

		set((state) => ({
			matches: replaceMatch(state.matches, savedMatch),
		}));
	},

	setSelectedPlayers: async (matchId, selectedPlayers) => {
		const currentMatch = get().matches.find((match) => match.id === matchId);

		if (!currentMatch || currentMatch.isLineupLocked) {
			return;
		}

		const savedMatch = await matchApi.setSelectedPlayers(
			matchId,
			selectedPlayers
		);

		set((state) => ({
			matches: replaceMatch(state.matches, savedMatch),
		}));
	},

	setLineupFormation: async (matchId, formation) => {
		const currentMatch = get().matches.find((match) => match.id === matchId);

		if (!currentMatch || currentMatch.isLineupLocked) {
			return;
		}

		const savedMatch = await matchApi.setLineupFormation(
			matchId,
			formation
		);

		set((state) => ({
			matches: replaceMatch(state.matches, savedMatch),
		}));
	},

	updateSelectedPlayerPosition: async (
		matchId,
		playerId,
		x,
		y,
		area,
		positionIndex
	) => {
		const currentMatch = get().matches.find((match) => match.id === matchId);

		if (!currentMatch || currentMatch.isLineupLocked) {
			return;
		}

		const selectedPlayers = currentMatch.selectedPlayers.map(
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
		);

		const savedMatch = await matchApi.setSelectedPlayers(
			matchId,
			selectedPlayers
		);

		set((state) => ({
			matches: replaceMatch(state.matches, savedMatch),
		}));
	},

	removeSelectedPlayer: async (matchId, playerId) => {
		const currentMatch = get().matches.find((match) => match.id === matchId);

		if (!currentMatch || currentMatch.isLineupLocked) {
			return;
		}

		const selectedPlayers = currentMatch.selectedPlayers.filter(
			(selectedPlayer) => selectedPlayer.playerId !== playerId
		);

		const savedMatch = await matchApi.setSelectedPlayers(
			matchId,
			selectedPlayers
		);

		set((state) => ({
			matches: replaceMatch(state.matches, savedMatch),
		}));
	},

	toggleLineupLocked: async (matchId) => {
		const savedMatch = await matchApi.toggleLineupLocked(matchId);

		set((state) => ({
			matches: replaceMatch(state.matches, savedMatch),
		}));
	},

	updateMatchNotes: async (matchId, notes) => {
		const savedMatch = await matchApi.updateNotes(matchId, notes);

		set((state) => ({
			matches: replaceMatch(state.matches, savedMatch),
		}));
	},

	updateMatchPlayerStats: async (matchId, playerStats) => {
		const savedMatch = await matchApi.updatePlayerStats(
			matchId,
			playerStats
		);

		set((state) => ({
			matches: replaceMatch(state.matches, savedMatch),
		}));
	},
}));
