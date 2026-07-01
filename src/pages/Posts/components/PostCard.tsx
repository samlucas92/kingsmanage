import { Link } from "react-router-dom";

import type { ClubPost } from "../../../types/posts";
import { formatDisplayDateTime } from "../../../utils/date";
import { getPostTypeClass, getPostTypeLabel } from "../../../utils/posts";
import { richTextToPlainText } from "../../../utils/richText";

export default function PostCard({
	canManagePosts,
	onDeletePost,
	onEditPost,
	post,
}: {
	canManagePosts: boolean;
	onDeletePost: (post: ClubPost) => void;
	onEditPost: (post: ClubPost) => void;
	post: ClubPost;
}) {
	const wasUpdated = new Date(post.updatedAt).getTime() > new Date(post.createdAt).getTime() + 1000;

	return (
		<article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-yepset-200 hover:shadow-md sm:p-5">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<Link
					to={`/posts/${post.id}`}
					className="min-w-0 flex-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-yepset-500 focus:ring-offset-2"
				>
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

					<h3 className="mt-3 text-lg font-bold text-slate-900">{post.title}</h3>

					<p
						className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600"
						style={{
							display: "-webkit-box",
							WebkitBoxOrient: "vertical",
							WebkitLineClamp: 4,
							overflow: "hidden",
						}}
					>
						{richTextToPlainText(post.body)}
					</p>

					<div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400">
						<span className="text-yepset-700">Read full post</span>
						{wasUpdated && <span>Updated {formatDisplayDateTime(post.updatedAt)}</span>}
					</div>
				</Link>

				{canManagePosts && (
					<div className="flex shrink-0 gap-2 sm:w-28 sm:flex-col">
						<button
							type="button"
							onClick={() => onEditPost(post)}
							className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
						>
							Edit
						</button>

						<button
							type="button"
							onClick={() => onDeletePost(post)}
							className="rounded-xl border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50"
						>
							Delete
						</button>
					</div>
				)}
			</div>
		</article>
	);
}
