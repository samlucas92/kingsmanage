import type { SportFormation } from "../constants/sports";

export type Organization = {
	id: string;
	name: string;
	slug: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};

export type SportsClub = {
	id: string;
	organizationId: string;
	name: string;
	slug: string;
	sportKey: string;
	customFormations: SportFormation[];
	logoFileId?: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};

export type OrganizationFinanceSummary = {
	charged: number;
	paid: number;
	adjustments: number;
	outstanding: number;
};

export type OrganizationClubSummary = {
	clubId: string;
	clubName: string;
	isActive: boolean;
	teamCount: number;
	userCount: number;
	playerCount: number;
	outstandingFinance: number;
	attention: string[];
};

export type OrganizationUpcomingItem = {
	id: string;
	clubId: string;
	clubName: string;
	title: string;
	startsAt: string;
	location: string;
};

export type OrganizationDashboard = {
	clubCount: number;
	teamCount: number;
	userCount: number;
	playerCount: number;
	finance: OrganizationFinanceSummary;
	clubs: OrganizationClubSummary[];
	upcomingFixtures: OrganizationUpcomingItem[];
	upcomingEvents: OrganizationUpcomingItem[];
};
