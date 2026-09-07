export type OppositionTeam = {
	id: string;
	name: string;
	location: string;
	badgeFileId?: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};

export type SaveOppositionTeamRequest = Pick<OppositionTeam, "name" | "location" | "isActive">;
