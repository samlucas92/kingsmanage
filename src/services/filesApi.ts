import { apiClient } from "./apiClient";
import type {
	ClubFile,
	ClubFileLinkedEntityType,
	CreateFileUploadUrlRequest,
	FileDownloadUrlResponse,
	FileLifecycleAudit,
	FileStorageUsage,
	FileUploadUrlResponse,
} from "../types/files";
import type { SportsClub } from "../types/organization";

export const filesApi = {
	getFilesForLinkedEntity: (
		linkedEntityType: ClubFileLinkedEntityType,
		linkedEntityId: string
	) => apiClient.get<ClubFile[]>(
		`/files?linkedEntityType=${encodeURIComponent(linkedEntityType)}&linkedEntityId=${encodeURIComponent(linkedEntityId)}`
	),

	createUploadUrl: (request: CreateFileUploadUrlRequest) =>
		apiClient.post<FileUploadUrlResponse>("/files/upload-url", request),

	markUploaded: (id: string) =>
		apiClient.post<ClubFile>(`/files/${id}/mark-uploaded`, {}),

	uploadContent: (id: string, file: Blob, contentType: string) =>
		apiClient.putRaw<ClubFile>(`/files/${id}/content`, file, contentType),

	getDownloadUrl: (id: string) =>
		apiClient.get<FileDownloadUrlResponse>(`/files/${id}/download-url`),

	getStorageUsage: () =>
		apiClient.get<FileStorageUsage>("/files/storage-usage"),

	getAudit: (limit = 100) =>
		apiClient.get<FileLifecycleAudit[]>(`/files/audit?limit=${limit}`),

	assignClubLogo: (fileId: string) =>
		apiClient.post<SportsClub>(`/files/${fileId}/assign-club-logo`, {}),

	removeClubLogo: (clubId: string) =>
		apiClient.delete<SportsClub>(`/files/club-logo/${clubId}`),

	deleteFile: (id: string) => apiClient.delete<void>(`/files/${id}`),
};
