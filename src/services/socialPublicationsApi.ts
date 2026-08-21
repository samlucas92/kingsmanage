import { apiClient } from "./apiClient";
import type { SocialDestination, SocialPublication } from "../types/integrations";

export type CreateSocialPublicationRequest = {
	publishToFacebook: boolean;
	publishToInstagram: boolean;
	facebookCaption: string;
	instagramCaption: string;
	scheduledForUtc?: string | null;
};

export const socialPublicationsApi = {
	getDestinations: () => apiClient.get<SocialDestination[]>("/social-publications/destinations"),
	getHistory: (limit = 20) => apiClient.get<SocialPublication[]>(`/social-publications?limit=${limit}`),
	create: (request: CreateSocialPublicationRequest) => apiClient.post<SocialPublication>("/social-publications", request),
	attachMedia: (id: string, fileId: string) => apiClient.post<SocialPublication>(`/social-publications/${id}/media`, { fileId }),
	cancel: (id: string) => apiClient.post<SocialPublication>(`/social-publications/${id}/cancel`, {}),
	retry: (id: string) => apiClient.post<SocialPublication>(`/social-publications/${id}/retry`, {}),
};
