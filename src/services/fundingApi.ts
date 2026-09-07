import { apiClient } from "./apiClient";
import type {
	BulkFundingImportResult,
	FundingOpportunity,
	SaveFundingOpportunityRequest,
} from "../types/funding";

export const fundingApi = {
	getAll: () => apiClient.get<FundingOpportunity[]>("/funding"),
	create: (opportunity: SaveFundingOpportunityRequest) =>
		apiClient.post<FundingOpportunity>("/funding", opportunity),
	update: (id: string, opportunity: SaveFundingOpportunityRequest) =>
		apiClient.put<FundingOpportunity>(`/funding/${encodeURIComponent(id)}`, opportunity),
	delete: (id: string) => apiClient.delete<void>(`/funding/${encodeURIComponent(id)}`),
	bulkImport: (opportunities: SaveFundingOpportunityRequest[]) =>
		apiClient.post<BulkFundingImportResult>("/funding/bulk", { opportunities }),
};
