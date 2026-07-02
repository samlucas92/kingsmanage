import { apiClient } from "./apiClient";
import type { Organization, SportsClub } from "../types/organization";

export const organizationApi = {
	get: () => apiClient.get<Organization>("/organization"),
	update: (organization: Organization) => apiClient.put<Organization>("/organization", organization),
	getClubs: () => apiClient.get<SportsClub[]>("/organization/clubs"),
	createClub: (club: Pick<SportsClub, "name" | "slug" | "sportKey"> & Partial<Pick<SportsClub, "customFormations">>) =>
		apiClient.post<SportsClub>("/organization/clubs", club),
	updateClub: (club: SportsClub) =>
		apiClient.put<SportsClub>(`/organization/clubs/${club.id}`, club),
	setClubActive: (id: string, isActive: boolean) =>
		apiClient.patch<SportsClub>(`/organization/clubs/${id}/active`, { isActive }),
};
