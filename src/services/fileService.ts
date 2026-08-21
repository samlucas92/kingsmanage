import { filesApi } from "./filesApi";
import type {
	ClubFile,
	ClubFileLinkedEntityType,
	ClubFileVisibility,
} from "../types/files";

const maxUploadSizeBytes = 10 * 1024 * 1024;

const allowedContentTypes = new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
	"application/pdf",
]);

const extensionContentTypes: Record<string, string> = {
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	webp: "image/webp",
	pdf: "application/pdf",
};

export type UploadLinkedFileRequest = {
	file: File;
	linkedEntityType: ClubFileLinkedEntityType;
	linkedEntityId: string;
	visibility?: ClubFileVisibility;
};

export function getUploadFileValidationError(file: File) {
	const contentType = getFileContentType(file);

	if (!file.name.trim()) {
		return "Choose a valid file.";
	}

	if (!allowedContentTypes.has(contentType)) {
		return "Only JPG, PNG, WebP and PDF files are allowed.";
	}

	if (file.size <= 0) {
		return "The selected file is empty.";
	}

	if (file.size > maxUploadSizeBytes) {
		return "Files must be 10MB or less.";
	}

	return "";
}

export function getFileContentType(file: File) {
	if (file.type) {
		return file.type;
	}

	const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

	return extensionContentTypes[extension] ?? "application/octet-stream";
}

export function formatFileSize(sizeBytes: number) {
	if (sizeBytes < 1024) {
		return `${sizeBytes} B`;
	}

	if (sizeBytes < 1024 * 1024) {
		return `${(sizeBytes / 1024).toFixed(1)} KB`;
	}

	return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function getManagedImageValidationError(
	file: File,
	purpose: "club-logo" | "editor"
) {
	const basicError = getUploadFileValidationError(file);
	if (basicError) return basicError;
	if (!file.type.startsWith("image/")) return "Choose a JPG, PNG or WebP image.";

	const maximumBytes = purpose === "club-logo" ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
	if (file.size > maximumBytes) {
		return purpose === "club-logo"
			? "Club logos must be 2MB or less."
			: "Embedded images must be 5MB or less.";
	}

	let width: number;
	let height: number;
	try {
		const bitmap = await createImageBitmap(file);
		width = bitmap.width;
		height = bitmap.height;
		bitmap.close();
	} catch {
		return "The selected image could not be read.";
	}
	if (purpose === "club-logo" && (width < 128 || height < 128 || width > 1024 || height > 1024)) {
		return "Club logos must be between 128×128 and 1024×1024 pixels.";
	}
	if (purpose === "editor" && (width > 2400 || height > 2400)) {
		return "Embedded images must be no larger than 2400×2400 pixels.";
	}
	return "";
}

export async function uploadLinkedFile({
	file,
	linkedEntityId,
	linkedEntityType,
	visibility = "AuthenticatedUsers",
}: UploadLinkedFileRequest) {
	const validationError = getUploadFileValidationError(file);

	if (validationError) {
		throw new Error(validationError);
	}

	const contentType = getFileContentType(file);
	const contentHash = await calculateFileHash(file);
	const uploadResponse = await filesApi.createUploadUrl({
		originalFileName: file.name,
		contentType,
		sizeBytes: file.size,
		contentHash,
		linkedEntityType,
		linkedEntityId,
		visibility,
	});

	if (uploadResponse.uploadRequired === false) {
		return uploadResponse.file;
	}

	if (!uploadResponse.uploadUrl) {
		throw new Error("The file upload URL was not provided.");
	}

	try {
		const uploadResult = await fetch(uploadResponse.uploadUrl, {
			method: "PUT",
			headers: {
				"Content-Type": contentType,
			},
			body: file,
		});

		if (uploadResult.ok) {
			return filesApi.markUploaded(uploadResponse.file.id);
		}
	} catch {
		// A browser CORS policy can block a valid R2 presigned upload. The
		// authenticated API proxy below provides a safe same-origin fallback.
	}

	return filesApi.uploadContent(uploadResponse.file.id, file, contentType);
}

export async function calculateFileHash(file: Blob) {
	if (!globalThis.crypto?.subtle) {
		return "";
	}

	const bytes = await file.arrayBuffer();
	const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);

	return Array.from(new Uint8Array(digest))
		.map((value) => value.toString(16).padStart(2, "0"))
		.join("");
}

export async function openClubFile(file: ClubFile) {
	const response = await filesApi.getDownloadUrl(file.id);
	window.open(response.downloadUrl, "_blank", "noopener,noreferrer");
}
