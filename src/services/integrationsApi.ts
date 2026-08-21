import { apiClient } from "./apiClient";
import type { MetaIntegration, SocialChannelMapping } from "../types/integrations";

export const integrationsApi = {
	getMeta: () => apiClient.get<MetaIntegration>("/organization/integrations/meta"),
	startMetaConnection: () => apiClient.post<{ authorizationUrl: string }>("/organization/integrations/meta/connect/start", {}),
	completeMetaConnection: (code: string, state: string) => apiClient.post<MetaIntegration>("/organization/integrations/meta/connect/complete", { code, state }),
	updateMetaConfiguration: (request: { isEnabled: boolean; timeZoneId: string; clubMappings: SocialChannelMapping[] }) =>
		apiClient.put<MetaIntegration>("/organization/integrations/meta/configuration", request),
	setMetaEnabled: (isEnabled: boolean) => apiClient.patch<MetaIntegration>("/organization/integrations/meta/enabled", { isEnabled }),
	validateMeta: () => apiClient.post<MetaIntegration>("/organization/integrations/meta/validate", {}),
	disconnectMeta: () => apiClient.delete<void>("/organization/integrations/meta"),
};
