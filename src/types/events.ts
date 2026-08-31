export type ClubEventType = "Match" | "Training" | "Social" | "Meeting";
export type ClubEventTeamScope = "First" | "Second" | "Both";
export type ClubEventAvailabilityStatus = "Unanswered" | "Available" | "Declined";
export type EventClubTeam = "First" | "Second";
export type EventMatchVenue = "Home" | "Away";
export type EventLineupFormation = "FourFourTwo" | "FourThreeThree" | "ThreeFiveTwo" | "FourTwoThreeOne";
export type RecurrenceIntervalUnit = "Days" | "Weeks";

export type ClubEventRecurrence = {
	seriesId: string;
	occurrenceNumber: number;
	totalOccurrences: number;
	interval: number;
	unit: RecurrenceIntervalUnit;
	seriesStartDateTime: string;
	seriesEndDate: string;
};

export type ClubEventMatchLink = {
	team: EventClubTeam;
	matchId?: string | null;
};

export type ClubEventAvailabilityResponse = {
	playerId: string;
	status: ClubEventAvailabilityStatus;
	updatedAt: string;
};

export type ClubEventSeenStatus = {
	playerId: string;
	seenAt: string;
};

export type TrainingPlanDrill = {
	id: string;
	title: string;
	durationMinutes: number;
	content: string;
};

export type ClubEvent = {
	id: string;
	type: ClubEventType;
	teamScope: ClubEventTeamScope;
	teamIds?: string[];
	title: string;
	description: string;
	startDateTime: string;
	endDateTime?: string | null;
	location: string;
	recurrenceSeriesId?: string | null;
	recurrence?: ClubEventRecurrence | null;
	trainingPlanDrills?: TrainingPlanDrill[];
	matchLinks: ClubEventMatchLink[];
	availabilityResponses: ClubEventAvailabilityResponse[];
	seenBy: ClubEventSeenStatus[];
	createdAt: string;
	updatedAt: string;
};

export type CreateMatchForEventRequest = {
	seasonId?: string | null;
	team: EventClubTeam;
	opponent: string;
	competition: string;
	date?: string | null;
	venue: EventMatchVenue;
	location: string;
	selectedFormation: EventLineupFormation;
};

export type CreateClubEventRequest = {
	type: ClubEventType;
	teamScope: ClubEventTeamScope;
	title: string;
	description: string;
	startDateTime: string;
	endDateTime?: string | null;
	location: string;
	matchLinks: ClubEventMatchLink[];
	createLinkedMatches: boolean;
	createMatches: CreateMatchForEventRequest[];
	recurrence?: CreateEventRecurrenceRequest | null;
	trainingPlanDrills?: TrainingPlanDrill[];
};

export type CreateEventRecurrenceRequest = {
	isRecurring: boolean;
	interval: number;
	unit: RecurrenceIntervalUnit;
	endDate: string;
};

export type UpdateClubEventRequest = {
	type: ClubEventType;
	teamScope: ClubEventTeamScope;
	teamIds?: string[];
	title: string;
	description: string;
	startDateTime: string;
	endDateTime?: string | null;
	location: string;
	matchLinks: ClubEventMatchLink[];
	trainingPlanDrills?: TrainingPlanDrill[];
};

export type UpdateClubEventAvailabilityRequest = {
	status: ClubEventAvailabilityStatus;
};
