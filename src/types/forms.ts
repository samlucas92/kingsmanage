export type ClubFormStatus = "Draft" | "Open" | "Closed";
export type ClubFormSourceType = "General" | "MatchAwards";
export type ClubFormQuestionType = "ShortText" | "LongText" | "SingleChoice" | "MultipleChoice" | "Rating" | "YesNo";

export type ClubFormQuestion = {
	id: string;
	prompt: string;
	type: ClubFormQuestionType;
	isRequired: boolean;
	options: string[];
	minRating: number;
	maxRating: number;
};

export type ClubForm = {
	id: string;
	goCode: string;
	title: string;
	description: string;
	status: ClubFormStatus;
	sourceType: ClubFormSourceType;
	sourceMatchId?: string | null;
	sourceMatchLabel: string;
	appliedMatchAwardPlayerId?: string | null;
	createdByUserEmail: string;
	allowAnonymousResponses: boolean;
	allowMultipleSubmissions: boolean;
	questions: ClubFormQuestion[];
	hasSubmitted: boolean;
	submissionCount: number;
	createdAt: string;
	updatedAt: string;
};

export type SaveClubFormRequest = {
	title: string;
	description: string;
	status: ClubFormStatus;
	sourceType?: ClubFormSourceType;
	sourceMatchId?: string | null;
	allowAnonymousResponses: boolean;
	allowMultipleSubmissions: boolean;
	questions: ClubFormQuestion[];
};

export type ClubFormAnswer = {
	questionId: string;
	textValue: string;
	selectedOptions: string[];
	ratingValue?: number | null;
	booleanValue?: boolean | null;
};

export type SubmitClubFormRequest = {
	anonymousSubmissionKey?: string;
	answers: ClubFormAnswer[];
};

export type ClubFormResults = {
	formId: string;
	title: string;
	submissionCount: number;
	questions: ClubFormQuestionResult[];
};

export type ClubFormQuestionResult = {
	questionId: string;
	prompt: string;
	type: ClubFormQuestionType;
	responseCount: number;
	options: ClubFormOptionResult[];
	averageRating?: number | null;
	textResponses: string[];
};

export type ClubFormOptionResult = {
	value: string;
	count: number;
};
