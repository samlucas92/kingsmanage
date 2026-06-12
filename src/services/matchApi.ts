import { apiClient } from "./apiClient";
import type {
	ClubTeam,
	LineupFormation,
	Match,
	MatchFixtureInput,
	MatchNotes,
	MatchPlayerStat,
	MatchResult,
	MatchState,
	PostponementAudit,
	SelectedPlayer,
} from "../stores/match";

type MatchVenue = Match["venue"];


export type PlayerMatchRecord = {
	id: string;
	seasonId?: string;
	team: ClubTeam;
	opponent: string;
	date: string;
	venue: MatchVenue;
	state: MatchState;
	result?: MatchResult;
	isCompleted: boolean;
	playerStat?: MatchPlayerStat;
};

type ApiClubTeam = "First" | "Second";
type ApiMatchVenue = "Home" | "Away";
type ApiMatchState = "Upcoming" | "Won" | "Lost" | "Draw" | "Postponed";
type ApiLineupFormation =
	| "FourFourTwo"
	| "FourThreeThree"
	| "ThreeFiveTwo"
	| "FourTwoThreeOne";

type ApiMatch = Omit<
	Match,
	"team" | "venue" | "state" | "selectedFormation" | "isDetailLoaded"
> & {
	team: ApiClubTeam;
	venue: ApiMatchVenue;
	state: ApiMatchState;
	selectedFormation: ApiLineupFormation;
};

type ApiMatchViewModel = Omit<
	Match,
	| "team"
	| "venue"
	| "state"
	| "selectedFormation"
	| "notes"
	| "postponements"
	| "selectedPlayers"
	| "playerStats"
	| "isDetailLoaded"
> & {
	team: ApiClubTeam;
	venue: ApiMatchVenue;
	state: ApiMatchState;
};



type ApiPlayerMatchViewModel = Omit<
	PlayerMatchRecord,
	"team" | "venue" | "state" | "playerStat"
> & {
	team: ApiClubTeam;
	venue: ApiMatchVenue;
	state: ApiMatchState;
	playerStat?: MatchPlayerStat | null;
};

type ApiMatchFixtureInput = Omit<MatchFixtureInput, "team" | "venue"> & {
	team: ApiClubTeam;
	venue: ApiMatchVenue;
	state: ApiMatchState;
	isCompleted: boolean;
	isLineupLocked: boolean;
	selectedFormation: ApiLineupFormation;
	notes: MatchNotes;
	postponements: PostponementAudit[];
	selectedPlayers: SelectedPlayer[];
	playerStats: MatchPlayerStat[];
};

type PostponeMatchInput = {
	newDate: string;
	reason?: string;
};

const emptyMatchNotes: MatchNotes = {
	availability: "",
	tactical: "",
	injuries: "",
	general: "",
};

function toApiClubTeam(team: ClubTeam): ApiClubTeam {
	switch (team) {
		case "second":
			return "Second";
		case "first":
		default:
			return "First";
	}
}

function fromApiClubTeam(team: ApiClubTeam): ClubTeam {
	switch (team) {
		case "Second":
			return "second";
		case "First":
		default:
			return "first";
	}
}

function toApiVenue(venue: MatchVenue): ApiMatchVenue {
	switch (venue) {
		case "away":
			return "Away";
		case "home":
		default:
			return "Home";
	}
}

function fromApiVenue(venue: ApiMatchVenue): MatchVenue {
	switch (venue) {
		case "Away":
			return "away";
		case "Home":
		default:
			return "home";
	}
}

function toApiState(state: MatchState): ApiMatchState {
	switch (state) {
		case "won":
			return "Won";
		case "lost":
			return "Lost";
		case "draw":
			return "Draw";
		case "postponed":
			return "Postponed";
		case "upcoming":
		default:
			return "Upcoming";
	}
}

function fromApiState(state: ApiMatchState): MatchState {
	switch (state) {
		case "Won":
			return "won";
		case "Lost":
			return "lost";
		case "Draw":
			return "draw";
		case "Postponed":
			return "postponed";
		case "Upcoming":
		default:
			return "upcoming";
	}
}

function toApiFormation(formation: LineupFormation): ApiLineupFormation {
	switch (formation) {
		case "4-4-2":
			return "FourFourTwo";
		case "3-5-2":
			return "ThreeFiveTwo";
		case "4-2-3-1":
			return "FourTwoThreeOne";
		case "4-3-3":
		default:
			return "FourThreeThree";
	}
}

function fromApiFormation(formation: ApiLineupFormation): LineupFormation {
	switch (formation) {
		case "FourFourTwo":
			return "4-4-2";
		case "ThreeFiveTwo":
			return "3-5-2";
		case "FourTwoThreeOne":
			return "4-2-3-1";
		case "FourThreeThree":
		default:
			return "4-3-3";
	}
}

function fromApiMatch(match: ApiMatch): Match {
	return {
		...match,
		team: fromApiClubTeam(match.team),
		venue: fromApiVenue(match.venue),
		state: fromApiState(match.state),
		selectedFormation: fromApiFormation(match.selectedFormation),
		result: match.result ?? undefined,
		notes: match.notes ?? emptyMatchNotes,
		postponements: match.postponements ?? [],
		selectedPlayers: match.selectedPlayers ?? [],
		playerStats: match.playerStats ?? [],
		isDetailLoaded: true,
	};
}

