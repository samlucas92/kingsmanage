import { apiClient } from "./apiClient";
import type {
	SocialInsightsOverview,
	SocialPlatform,
	SocialPostInsightsDetail,
} from "../types/integrations";

export const socialInsightsApi = {
	getOverview: (refresh = false) => apiClient.get<SocialInsightsOverview>(
		`/social-insights${refresh ? "?refresh=true" : ""}`
	),
	getPost: (platform: SocialPlatform, postId: string) => apiClient.get<SocialPostInsightsDetail>(
		`/social-insights/posts/${encodeURIComponent(platform)}/${encodeURIComponent(postId)}`
	),
};
