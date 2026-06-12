import { create } from "zustand";
import { matchApi } from "../services/matchApi";
import { useSeasonStore } from "./seasons";

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
	isDetailLoaded?: boolean;
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
	isLoadingMatches: boolean;
	hasLoadedMatches: boolean;
	loadedSeasonId: string;
	matchLoadError: string;
	loadMatches: (seasonId?: string, force?: boolean) => Promise<void>;
	loadMatch: (matchId: string, force?: boolean) => Promise<void>;
	addMatch: (match: MatchFixtureInput) => Promise<void>;
	updateMatchFixture: (
		matchId: string,
		match: MatchFixtureInput
	) => Promise<void>;
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
	updateMatchPlayerStat: (
		matchId: string,
		playerId: string,
		field: MatchPlayerStatField,
		value: MatchPlayerStatValue
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

function getUpdatedPlayerStats(
	currentStats: MatchPlayerStat[],
	playerId: string,
	field: MatchPlayerStatField,
	value: MatchPlayerStatValue
) {
	const existingStat = currentStats.find((stat) => stat.playerId === playerId);

	if (!existingStat) {
		return [
			...currentStats,
			{
				...createEmptyPlayerStat(playerId),
				[field]: value,
			},
		];
	}

	return currentStats.map((stat) =>
		stat.playerId === playerId
			? {
				...stat,
				[field]: value,
			}
			: stat
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

	addMatch: async (match) => {
		const createdMatch = await matchApi.createMatch({
			...match,
			seasonId: match.seasonId ?? getDefaultSeasonId(),
		});

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
		};

		const savedMatch = await matchApi.updateMatch(matchId, updatedMatch);

		set((state) => ({
			matches: replaceMatch(state.matches, savedMatch),
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

	updateMatchPlayerStat: async (matchId, playerId, field, value) => {
		const currentMatch = get().matches.find((match) => match.id === matchId);

		if (!currentMatch) {
			return;
		}

		const playerStats = getUpdatedPlayerStats(
			currentMatch.playerStats ?? [],
			playerId,
			field,
			value
		);

		const savedMatch = await matchApi.updatePlayerStats(
			matchId,
			playerStats
		);

		set((state) => ({
			matches: replaceMatch(state.matches, savedMatch),
		}));
	},
}));
