import type { ClubFile } from "../../types/files";
import { formatDisplayDateTime } from "../../utils/date";
import { formatFileSize } from "../../services/fileService";

type AttachmentListProps = {
	canManageFiles: boolean;
	files: ClubFile[];
	isLoading?: boolean;
	onDeleteFile: (file: ClubFile) => void;
	onDownloadFile: (file: ClubFile) => void;
};

export default function AttachmentList({
	canManageFiles,
	files,
	isLoading = false,
	onDeleteFile,
	onDownloadFile,
}: AttachmentListProps) {
	if (isLoading) {
		return (
			<div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
				Loading attachments...
			</div>
		);
	}

	if (files.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
				No attachments yet.
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{files.map((file) => (
				<div
					key={file.id}
					className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
				>
					<div className="min-w-0">
						<p className="truncate text-sm font-bold text-slate-900">
							{file.originalFileName}
						</p>
						<div className="mt-1 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
							<span>{formatFileSize(file.sizeBytes)}</span>
							<span>•</span>
							<span>{file.contentType}</span>
							{file.uploadedAt && (
								<>
									<span>•</span>
									<span>Uploaded {formatDisplayDateTime(file.uploadedAt)}</span>
								</>
							)}
						</div>
					</div>

					<div className="flex shrink-0 gap-2">
						<button
							type="button"
							onClick={() => onDownloadFile(file)}
							className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
						>
							Open
						</button>

						{canManageFiles && (
							<button
								type="button"
								onClick={() => onDeleteFile(file)}
								className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50"
							>
								Delete
							</button>
						)}
					</div>
				</div>
			))}
		</div>
	);
}
