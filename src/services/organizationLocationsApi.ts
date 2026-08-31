import { apiClient } from "./apiClient";
import type {
	OrganizationLocation,
	OrganizationLocationInput,
} from "../types/locations";

export const organizationLocationsApi = {
	getAll: () => apiClient.get<OrganizationLocation[]>("/organization-locations"),
	create: (location: OrganizationLocationInput) =>
		apiClient.post<OrganizationLocation>("/organization-locations", location),
	update: (id: string, location: OrganizationLocationInput) =>
		apiClient.put<OrganizationLocation>(`/organization-locations/${id}`, location),
	delete: (id: string) => apiClient.delete<void>(`/organization-locations/${id}`),
};
