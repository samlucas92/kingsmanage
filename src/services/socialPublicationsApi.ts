import { apiClient } from "./apiClient";
import type { SocialDestination, SocialPublication, SocialPublicationMode } from "../types/integrations";

export type CreateSocialPublicationRequest = {
	title: string;
	graphicKind?: string | null;
	templateId?: string | null;
	editorStateJson?: string | null;
	publishToFacebook: boolean;
	publishToInstagram: boolean;
	facebookCaption: string;
	instagramCaption: string;
	scheduledForUtc?: string | null;
};

export const socialPublicationsApi = {
	getDestinations: () => apiClient.get<SocialDestination[]>("/social-publications/destinations"),
	getHistory: (limit = 20) => apiClient.get<SocialPublication[]>(`/social-publications?limit=${limit}`),
	get: (id: string) => apiClient.get<SocialPublication>(`/social-publications/${id}`),
	create: (request: CreateSocialPublicationRequest) => apiClient.post<SocialPublication>("/social-publications", request),
	attachMedia: (id: string, fileId: string) => apiClient.post<SocialPublication>(`/social-publications/${id}/media`, { fileId }),
	queue: (id: string, mode: Exclude<SocialPublicationMode, "YepsetDraft">) => apiClient.post<SocialPublication>(`/social-publications/${id}/queue`, { mode }),
	cancel: (id: string) => apiClient.post<SocialPublication>(`/social-publications/${id}/cancel`, {}),
	retry: (id: string) => apiClient.post<SocialPublication>(`/social-publications/${id}/retry`, {}),
};
