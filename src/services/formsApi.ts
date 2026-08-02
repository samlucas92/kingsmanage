import { apiClient } from "./apiClient";
import type {
	ClubForm,
	ClubFormResults,
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

	updateForm: (id: string, request: SaveClubFormRequest) =>
		apiClient.put<ClubForm>(`/forms/${encodeURIComponent(id)}`, request),

	deleteForm: (id: string) =>
		apiClient.delete<void>(`/forms/${encodeURIComponent(id)}`),

	submitForm: (id: string, request: SubmitClubFormRequest) =>
		apiClient.post<ClubForm>(`/forms/${encodeURIComponent(id)}/submissions`, request),

	submitPublicForm: (goCode: string, request: SubmitClubFormRequest) =>
		apiClient.post<ClubForm>(
			`/forms/go/${encodeURIComponent(goCode)}/submissions`,
			request
		),

	getResults: (id: string) =>
		apiClient.get<ClubFormResults>(`/forms/${encodeURIComponent(id)}/results`),
};
