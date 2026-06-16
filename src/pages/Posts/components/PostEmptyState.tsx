export default function PostEmptyState({
	canManagePosts,
	onCreatePost,
}: {
	canManagePosts: boolean;
	onCreatePost: () => void;
}) {
	return (
		<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
			<h3 className="text-base font-bold text-slate-900">No posts yet</h3>

			<p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
				Posts are simple club updates for players, coaches, and admins.
			</p>

			{canManagePosts && (
				<button
					type="button"
					onClick={onCreatePost}
					className="mt-4 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
				>
					Create first post
				</button>
			)}
		</div>
	);
}
