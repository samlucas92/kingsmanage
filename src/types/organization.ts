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
