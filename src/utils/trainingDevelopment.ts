import type { Player } from "../stores/players";
import type {
	SaveTrainingAssessmentRequest,
	TrainingAssessment,
	TrainingMetricDefinition,
	TrainingMetricRating,
	TrainingPlayerRole,
} from "../types/training";

export function getTrainingPlayerRole(player?: Pick<Player, "positions"> | null): TrainingPlayerRole {
	return player?.positions.some((position) => position.toUpperCase() === "GK")
		? "Goalkeeper"
		: "Outfield";
}

export function createDefaultTrainingAssessment(
	definitions: TrainingMetricDefinition[],
	playerRole: TrainingPlayerRole
): Pick<TrainingAssessment, "playerRole" | "metrics" | "notes"> {
	return {
		playerRole,
		notes: "",
		metrics: definitions.map((definition) => ({
			key: definition.key,
			label: definition.label,
			rating: 3,
			categories: definition.categories.map((category) => ({
				key: category.key,
				label: category.label,
				rating: 3,
			})),
		})),
	};
}

export function toSaveTrainingAssessmentRequest(
	assessment: Pick<TrainingAssessment, "playerRole" | "metrics" | "notes">
): SaveTrainingAssessmentRequest {
	return {
		playerRole: assessment.playerRole,
		notes: assessment.notes,
		metrics: assessment.metrics.map((metric) => ({
			key: metric.key,
			rating: metric.rating,
			categories: metric.categories.map((category) => ({
				key: category.key,
				rating: category.rating,
			})),
		})),
	};
}

export function updateMetricRating(
	metrics: TrainingMetricRating[],
	metricKey: string,
	rating: number
) {
	return metrics.map((metric) =>
		metric.key === metricKey
			? {
					...metric,
					rating,
				}
			: metric
	);
}

export function updateCategoryRating(
	metrics: TrainingMetricRating[],
	metricKey: string,
	categoryKey: string,
	rating: number
) {
	return metrics.map((metric) => {
		if (metric.key !== metricKey) {
			return metric;
		}

		const categories = metric.categories.map((category) =>
			category.key === categoryKey ? { ...category, rating } : category
		);
		const average = Math.round(
			categories.reduce((total, category) => total + category.rating, 0) /
				Math.max(categories.length, 1)
		);

		return {
			...metric,
			rating: average,
			categories,
		};
	});
}
