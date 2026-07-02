import { useEffect, useState, type FormEvent } from "react";

import type { ClubPost, ClubPostType, CreateClubPostRequest } from "../../../types/posts";
import { getPostTypeLabel } from "../../../utils/posts";
import RichTextEditor from "../../../components/rich-text/RichTextEditor";
import { isRichTextEmpty } from "../../../utils/richText";

type PostFormModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSavePost: (request: CreateClubPostRequest) => Promise<void>;
	post?: ClubPost | null;
};

const postTypes: ClubPostType[] = ["General", "Announcement", "MatchInfo", "Social"];

export default function PostFormModal({
	isOpen,
	onClose,
	onSavePost,
	post = null,
}: PostFormModalProps) {
	const isEditing = Boolean(post);
	const [type, setType] = useState<ClubPostType>("General");
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [isPinned, setIsPinned] = useState(false);
	const [error, setError] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [draftId, setDraftId] = useState(() => crypto.randomUUID());

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		setType(post?.type ?? "General");
		setTitle(post?.title ?? "");
		setBody(post?.body ?? "");
		setIsPinned(post?.isPinned ?? false);
		setError("");
		setIsSaving(false);
		if (!post) setDraftId(crypto.randomUUID());
	}, [isOpen, post]);

	if (!isOpen) {
		return null;
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");

		if (!title.trim()) {
			setError("Enter a post title.");
			return;
		}

		if (isRichTextEmpty(body)) {
			setError("Enter some post content.");
			return;
		}

		setIsSaving(true);

		try {
			await onSavePost({
				type,
				title: title.trim(),
				body,
				isPinned,
			});

			resetForm();
			onClose();
		} catch (error) {
			setError(
				error instanceof Error
					? error.message
					: isEditing
						? "Failed to update post."
						: "Failed to create post."
			);
		} finally {
			setIsSaving(false);
		}
	}

	function handleClose() {
		resetForm();
		onClose();
	}

	function resetForm() {
		setType("General");
		setTitle("");
		setBody("");
		setIsPinned(false);
		setError("");
		setIsSaving(false);
	}

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 px-3 py-6 sm:px-6">
			<div className="mx-auto w-full max-w-2xl rounded-2xl bg-white shadow-xl">
				<div className="border-b border-slate-200 px-5 py-4 sm:px-6">
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
								{isEditing ? "Edit post" : "New post"}
							</p>
							<h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
								{isEditing ? "Update club post" : "Create club post"}
							</h2>
							<p className="mt-1 text-sm text-slate-500">
								Posts are season-agnostic updates shown to players, coaches, and admins.
							</p>
						</div>

						<button
							type="button"
							onClick={handleClose}
							className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
						>
							Close
						</button>
					</div>
				</div>

				<form className="space-y-5 p-5 sm:p-6" onSubmit={handleSubmit}>
					{error && (
						<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
							{error}
						</div>
					)}

					<div className="grid gap-4 sm:grid-cols-2">
						<label className="space-y-2">
							<span className="text-sm font-bold text-slate-700">Post type</span>
							<select
								value={type}
								onChange={(event) => setType(event.target.value as ClubPostType)}
								className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
							>
								{postTypes.map((postType) => (
									<option key={postType} value={postType}>
										{getPostTypeLabel(postType)}
									</option>
								))}
							</select>
						</label>

						<label className="flex items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
							<input
								type="checkbox"
								checked={isPinned}
								onChange={(event) => setIsPinned(event.target.checked)}
								className="h-4 w-4 rounded border-slate-300"
							/>
							<span className="text-sm font-bold text-slate-700">Pin this post</span>
						</label>
					</div>

					<label className="block space-y-2">
						<span className="text-sm font-bold text-slate-700">Title</span>
						<input
							value={title}
							onChange={(event) => setTitle(event.target.value)}
							className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
							placeholder="Training update"
						/>
					</label>

					<div className="block space-y-2">
						<span className="text-sm font-bold text-slate-700">Post content</span>
						<RichTextEditor
							value={body}
							onChange={setBody}
							placeholder="Write the update players should see."
							imageOwner={{
								linkedEntityType: "RichTextDraft",
								linkedEntityId: draftId,
							}}
						/>
					</div>

					<div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
						<p className="font-bold">Players can read posts but cannot edit or delete them.</p>
						<p className="mt-1 text-blue-600">
							Keep posts clear and readable. Attach files from the post detail page after creating or editing the post.
						</p>
					</div>

					<div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={handleClose}
							className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
						>
							Cancel
						</button>

						<button
							type="submit"
							disabled={isSaving}
							className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{isSaving
								? isEditing
									? "Saving..."
									: "Creating..."
								: isEditing
									? "Save changes"
									: "Create post"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
