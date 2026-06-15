export type ClubPostType = "General" | "Announcement" | "MatchInfo" | "Social";

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
