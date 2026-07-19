import { apiClient } from "./apiClient";
import type {
	PlayerTrainingDevelopment,
	SaveTrainingAssessmentRequest,
	TrainingAssessment,
	TrainingMetricDefinition,
	TrainingPlayerRole,
} from "../types/training";

export const trainingApi = {
	getMetricDefinitions: (playerRole: TrainingPlayerRole) =>
		apiClient.get<TrainingMetricDefinition[]>(
			`/training/metrics?${new URLSearchParams({ playerRole }).toString()}`
		),

	getEventAssessments: (eventId: string) =>
		apiClient.get<TrainingAssessment[]>(`/training/events/${eventId}/assessments`),

	saveAssessment: (
		eventId: string,
		playerId: string,
		request: SaveTrainingAssessmentRequest
	) =>
		apiClient.put<TrainingAssessment>(
			`/training/events/${eventId}/assessments/${playerId}`,
			request
		),

	getPlayerDevelopment: ({
		playerId,
		from,
		to,
	}: {
		playerId: string;
		from?: string;
		to?: string;
	}) => {
		const params = new URLSearchParams();

		if (from) params.set("from", from);
		if (to) params.set("to", to);

		const query = params.toString();

		return apiClient.get<PlayerTrainingDevelopment>(
			`/training/players/${playerId}/development${query ? `?${query}` : ""}`
		);
	},
};
