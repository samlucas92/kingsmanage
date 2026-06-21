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
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};
