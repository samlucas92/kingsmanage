import { apiClient } from "./apiClient";
import type {
	ClubForm,
	ClubFormSubmissionReport,
	ClubFormResults,
	FormAnalyticsDateRange,
	FormAnalyticsDetail,
	FormAnalyticsOverview,
	SaveClubFormRequest,
	SubmitClubFormRequest,
} from "../types/forms";

export const formsApi = {
	getForms: () => apiClient.get<ClubForm[]>("/forms"),

	getForm: (id: string) => apiClient.get<ClubForm>(`/forms/${encodeURIComponent(id)}`),

	getPublicForm: (goCode: string, anonymousSubmissionKey: string) =>
		apiClient.get<ClubForm>(
			`/forms/go/${encodeURIComponent(goCode)}?anonymousSubmissionKey=${encodeURIComponent(anonymousSubmissionKey)}`
		),

	createForm: (request: SaveClubFormRequest) =>
		apiClient.post<ClubForm>("/forms", request),

	createMatchAwardsForm: (matchId: string) =>
		apiClient.post<ClubForm>("/forms/match-awards", { matchId }),

	getMatchAwardsForm: (matchId: string) =>
		apiClient.get<ClubForm>(`/forms/match-awards/${encodeURIComponent(matchId)}`),

	updateForm: (id: string, request: SaveClubFormRequest) =>
		apiClient.put<ClubForm>(`/forms/${encodeURIComponent(id)}`, request),

	deleteForm: (id: string) =>
		apiClient.delete<void>(`/forms/${encodeURIComponent(id)}`),

	deleteFormWithOptions: (id: string, cleanupMatchAward: boolean) =>
		apiClient.delete<void>(`/forms/${encodeURIComponent(id)}?cleanupMatchAward=${cleanupMatchAward}`),

	updateStatus: (id: string, status: ClubForm["status"]) =>
		apiClient.patch<ClubForm>(`/forms/${encodeURIComponent(id)}/status`, { status }),

	resolveAwardOption: (id: string, request: { questionId: string; selectedValue: string; playerId: string }) =>
		apiClient.patch<ClubForm>(`/forms/${encodeURIComponent(id)}/award-resolution`, request),

	submitForm: (id: string, request: SubmitClubFormRequest) =>
		apiClient.post<ClubForm>(`/forms/${encodeURIComponent(id)}/submissions`, request),

	submitPublicForm: (goCode: string, request: SubmitClubFormRequest) =>
		apiClient.post<ClubForm>(
			`/forms/go/${encodeURIComponent(goCode)}/submissions`,
			request
		),

	getResults: (id: string) =>
		apiClient.get<ClubFormResults>(`/forms/${encodeURIComponent(id)}/results`),

	getSubmissionReport: (id: string) =>
		apiClient.get<ClubFormSubmissionReport>(`/forms/${encodeURIComponent(id)}/submission-report`),

	getAnalyticsOverview: (range: FormAnalyticsDateRange) =>
		apiClient.get<FormAnalyticsOverview>(`/forms/analytics${toQueryString(range)}`),

	getFormAnalytics: async (id: string, range: FormAnalyticsDateRange) => {
		const response = await apiClient.get<{ analytics: FormAnalyticsDetail }>(
			`/forms/${encodeURIComponent(id)}/analytics${toQueryString(range)}`
		);
		return response.analytics;
	},

	trackAnalytics: (
		formId: string,
		goCode: string | undefined,
		eventName: "view" | "interaction" | "field-interaction" | "validation-error" | "duration",
		body: { sessionId: string; fieldId?: string; engagedDurationMs?: number; errorType?: string },
		keepalive = false
	) => {
		const path = goCode
			? `/forms/go/${encodeURIComponent(goCode)}/analytics/${eventName}`
			: `/forms/${encodeURIComponent(formId)}/analytics/${eventName}`;
		return keepalive
			? apiClient.postKeepalive<void>(path, body)
			: apiClient.post<void>(path, body);
	},
};

function toQueryString(range: FormAnalyticsDateRange) {
	const params = new URLSearchParams();
	if (range.from) params.set("from", range.from);
	if (range.to) params.set("to", range.to);
	const query = params.toString();
	return query ? `?${query}` : "";
}
