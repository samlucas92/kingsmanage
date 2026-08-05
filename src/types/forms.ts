export type ClubFormStatus = "Draft" | "Open" | "Closed";
export type ClubFormType = "General" | "PlayerOfTheMatch" | "Custom";
export type ClubFormSourceType = "General" | "MatchAwards";
export type ClubFormQuestionType = "ShortText" | "LongText" | "SingleChoice" | "MultipleChoice" | "Rating" | "YesNo";
export type ClubFormQuestionOptionSource = "Manual" | "MatchPlayers" | "AllPlayers";

export type ClubFormQuestion = {
	id: string;
	prompt: string;
	type: ClubFormQuestionType;
	isRequired: boolean;
	optionSource?: ClubFormQuestionOptionSource;
	options: string[];
	choiceOptions?: ClubFormQuestionOption[];
	minRating: number;
	maxRating: number;
};

export type ClubFormQuestionOption = {
	value: string;
	label: string;
	playerId?: string | null;
	requiresTextInput?: boolean;
	textInputLabel?: string;
};

export type ClubForm = {
	id: string;
	goCode: string;
	title: string;
	description: string;
	status: ClubFormStatus;
	formType: ClubFormType;
	sourceType: ClubFormSourceType;
	sourceMatchId?: string | null;
	sourceMatchLabel: string;
	appliedMatchAwardPlayerId?: string | null;
	appliedMatchAwardPlayerIds?: string[];
	awardResolutions?: ClubFormAwardResolution[];
	createdByUserEmail: string;
	allowAnonymousResponses: boolean;
	allowMultipleSubmissions: boolean;
	questions: ClubFormQuestion[];
	hasSubmitted: boolean;
	submissionCount: number;
	createdAt: string;
	updatedAt: string;
};

export type ClubFormAwardResolution = {
	questionId: string;
	questionPrompt: string;
	selectedValue: string;
	playerId: string;
	resolvedAt: string;
};

export type SaveClubFormRequest = {
	title: string;
	description: string;
	status: ClubFormStatus;
	formType?: ClubFormType;
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

export type ClubFormSubmissionReport = {
	formId: string;
	title: string;
	submissionCount: number;
	submissions: ClubFormSubmission[];
};

export type ClubFormSubmission = {
	id: string;
	label: string;
	submittedAt: string;
	answers: ClubFormSubmissionAnswer[];
};

export type ClubFormSubmissionAnswer = {
	questionId: string;
	prompt: string;
	type: ClubFormQuestionType;
	displayValue: string;
	values: string[];
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
	label?: string;
	playerId?: string | null;
	requiresTextInput?: boolean;
	count: number;
};
