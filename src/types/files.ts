export type ClubFileLinkedEntityType = "Post" | "Event" | "Player" | "ClubDocument";

export type ClubFileVisibility = "AuthenticatedUsers" | "AdminAndCoach";

export type ClubFileStatus = "PendingUpload" | "Uploaded" | "Deleted";

export type ClubFile = {
	id: string;
	originalFileName: string;
	storedFileName: string;
	storageKey: string;
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
	deletedAt?: string | null;
	deletedByUserId?: string | null;
};

export type CreateFileUploadUrlRequest = {
	originalFileName: string;
	contentType: string;
	sizeBytes: number;
	linkedEntityType: ClubFileLinkedEntityType;
	linkedEntityId: string;
	visibility: ClubFileVisibility;
};

export type FileUploadUrlResponse = {
	file: ClubFile;
	uploadUrl: string;
	expiresAtUtc: string;
};

export type FileDownloadUrlResponse = {
	file: ClubFile;
	downloadUrl: string;
	expiresAtUtc: string;
};
