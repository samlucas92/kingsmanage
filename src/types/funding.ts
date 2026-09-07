export type FundingOpportunityStatus = "Open" | "Upcoming" | "Rolling" | "Restricted" | "Closed";

export type FundingApplicationState =
	| "Investigating"
	| "Preparing"
	| "Submitted"
	| "Completed"
	| "Failed"
	| "NotPursuing";

export type FundingOpportunity = {
	id: string;
	name: string;
	description: string;
	amount: string;
	applicationUrl: string;
	startDate?: string | null;
	endDate?: string | null;
	status: FundingOpportunityStatus;
	statusDetail: string;
	applicationState: FundingApplicationState;
	notes: string;
	createdAt: string;
	updatedAt: string;
};

export type SaveFundingOpportunityRequest = Omit<FundingOpportunity, "id" | "createdAt" | "updatedAt">;

export type BulkFundingImportResult = {
	opportunityCount: number;
};
