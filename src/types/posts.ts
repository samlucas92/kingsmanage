export type ClubPostType = "General" | "Announcement" | "MatchInfo" | "Social" | "OrganizationDocument";

export type ClubPost = {
	id: string;
	type: ClubPostType;
	title: string;
	body: string;
	isPinned: boolean;
	createdByUserId: string;
	createdByUserEmail: string;
	createdAt: string;
	updatedAt: string;
};

export type CreateClubPostRequest = {
	type: ClubPostType;
	title: string;
	body: string;
	isPinned: boolean;
};

export type UpdateClubPostRequest = CreateClubPostRequest;

export type ClubPostTemplate = {
	id: string;
	name: string;
	titleTemplate: string;
	bodyTemplate: string;
	isPinned: boolean;
	createdAt: string;
	updatedAt: string;
};

export type SaveClubPostTemplateRequest = Omit<
	ClubPostTemplate,
	"id" | "createdAt" | "updatedAt"
>;
