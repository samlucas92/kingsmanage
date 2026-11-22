import { apiClient } from "./apiClient";
import type { GooglePickerToken, GoogleSheetsIntegration, MetaIntegration, SocialChannelMapping } from "../types/integrations";

export const integrationsApi = {
	getMeta: () => apiClient.get<MetaIntegration>("/organization/integrations/meta"),
	startMetaConnection: () => apiClient.post<{ authorizationUrl: string }>("/organization/integrations/meta/connect/start", {}),
	completeMetaConnection: (code: string, state: string) => apiClient.post<MetaIntegration>("/organization/integrations/meta/connect/complete", { code, state }),
	updateMetaConfiguration: (request: { isEnabled: boolean; timeZoneId: string; clubMappings: SocialChannelMapping[] }) =>
		apiClient.put<MetaIntegration>("/organization/integrations/meta/configuration", request),
	setMetaEnabled: (isEnabled: boolean) => apiClient.patch<MetaIntegration>("/organization/integrations/meta/enabled", { isEnabled }),
	validateMeta: () => apiClient.post<MetaIntegration>("/organization/integrations/meta/validate", {}),
	disconnectMeta: () => apiClient.delete<void>("/organization/integrations/meta"),
	getGoogleSheets: () => apiClient.get<GoogleSheetsIntegration>("/organization/integrations/google-sheets"),
	startGoogleSheetsConnection: () => apiClient.post<{ authorizationUrl: string }>("/organization/integrations/google-sheets/connect/start", {}),
	completeGoogleSheetsConnection: (code: string, state: string) => apiClient.post<GoogleSheetsIntegration>("/organization/integrations/google-sheets/connect/complete", { code, state }),
	getGooglePickerToken: () => apiClient.get<GooglePickerToken>("/organization/integrations/google-sheets/picker-token"),
	selectGoogleSpreadsheet: (spreadsheetId: string) => apiClient.put<GoogleSheetsIntegration>("/organization/integrations/google-sheets/spreadsheet", { spreadsheetId }),
	validateGoogleSheets: () => apiClient.post<GoogleSheetsIntegration>("/organization/integrations/google-sheets/validate", {}),
	disconnectGoogleSheets: () => apiClient.delete<void>("/organization/integrations/google-sheets"),
};
