export type TrainingPlayerRole = "Outfield" | "Goalkeeper";

export type TrainingMetricCategoryDefinition = {
	key: string;
	label: string;
};

export type TrainingMetricDefinition = {
	key: string;
	label: string;
	categories: TrainingMetricCategoryDefinition[];
};

export type TrainingMetricCategoryRating = {
	key: string;
	label: string;
	rating: number;
};

export type TrainingMetricRating = {
	key: string;
	label: string;
	rating: number;
	categories: TrainingMetricCategoryRating[];
};

export type TrainingAssessment = {
	id: string;
	eventId: string;
	playerId: string;
	playerRole: TrainingPlayerRole;
	metrics: TrainingMetricRating[];
	notes: string;
	assessedAt: string;
	updatedAt: string;
};

export type SaveTrainingAssessmentRequest = {
	playerRole: TrainingPlayerRole;
	metrics: Array<{
		key: string;
		rating: number;
		categories: Array<{
			key: string;
			rating: number;
		}>;
	}>;
	notes: string;
};

export type TrainingMetricCategoryAverage = {
	key: string;
	label: string;
	rating: number;
};

export type TrainingMetricAverage = {
	key: string;
	label: string;
	rating: number;
	categories: TrainingMetricCategoryAverage[];
};

export type PlayerTrainingDevelopment = {
	playerId: string;
	playerRole: TrainingPlayerRole;
	assessmentCount: number;
	latestAssessment: TrainingAssessment | null;
	averages: TrainingMetricAverage[];
	recentAssessments: TrainingAssessment[];
};
