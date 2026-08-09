import { apiClient } from "./apiClient";
import type {
	SaveSocialGraphicTemplateRequest,
	SocialGraphicTemplateCustomization,
	SocialGraphicTemplateResponse,
	SocialGraphicTemplateRevision,
} from "../types/socialGraphicTemplates";

export const socialGraphicTemplatesApi = {
	get: (templateId: string) =>
		apiClient.get<SocialGraphicTemplateResponse>(
			`/social-graphic-templates/${encodeURIComponent(templateId)}`
		),

	save: (templateId: string, request: SaveSocialGraphicTemplateRequest) =>
		apiClient.put<SocialGraphicTemplateCustomization>(
			`/social-graphic-templates/${encodeURIComponent(templateId)}`,
			request
		),

	getRevisions: (templateId: string, limit = 20) =>
		apiClient.get<SocialGraphicTemplateRevision[]>(
			`/social-graphic-templates/${encodeURIComponent(templateId)}/revisions?${new URLSearchParams({
				limit: String(limit),
			}).toString()}`
		),

	restoreRevision: (templateId: string, revision: number, expectedRevision: number) =>
		apiClient.post<SocialGraphicTemplateCustomization>(
			`/social-graphic-templates/${encodeURIComponent(templateId)}/revisions/${revision}/restore`,
			{ expectedRevision }
		),

	reset: (templateId: string, expectedRevision: number) =>
		apiClient.delete<void>(
			`/social-graphic-templates/${encodeURIComponent(templateId)}?${new URLSearchParams({
				expectedRevision: String(expectedRevision),
			}).toString()}`
		),
};
