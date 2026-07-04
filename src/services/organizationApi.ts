import { apiClient } from "./apiClient";
import type {
	Organization,
	OrganizationDashboard,
	SportsClub,
} from "../types/organization";

export const organizationApi = {
	get: () => apiClient.get<Organization>("/organization"),
	update: (organization: Organization) => apiClient.put<Organization>("/organization", organization),
	getClubs: () => apiClient.get<SportsClub[]>("/organization/clubs"),
	createClub: (club: Pick<SportsClub, "name" | "slug" | "sportKey"> & Partial<SportsClub>) =>
		apiClient.post<SportsClub>("/organization/clubs", club),
	updateClub: (club: SportsClub) =>
		apiClient.put<SportsClub>(`/organization/clubs/${club.id}`, club),
	setClubActive: (id: string, isActive: boolean) =>
		apiClient.patch<SportsClub>(`/organization/clubs/${id}/active`, { isActive }),
	deleteClub: (id: string) =>
		apiClient.delete(`/organization/clubs/${id}`),
	getDashboard: (clubId?: string) =>
		apiClient.get<OrganizationDashboard>(
			`/organization/dashboard${clubId ? `?clubId=${encodeURIComponent(clubId)}` : ""}`
		),
	getPlatformOrganizations: () =>
		apiClient.get<Organization[]>("/platform/organizations"),
	createPlatformOrganization: (
		organization: Pick<Organization, "name" | "slug">
	) => apiClient.post<Organization>("/platform/organizations", organization),
	updatePlatformOrganization: (organization: Organization) =>
		apiClient.put<Organization>(
			`/platform/organizations/${organization.id}`,
			organization
		),
	setPlatformOrganizationActive: (id: string, isActive: boolean) =>
		apiClient.patch<Organization>(
			`/platform/organizations/${id}/active`,
			{ isActive }
		),
	deletePlatformOrganization: (id: string) =>
		apiClient.delete(`/platform/organizations/${id}`),
};
