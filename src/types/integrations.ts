export type OrganizationIntegrationStatus = "NotConfigured" | "Connected" | "NeedsAttention";
export type SocialPlatform = "Facebook" | "Instagram";
export type SocialPublicationStatus = "Draft" | "Scheduled" | "Processing" | "Published" | "PartiallyPublished" | "Failed" | "Cancelled";
export type SocialDeliveryStatus = "Pending" | "Processing" | "Published" | "Failed" | "Cancelled";

export type MetaInstagramAccount = {
	id: string;
	username: string;
	name: string;
	profilePictureUrl?: string | null;
};

export type MetaPage = {
	id: string;
	name: string;
	tasks: string[];
	instagramAccount?: MetaInstagramAccount | null;
};

export type SocialChannelMapping = {
	clubId: string;
	facebookEnabled: boolean;
	facebookPageId?: string | null;
	instagramEnabled: boolean;
	instagramAccountId?: string | null;
};

export type MetaIntegration = {
	isConfigured: boolean;
	isEnabled: boolean;
	status: OrganizationIntegrationStatus;
	connectedMetaUserName?: string | null;
	tokenExpiresAt?: string | null;
	lastValidatedAt?: string | null;
	lastError?: string | null;
	timeZoneId: string;
	pages: MetaPage[];
	clubMappings: SocialChannelMapping[];
};

export type SocialDestination = {
	platform: SocialPlatform;
	id: string;
	name: string;
	username?: string | null;
};

export type SocialPublicationDelivery = {
	platform: SocialPlatform;
	destinationId: string;
	destinationName: string;
	status: SocialDeliveryStatus;
	providerPostId?: string | null;
	attemptCount: number;
	lastAttemptAt?: string | null;
	nextAttemptAt?: string | null;
	lastError?: string | null;
};

export type SocialPublication = {
	id: string;
	fileId?: string | null;
	facebookCaption: string;
	instagramCaption: string;
	scheduledForUtc?: string | null;
	status: SocialPublicationStatus;
	deliveries: SocialPublicationDelivery[];
	createdAt: string;
	updatedAt: string;
	publishedAt?: string | null;
};
