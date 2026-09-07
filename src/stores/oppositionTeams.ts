import { create } from "zustand";

import { oppositionTeamsApi } from "../services/oppositionTeamsApi";
import type { OppositionTeam, SaveOppositionTeamRequest } from "../types/oppositionTeams";

type OppositionTeamStore = {
	teams: OppositionTeam[];
	isLoading: boolean;
	hasLoaded: boolean;
	error: string;
	loadTeams: (force?: boolean) => Promise<void>;
	createTeam: (request: SaveOppositionTeamRequest) => Promise<OppositionTeam>;
	updateTeam: (id: string, request: SaveOppositionTeamRequest) => Promise<OppositionTeam>;
	replaceTeam: (team: OppositionTeam) => void;
};

function sortTeams(teams: OppositionTeam[]) {
	return [...teams].sort((first, second) => first.name.localeCompare(second.name));
}

export const useOppositionTeamStore = create<OppositionTeamStore>()((set, get) => ({
	teams: [],
	isLoading: false,
	hasLoaded: false,
	error: "",
	loadTeams: async (force = false) => {
		if (get().isLoading || (get().hasLoaded && !force)) return;
		set({ isLoading: true, error: "" });
		try {
			const teams = await oppositionTeamsApi.getAll();
			set({ teams: sortTeams(teams), isLoading: false, hasLoaded: true });
		} catch (error) {
			set({
				isLoading: false,
				hasLoaded: true,
				error: error instanceof Error ? error.message : "Opposition teams could not be loaded.",
			});
		}
	},
	createTeam: async (request) => {
		const created = await oppositionTeamsApi.create(request);
		set((state) => ({ teams: sortTeams([...state.teams, created]), error: "" }));
		return created;
	},
	updateTeam: async (id, request) => {
		const updated = await oppositionTeamsApi.update(id, request);
		set((state) => ({ teams: sortTeams(state.teams.map((team) => team.id === id ? updated : team)), error: "" }));
		return updated;
	},
	replaceTeam: (team) => set((state) => ({
		teams: sortTeams(state.teams.map((item) => item.id === team.id ? team : item)),
		error: "",
	})),
}));
