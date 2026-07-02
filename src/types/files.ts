export type ClubFileLinkedEntityType =
	| "Post"
	| "Event"
	| "Player"
	| "ClubDocument"
	| "ClubLogo"
	| "PostTemplate"
	| "RichTextDraft";

export type ClubFileVisibility = "AuthenticatedUsers" | "AdminAndCoach";

export type ClubFileStatus = "PendingUpload" | "Uploaded" | "Quarantined" | "Deleted";

export type ClubFile = {
	id: string;
	originalFileName: string;
	storedFileName: string;
	storageKey: string;
	storedObjectId?: string | null;
	contentHash?: string;
	contentType: string;
	sizeBytes: number;
	visibility: ClubFileVisibility;
	linkedEntityType: ClubFileLinkedEntityType;
	linkedEntityId: string;
	status: ClubFileStatus;
	uploadedByUserId: string;
	uploadedByUserEmail: string;
	createdAt: string;
	updatedAt: string;
	uploadedAt?: string | null;
	quarantinedAt?: string | null;
	quarantineReason?: string;
	deletedAt?: string | null;
	deletedByUserId?: string | null;
};

export type CreateFileUploadUrlRequest = {
	originalFileName: string;
	contentType: string;
	sizeBytes: number;
	contentHash?: string;
	linkedEntityType: ClubFileLinkedEntityType;
	linkedEntityId: string;
	visibility: ClubFileVisibility;
};

export type FileUploadUrlResponse = {
	file: ClubFile;
	uploadUrl: string;
	expiresAtUtc: string;
	uploadRequired?: boolean;
	reusedStoredObject?: boolean;
	storageWarning?: string;
};

export type FileDownloadUrlResponse = {
	file: ClubFile;
	downloadUrl: string;
	expiresAtUtc: string;
};

export type FileStorageUsage = {
	organizationId: string;
	usedBytes: number;
	quotaBytes: number;
	remainingBytes: number;
	usedPercent: number;
	isNearLimit: boolean;
	isAtLimit: boolean;
	storedObjectCount: number;
	pendingObjectCount: number;
	orphanedObjectCount: number;
};

export type FileLifecycleAudit = {
	id: string;
	organizationId: string;
	clubId?: string | null;
	fileId?: string | null;
	storedObjectId?: string | null;
	userId?: string | null;
	eventType: string;
	detail: string;
	createdAt: string;
};