function fromApiMatchViewModel(match: ApiMatchViewModel): Match {
	return {
		...match,
		team: fromApiClubTeam(match.team),
		venue: fromApiVenue(match.venue),
		state: fromApiState(match.state),
		selectedFormation: "4-3-3",
		result: match.result ?? undefined,
		notes: emptyMatchNotes,
		postponements: [],
		selectedPlayers: [],
		playerStats: [],
		isDetailLoaded: false,
	};
}


function fromApiPlayerMatchViewModel(match: ApiPlayerMatchViewModel): PlayerMatchRecord {
	return {
		...match,
		team: fromApiClubTeam(match.team),
		venue: fromApiVenue(match.venue),
		state: fromApiState(match.state),
		result: match.result ?? undefined,
		playerStat: match.playerStat ?? undefined,
	};
}

function toApiMatch(match: Match): ApiMatch {
	const { isDetailLoaded, ...matchToSave } = match;

	return {
		...matchToSave,
		team: toApiClubTeam(match.team),
		venue: toApiVenue(match.venue),
		state: toApiState(match.state),
		selectedFormation: toApiFormation(match.selectedFormation),
		notes: match.notes ?? emptyMatchNotes,
		postponements: match.postponements ?? [],
		selectedPlayers: match.selectedPlayers ?? [],
		playerStats: match.playerStats ?? [],
	};
}

function toApiMatchFixture(match: MatchFixtureInput): ApiMatchFixtureInput {
	return {
		...match,
		team: toApiClubTeam(match.team),
		venue: toApiVenue(match.venue),
		state: "Upcoming",
		isCompleted: false,
		isLineupLocked: false,
		selectedFormation: "FourThreeThree",
		notes: emptyMatchNotes,
		postponements: [],
		selectedPlayers: [],
		playerStats: [],
	};
}

export const matchApi = {
	getMatches: async () => {
		const matches = await apiClient.get<ApiMatchViewModel[]>("/matches");
		return matches.map(fromApiMatchViewModel);
	},

	getSeasonMatches: async (seasonId: string) => {
		const matches = await apiClient.get<ApiMatchViewModel[]>(
			`/matches?seasonId=${encodeURIComponent(seasonId)}`
		);
		return matches.map(fromApiMatchViewModel);
	},

	getPlayerMatches: async (playerId: string, seasonId?: string) => {
		const query = seasonId
			? `?seasonId=${encodeURIComponent(seasonId)}`
			: "";
		const matches = await apiClient.get<ApiPlayerMatchViewModel[]>(
			`/matches/player/${encodeURIComponent(playerId)}${query}`
		);
		return matches.map(fromApiPlayerMatchViewModel);
	},

	getMatch: async (id: string) => {
		const match = await apiClient.get<ApiMatch>(`/matches/${id}`);
		return fromApiMatch(match);
	},

	createMatch: async (match: MatchFixtureInput) => {
		const createdMatch = await apiClient.post<ApiMatch>(
			"/matches",
			toApiMatchFixture(match)
		);
		return fromApiMatch(createdMatch);
	},

	updateMatch: async (id: string, match: Match) => {
		const updatedMatch = await apiClient.put<ApiMatch>(
			`/matches/${id}`,
			toApiMatch(match)
		);
		return fromApiMatch(updatedMatch);
	},

	deleteMatch: async (id: string) => {
		await apiClient.delete(`/matches/${id}`);
	},

	setResult: async (id: string, result: MatchResult) => {
		const updatedMatch = await apiClient.put<ApiMatch>(
			`/matches/${id}/result`,
			result
		);
		return fromApiMatch(updatedMatch);
	},

	clearResult: async (id: string) => {
		const updatedMatch = await apiClient.delete<ApiMatch>(
			`/matches/${id}/result`
		);
		return fromApiMatch(updatedMatch);
	},

	setSelectedPlayers: async (
		id: string,
		selectedPlayers: SelectedPlayer[]
	) => {
		const updatedMatch = await apiClient.put<ApiMatch>(
			`/matches/${id}/lineup`,
			selectedPlayers
		);
		return fromApiMatch(updatedMatch);
	},

	setLineupFormation: async (
		id: string,
		formation: LineupFormation
	) => {
		const apiFormation = toApiFormation(formation);
		const updatedMatch = await apiClient.put<ApiMatch>(
			`/matches/${id}/formation?formation=${encodeURIComponent(apiFormation)}`,
			undefined
		);
		return fromApiMatch(updatedMatch);
	},

	toggleLineupLocked: async (id: string) => {
		const updatedMatch = await apiClient.patch<ApiMatch>(
			`/matches/${id}/lineup/toggle-lock`,
			undefined
		);
		return fromApiMatch(updatedMatch);
	},

	updateNotes: async (id: string, notes: MatchNotes) => {
		const updatedMatch = await apiClient.put<ApiMatch>(
			`/matches/${id}/notes`,
			notes
		);
		return fromApiMatch(updatedMatch);
	},

	updatePlayerStats: async (
		id: string,
		playerStats: MatchPlayerStat[]
	) => {
		const updatedMatch = await apiClient.put<ApiMatch>(
			`/matches/${id}/player-stats`,
			playerStats
		);
		return fromApiMatch(updatedMatch);
	},

	postponeMatch: async (
		id: string,
		input: PostponeMatchInput
	) => {
		const updatedMatch = await apiClient.post<ApiMatch>(
			`/matches/${id}/postpone`,
			input
		);
		return fromApiMatch(updatedMatch);
	},

	restoreMatch: async (id: string) => {
		const updatedMatch = await apiClient.patch<ApiMatch>(
			`/matches/${id}/restore`,
			undefined
		);
		return fromApiMatch(updatedMatch);
	},
};
