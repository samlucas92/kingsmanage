import { apiClient } from "./apiClient";
import type { GoogleSheetValues } from "../types/integrations";

export const googleSheetsApi = {
	getWorkbook: (sheet?: string) => apiClient.get<GoogleSheetValues>(
		`/google-sheets/workbook${sheet ? `?sheet=${encodeURIComponent(sheet)}` : ""}`
	),
};
