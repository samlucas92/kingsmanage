export type OrganizationIntegrationStatus = "NotConfigured" | "Connected" | "NeedsAttention";
export type SocialPlatform = "Facebook" | "Instagram";
export type SocialPublicationStatus = "Draft" | "Scheduled" | "Processing" | "MetaDraft" | "Published" | "PartiallyPublished" | "Failed" | "Cancelled";
export type SocialDeliveryStatus = "Pending" | "Processing" | "Saved" | "Drafted" | "Published" | "Failed" | "Cancelled";
export type SocialPublicationMode = "YepsetDraft" | "PublishNow" | "FacebookDraft";

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
	title: string;
	graphicKind?: string | null;
	templateId?: string | null;
	editorStateJson?: string | null;
	facebookCaption: string;
	instagramCaption: string;
	scheduledForUtc?: string | null;
	mode: SocialPublicationMode;
	status: SocialPublicationStatus;
	deliveries: SocialPublicationDelivery[];
	createdAt: string;
	updatedAt: string;
	publishedAt?: string | null;
};

export type SocialAccountInsights = {
	platform: SocialPlatform;
	name: string;
	username?: string | null;
	followerCount?: number | null;
	postCount?: number | null;
};

export type SocialPostInsightsSummary = {
	platform: SocialPlatform;
	id: string;
	caption: string;
	mediaType?: string | null;
	createdAt: string;
	permalink?: string | null;
	thumbnailUrl?: string | null;
	likeCount?: number | null;
	commentCount?: number | null;
	shareCount?: number | null;
};

export type SocialPostInsightsDetail = SocialPostInsightsSummary & {
	metrics: Record<string, number>;
};

export type SocialInsightsOverview = {
	generatedAt: string;
	accounts: SocialAccountInsights[];
	posts: SocialPostInsightsSummary[];
};
