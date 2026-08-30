import { apiClient } from "./apiClient";
import type {
	ClubTeam,
	LineupFormation,
	Match,
	MatchCompetitionType,
	MatchFixtureInput,
	MatchNotes,
	MatchPlayerStat,
	MatchResult,
	MatchState,
	PostponementAudit,
	SelectedPlayer,
} from "../stores/match";
import { FIRST_TEAM_ID, SECOND_TEAM_ID, normaliseLegacyTeamId } from "../stores/clubTeams";
import { toUtcIsoString } from "../utils/date";

type MatchVenue = Match["venue"];


export type PlayerMatchRecord = {
	id: string;
	seasonId?: string;
	team: ClubTeam;
	opponent: string;
	competitionType?: MatchCompetitionType;
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
type ApiMatchCompetitionType = "Unknown" | "League" | "Cup" | "Friendly" | "Tournament";
type ApiLineupFormation =
	| "FourFourTwo"
	| "FourThreeThree"
	| "ThreeFiveTwo"
	| "FourTwoThreeOne";
type ApiMatchAppearanceType =
	| "Unspecified"
	| "Started"
	| "SubstituteUsed"
	| "UnusedSubstitute";
type ApiMatchPlayerStat = Omit<MatchPlayerStat, "appearanceType"> & {
	appearanceType: ApiMatchAppearanceType;
};

type ApiMatch = Omit<
	Match,
	"team" | "venue" | "state" | "selectedFormation" | "playerStats" | "isDetailLoaded"
> & {
	team: ApiClubTeam;
	teamId?: string | null;
	venue: ApiMatchVenue;
	state: ApiMatchState;
	competitionType?: ApiMatchCompetitionType;
	selectedFormation: ApiLineupFormation;
	formationKey?: string;
	playerStats?: ApiMatchPlayerStat[];
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
	teamId: string;
	venue: ApiMatchVenue;
	state: ApiMatchState;
	competitionType?: ApiMatchCompetitionType;
};



type ApiPlayerMatchViewModel = Omit<
	PlayerMatchRecord,
	"team" | "venue" | "state" | "playerStat"
> & {
	team: ApiClubTeam;
	teamId: string;
	venue: ApiMatchVenue;
	state: ApiMatchState;
	competitionType?: ApiMatchCompetitionType;
	playerStat?: ApiMatchPlayerStat | null;
};

type ApiMatchFixtureInput = Omit<MatchFixtureInput, "team" | "venue"> & {
	team: ApiClubTeam;
	teamId: string;
	venue: ApiMatchVenue;
	state: ApiMatchState;
	isCompleted: boolean;
	isLineupLocked: boolean;
	selectedFormation: ApiLineupFormation;
	notes: MatchNotes;
	postponements: PostponementAudit[];
	selectedPlayers: SelectedPlayer[];
	playerStats: ApiMatchPlayerStat[];
};

type PostponeMatchInput = {
	newDate: string;
	reason?: string;
};

export type BulkMatchImportInput = {
	seasonId: string;
	createEvents: boolean;
	matches: Array<{
		teamId: string;
		teamName: string;
		opponent: string;
		competition: string;
		date: string;
		venue: "home" | "away";
		location: string;
		formationKey: string;
	}>;
};

export type BulkMatchImportResult = {
	matchCount: number;
	eventCount: number;
};

const emptyMatchNotes: MatchNotes = {
	availability: "",
	tactical: "",
	injuries: "",
	general: "",
};

function toApiClubTeam(team: ClubTeam): ApiClubTeam {
	return normaliseLegacyTeamId(team) === SECOND_TEAM_ID ? "Second" : "First";
}

function fromApiClubTeam(team: ApiClubTeam): ClubTeam {
	switch (team) {
		case "Second":
			return SECOND_TEAM_ID;
		case "First":
		default:
			return FIRST_TEAM_ID;
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

function fromApiCompetitionType(type?: ApiMatchCompetitionType): MatchCompetitionType | undefined {
	if (!type) {
		return undefined;
	}

	switch (type) {
		case "League":
			return "league";
		case "Cup":
			return "cup";
		case "Friendly":
			return "friendly";
		case "Tournament":
			return "tournament";
		case "Unknown":
		default:
			return "unknown";
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

function fromApiPlayerStat(stat: ApiMatchPlayerStat): MatchPlayerStat {
	return {
		...stat,
		appearanceType:
			stat.appearanceType === "Started"
				? "started"
				: stat.appearanceType === "SubstituteUsed"
					? "substituteUsed"
					: stat.appearanceType === "UnusedSubstitute"
						? "unusedSubstitute"
						: "unspecified",
	};
}

function toApiPlayerStat(stat: MatchPlayerStat): ApiMatchPlayerStat {
	return {
		...stat,
		appearanceType:
			stat.appearanceType === "started"
				? "Started"
				: stat.appearanceType === "substituteUsed"
					? "SubstituteUsed"
					: stat.appearanceType === "unusedSubstitute"
						? "UnusedSubstitute"
						: "Unspecified",
	};
}

function fromApiMatch(match: ApiMatch): Match {
	return {
		...match,
		team: match.teamId ?? fromApiClubTeam(match.team),
		venue: fromApiVenue(match.venue),
		state: fromApiState(match.state),
		competitionType: fromApiCompetitionType(match.competitionType),
		selectedFormation: match.formationKey || fromApiFormation(match.selectedFormation),
		result: match.result ?? undefined,
		notes: match.notes ?? emptyMatchNotes,
		postponements: match.postponements ?? [],
		selectedPlayers: match.selectedPlayers ?? [],
		playerStats: (match.playerStats ?? []).map(fromApiPlayerStat),
		isDetailLoaded: true,
	};
}

function fromApiMatchViewModel(match: ApiMatchViewModel): Match {
	return {
		...match,
		team: match.teamId ?? fromApiClubTeam(match.team),
		venue: fromApiVenue(match.venue),
		state: fromApiState(match.state),
		competitionType: fromApiCompetitionType(match.competitionType),
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
		team: match.teamId ?? fromApiClubTeam(match.team),
		venue: fromApiVenue(match.venue),
		state: fromApiState(match.state),
		competitionType: fromApiCompetitionType(match.competitionType),
		result: match.result ?? undefined,
		playerStat: match.playerStat ? fromApiPlayerStat(match.playerStat) : undefined,
	};
}

function toApiMatch(match: Match): ApiMatch {
	const { competitionType: _competitionType, isDetailLoaded, ...matchToSave } = match;
	void _competitionType;
	void isDetailLoaded;

	return {
		...matchToSave,
		date: toUtcIsoString(match.date),
		team: toApiClubTeam(match.team),
		teamId: normaliseLegacyTeamId(match.team),
		venue: toApiVenue(match.venue),
		state: toApiState(match.state),
		selectedFormation: toApiFormation(match.selectedFormation),
		notes: match.notes ?? emptyMatchNotes,
		postponements: match.postponements ?? [],
		selectedPlayers: match.selectedPlayers ?? [],
		playerStats: (match.playerStats ?? []).map(toApiPlayerStat),
	};
}

function toApiMatchFixture(match: MatchFixtureInput): ApiMatchFixtureInput {
	return {
		...match,
		formationKey: match.formationKey ?? "",
		date: toUtcIsoString(match.date),
		team: toApiClubTeam(match.team),
		teamId: normaliseLegacyTeamId(match.team),
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

	bulkImportMatches: async (input: BulkMatchImportInput) => {
		return apiClient.post<BulkMatchImportResult>("/matches/bulk-import", {
			seasonId: input.seasonId,
			createEvents: input.createEvents,
			matches: input.matches.map((match) => ({
				...match,
				team: toApiClubTeam(match.teamId),
				teamId: normaliseLegacyTeamId(match.teamId),
				venue: toApiVenue(match.venue),
				date: toUtcIsoString(match.date),
			})),
		});
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
		const updatedMatch = await apiClient.put<ApiMatch>(
			`/matches/${id}/formation-key`,
			{ formationKey: formation }
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
			playerStats.map(toApiPlayerStat)
		);
		return fromApiMatch(updatedMatch);
	},

	postponeMatch: async (
		id: string,
		input: PostponeMatchInput
	) => {
		const updatedMatch = await apiClient.post<ApiMatch>(
			`/matches/${id}/postpone`,
			{
				...input,
				newDate: toUtcIsoString(input.newDate),
			}
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
