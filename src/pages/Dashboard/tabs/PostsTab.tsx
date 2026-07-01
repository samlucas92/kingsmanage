import PanelCard from "../../../components/compositions/PanelCard";
import type { ClubPost } from "../../../types/posts";
import PostCard from "../../Posts/components/PostCard";
import PostEmptyState from "../../Posts/components/PostEmptyState";

export default function PostsTab({
	canManagePosts,
	isLoadingPosts,
	onCreatePost,
	onDeletePost,
	onEditPost,
	posts,
	postsLoadError,
}: {
	canManagePosts: boolean;
	isLoadingPosts: boolean;
	onCreatePost: () => void;
	onDeletePost: (post: ClubPost) => void;
	onEditPost: (post: ClubPost) => void;
	posts: ClubPost[];
	postsLoadError: string;
}) {
	return (
		<PanelCard
			action={
				canManagePosts ? (
					<button
						type="button"
						onClick={onCreatePost}
						className="rounded-xl bg-yepset-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-yepset-800"
					>
						Create post
					</button>
				) : undefined
			}
			description="Latest updates and reminders for the club."
			title="Posts"
		>
			{postsLoadError && (
				<div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
					{postsLoadError}
				</div>
			)}

			{isLoadingPosts && (
				<div className="rounded-xl border border-yepset-100 bg-yepset-50 px-4 py-3 text-sm font-semibold text-yepset-700">
					Loading posts...
				</div>
			)}

			{!isLoadingPosts && posts.length === 0 && (
				<PostEmptyState
					canManagePosts={canManagePosts}
					onCreatePost={onCreatePost}
				/>
			)}

			{!isLoadingPosts && posts.length > 0 && (
				<div className="space-y-3">
					{posts.map((post) => (
						<PostCard
							key={post.id}
							canManagePosts={canManagePosts}
							onDeletePost={onDeletePost}
							onEditPost={onEditPost}
							post={post}
						/>
					))}
				</div>
			)}
		</PanelCard>
	);
}
