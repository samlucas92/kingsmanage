export type PlayerSponsorshipStatus = "Open" | "Completed" | "Closed";

export type PlayerSponsorship = {
	id: string;
	playerId: string;
	playerName: string;
	goCode: string;
	status: PlayerSponsorshipStatus;
	clubName: string;
	clubPrimaryColor: string;
	clubSecondaryColor: string;
	sponsorName: string;
	sponsorDescription: string;
	sponsorImageDataUrl: string;
	hasImage: boolean;
	termsAccepted: boolean;
	termsAcceptedAt?: string | null;
	submittedAt?: string | null;
	createdAt: string;
	updatedAt: string;
	termsText: string;
};

export type UpdatePlayerSponsorshipRequest = Pick<
	PlayerSponsorship,
	"sponsorName" | "sponsorDescription" | "sponsorImageDataUrl" | "status"
>;

export type SubmitPlayerSponsorshipRequest = Pick<
	PlayerSponsorship,
	"sponsorName" | "sponsorDescription" | "sponsorImageDataUrl" | "termsAccepted"
>;
