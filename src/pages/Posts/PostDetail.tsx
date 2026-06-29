import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import AttachmentList from "../../components/files/AttachmentList";
import FileUploadPanel from "../../components/files/FileUploadPanel";
import ConfirmationModal from "../../components/compositions/ConfirmationModal";
import { filesApi } from "../../services/filesApi";
import { openClubFile } from "../../services/fileService";
import { useAuthStore } from "../../stores/auth";
import { usePostStore } from "../../stores/posts";
import type { ClubFile } from "../../types/files";
import type { CreateClubPostRequest } from "../../types/posts";
import { formatDisplayDateTime } from "../../utils/date";
import { getPostTypeClass, getPostTypeLabel } from "../../utils/posts";
import PostFormModal from "./components/PostFormModal";
import RichTextContent from "../../components/rich-text/RichTextContent";

export default function PostDetail() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const currentUser = useAuthStore((state) => state.currentUser);
	const canManagePosts = currentUser?.role === "Admin" || currentUser?.role === "Coach";

	const posts = usePostStore((state) => state.posts);
	const selectedPost = usePostStore((state) => state.selectedPost);
	const isLoadingSelectedPost = usePostStore((state) => state.isLoadingSelectedPost);
	const selectedPostLoadError = usePostStore((state) => state.selectedPostLoadError);
	const loadPost = usePostStore((state) => state.loadPost);
	const updatePost = usePostStore((state) => state.updatePost);
	const deletePost = usePostStore((state) => state.deletePost);
	const clearSelectedPost = usePostStore((state) => state.clearSelectedPost);

	const [isPostModalOpen, setIsPostModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isDeletingPost, setIsDeletingPost] = useState(false);
	const [attachments, setAttachments] = useState<ClubFile[]>([]);
	const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
	const [attachmentsError, setAttachmentsError] = useState("");
	const [fileToDelete, setFileToDelete] = useState<ClubFile | null>(null);
	const [isDeletingFile, setIsDeletingFile] = useState(false);

	const postFromList = useMemo(
		() => posts.find((post) => post.id === id) ?? null,
		[id, posts]
	);

	const post = selectedPost?.id === id ? selectedPost : postFromList;
	const wasUpdated = post
		? new Date(post.updatedAt).getTime() > new Date(post.createdAt).getTime() + 1000
		: false;

	useEffect(() => {
		if (!id) {
			return;
		}

		void loadPost(id);
	}, [id, loadPost]);

	useEffect(() => {
		if (!id) {
			return;
		}

		void loadAttachments(id);
	}, [id]);

	useEffect(() => {
		return () => clearSelectedPost();
	}, [clearSelectedPost]);

	async function loadAttachments(postId: string) {
		setIsLoadingAttachments(true);
		setAttachmentsError("");

		try {
			const files = await filesApi.getFilesForLinkedEntity("Post", postId);
			setAttachments(files);
		} catch (error) {
			setAttachmentsError(
				error instanceof Error ? error.message : "Failed to load attachments."
			);
		} finally {
			setIsLoadingAttachments(false);
		}
	}

	async function handleSavePost(request: CreateClubPostRequest) {
		if (!id) {
			return;
		}

		await updatePost(id, request);
		setIsPostModalOpen(false);
	}

	async function handleDeletePost() {
		if (!id) {
			return;
		}

		setIsDeletingPost(true);

		try {
			await deletePost(id);
			navigate("/?tab=posts");
		} finally {
			setIsDeletingPost(false);
		}
	}

	async function handleDownloadFile(file: ClubFile) {
		try {
			await openClubFile(file);
		} catch (error) {
			setAttachmentsError(
				error instanceof Error ? error.message : "Failed to open attachment."
			);
		}
	}

	async function handleDeleteFile() {
		if (!fileToDelete) {
			return;
		}

		setIsDeletingFile(true);
		setAttachmentsError("");

		try {
			await filesApi.deleteFile(fileToDelete.id);
			setAttachments((currentFiles) =>
				currentFiles.filter((file) => file.id !== fileToDelete.id)
			);
			setFileToDelete(null);
		} catch (error) {
			setAttachmentsError(
				error instanceof Error ? error.message : "Failed to delete attachment."
			);
		} finally {
			setIsDeletingFile(false);
		}
	}

	function handleFileUploaded(file: ClubFile) {
		setAttachments((currentFiles) => [file, ...currentFiles]);
		setAttachmentsError("");
	}

	if (!id) {
		return (
			<PostDetailShell>
				<PostStateCard
					title="Post not found"
					message="This post link is missing an ID."
				/>
			</PostDetailShell>
		);
	}

	if (isLoadingSelectedPost && !post) {
		return (
			<PostDetailShell>
				<PostStateCard
					title="Loading post"
					message="Getting the latest post details."
				/>
			</PostDetailShell>
		);
	}

	if (selectedPostLoadError && !post) {
		return (
			<PostDetailShell>
				<PostStateCard
					title="Post could not be loaded"
					message={selectedPostLoadError}
				/>
			</PostDetailShell>
		);
	}

	if (!post) {
		return (
			<PostDetailShell>
				<PostStateCard
					title="Post not found"
					message="This post may have been deleted or you may not have access to it."
				/>
			</PostDetailShell>
		);
	}

	return (
		<PostDetailShell>
			<article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
				<div className="border-b border-slate-200 px-5 py-5 sm:px-6">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
								<span className={`rounded-full px-3 py-1 uppercase tracking-wide ${getPostTypeClass(post.type)}`}>
									{getPostTypeLabel(post.type)}
								</span>

								{post.isPinned && (
									<span className="rounded-full bg-amber-50 px-3 py-1 uppercase tracking-wide text-amber-800">
										Pinned
									</span>
								)}

								<span>{formatDisplayDateTime(post.createdAt)}</span>
							</div>

							<h1 className="mt-3 text-3xl font-bold text-slate-950">
								{post.title}
							</h1>

							{wasUpdated && (
								<p className="mt-2 text-sm font-semibold text-slate-400">
									Updated {formatDisplayDateTime(post.updatedAt)}
								</p>
							)}
						</div>

						{canManagePosts && (
							<div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
								<button
									type="button"
									onClick={() => setIsPostModalOpen(true)}
									className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
								>
									Edit post
								</button>

								<button
									type="button"
									onClick={() => setIsDeleteModalOpen(true)}
									className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50"
								>
									Delete
								</button>
							</div>
						)}
					</div>
				</div>

				<div className="px-5 py-6 sm:px-6">
					<RichTextContent value={post.body} className="text-base leading-8 text-slate-700" />
				</div>
			</article>

			<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<h2 className="text-xl font-bold text-slate-900">Attachments</h2>
						<p className="mt-1 text-sm text-slate-500">
							Files attached to this post for players, coaches, and admins.
						</p>
					</div>
				</div>

				{attachmentsError && (
					<div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
						{attachmentsError}
					</div>
				)}

				{canManagePosts && (
					<div className="mt-4">
						<FileUploadPanel
							linkedEntityType="Post"
							linkedEntityId={post.id}
							onFileUploaded={handleFileUploaded}
						/>
					</div>
				)}

				<div className="mt-4">
					<AttachmentList
						canManageFiles={canManagePosts}
						files={attachments}
						isLoading={isLoadingAttachments}
						onDeleteFile={setFileToDelete}
						onDownloadFile={(file) => void handleDownloadFile(file)}
					/>
				</div>
			</section>

			<PostFormModal
				isOpen={isPostModalOpen}
				onClose={() => setIsPostModalOpen(false)}
				onSavePost={handleSavePost}
				post={post}
			/>

			<ConfirmationModal
				isOpen={isDeleteModalOpen}
				title="Delete post"
				message={`Delete “${post.title}”? This cannot be undone.`}
				confirmText="Delete post"
				isBusy={isDeletingPost}
				variant="danger"
				onCancel={() => setIsDeleteModalOpen(false)}
				onConfirm={handleDeletePost}
			/>

			<ConfirmationModal
				isOpen={Boolean(fileToDelete)}
				title="Delete attachment"
				message={fileToDelete ? `Delete “${fileToDelete.originalFileName}”?` : undefined}
				confirmText="Delete attachment"
				isBusy={isDeletingFile}
				variant="danger"
				onCancel={() => setFileToDelete(null)}
				onConfirm={handleDeleteFile}
			/>
		</PostDetailShell>
	);
}

function PostDetailShell({ children }: { children: ReactNode }) {
	return (
		<div className="space-y-6">
			<Link
				to="/?tab=posts"
				className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
			>
				Back to posts
			</Link>

			{children}
		</div>
	);
}

function PostStateCard({
	message,
	title,
}: {
	message: string;
	title: string;
}) {
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<h1 className="text-2xl font-bold text-slate-900">{title}</h1>
			<p className="mt-2 text-sm text-slate-500">{message}</p>
		</section>
	);
}
