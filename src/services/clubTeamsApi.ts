import { apiClient } from "./apiClient";
import type { ClubTeamProfile } from "../stores/clubTeams";

export const clubTeamsApi = {
	getAll: async () =>
		apiClient.get<ClubTeamProfile[]>("/club-teams"),
	create: (profile: Omit<ClubTeamProfile, "id">) =>
		apiClient.post<ClubTeamProfile>("/club-teams", profile),
	update: async (profile: ClubTeamProfile) =>
		apiClient.put<ClubTeamProfile>(`/club-teams/${profile.id}`, profile),
	delete: (id: string) => apiClient.delete(`/club-teams/${id}`),
};
