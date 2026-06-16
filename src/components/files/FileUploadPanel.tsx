import { useRef, useState } from "react";

import { uploadLinkedFile, getUploadFileValidationError } from "../../services/fileService";
import type {
	ClubFile,
	ClubFileLinkedEntityType,
	ClubFileVisibility,
} from "../../types/files";

type FileUploadPanelProps = {
	linkedEntityType: ClubFileLinkedEntityType;
	linkedEntityId: string;
	visibility?: ClubFileVisibility;
	onFileUploaded: (file: ClubFile) => void;
};

export default function FileUploadPanel({
	linkedEntityId,
	linkedEntityType,
	onFileUploaded,
	visibility = "AuthenticatedUsers",
}: FileUploadPanelProps) {
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [error, setError] = useState("");
	const [isUploading, setIsUploading] = useState(false);

	async function handleFilesSelected(files: FileList | null) {
		setError("");

		const selectedFiles = Array.from(files ?? []);

		if (selectedFiles.length === 0) {
			return;
		}

		const firstValidationError = selectedFiles
			.map(getUploadFileValidationError)
			.find(Boolean);

		if (firstValidationError) {
			setError(firstValidationError);
			clearFileInput();
			return;
		}

		setIsUploading(true);

		try {
			for (const file of selectedFiles) {
				const uploadedFile = await uploadLinkedFile({
					file,
					linkedEntityId,
					linkedEntityType,
					visibility,
				});

				onFileUploaded(uploadedFile);
			}
		} catch (error) {
			setError(error instanceof Error ? error.message : "Failed to upload file.");
		} finally {
			setIsUploading(false);
			clearFileInput();
		}
	}

	function clearFileInput() {
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}

	return (
		<div className="rounded-xl border border-dashed border-blue-200 bg-blue-50 px-4 py-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-sm font-bold text-blue-900">Add attachments</p>
					<p className="mt-1 text-xs font-semibold text-blue-700">
						JPG, PNG, WebP or PDF. Maximum 10MB per file.
					</p>
				</div>

				<label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800">
					{isUploading ? "Uploading..." : "Choose files"}
					<input
						ref={fileInputRef}
						type="file"
						multiple
						disabled={isUploading}
						accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
						className="sr-only"
						onChange={(event) => void handleFilesSelected(event.target.files)}
					/>
				</label>
			</div>

			{error && (
				<div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
					{error}
				</div>
			)}
		</div>
	);
}
