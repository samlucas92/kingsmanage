import { apiClient } from "./apiClient";
import type { OppositionTeam, SaveOppositionTeamRequest } from "../types/oppositionTeams";

export const oppositionTeamsApi = {
	getAll: () => apiClient.get<OppositionTeam[]>("/opposition-teams"),
	create: (team: SaveOppositionTeamRequest) => apiClient.post<OppositionTeam>("/opposition-teams", team),
	update: (id: string, team: SaveOppositionTeamRequest) =>
		apiClient.put<OppositionTeam>(`/opposition-teams/${encodeURIComponent(id)}`, team),
};
