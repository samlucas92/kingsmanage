import { apiClient } from "./apiClient";
import type {
	ClubFile,
	ClubFileLinkedEntityType,
	CreateFileUploadUrlRequest,
	FileDownloadUrlResponse,
	FileUploadUrlResponse,
} from "../types/files";

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

	getDownloadUrl: (id: string) =>
		apiClient.get<FileDownloadUrlResponse>(`/files/${id}/download-url`),

	deleteFile: (id: string) => apiClient.delete<void>(`/files/${id}`),
};
