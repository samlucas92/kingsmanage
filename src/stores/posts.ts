import { create } from "zustand";

import { postsApi } from "../services/postsApi";
import type {
	ClubPost,
	CreateClubPostRequest,
	UpdateClubPostRequest,
} from "../types/posts";

type PostsState = {
	posts: ClubPost[];
	selectedPost: ClubPost | null;
	isLoadingPosts: boolean;
	isLoadingSelectedPost: boolean;
	hasLoadedPosts: boolean;
	postsLoadError: string;
	selectedPostLoadError: string;
	loadPosts: (force?: boolean) => Promise<void>;
	loadPost: (id: string) => Promise<void>;
	createPost: (request: CreateClubPostRequest) => Promise<ClubPost>;
	updatePost: (id: string, request: UpdateClubPostRequest) => Promise<ClubPost>;
	deletePost: (id: string) => Promise<void>;
	clearPostsLoadError: () => void;
	clearSelectedPost: () => void;
};

function sortPosts(posts: ClubPost[]) {
	return [...posts].sort((firstPost, secondPost) => {
		if (firstPost.isPinned !== secondPost.isPinned) {
			return firstPost.isPinned ? -1 : 1;
		}

		return new Date(secondPost.createdAt).getTime() - new Date(firstPost.createdAt).getTime();
	});
}

function replacePost(posts: ClubPost[], updatedPost: ClubPost) {
	const postExists = posts.some((post) => post.id === updatedPost.id);

	if (!postExists) {
		return sortPosts([...posts, updatedPost]);
	}

	return sortPosts(
		posts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
	);
}

export const usePostStore = create<PostsState>((set, get) => ({
	posts: [],
	selectedPost: null,
	isLoadingPosts: false,
	isLoadingSelectedPost: false,
	hasLoadedPosts: false,
	postsLoadError: "",
	selectedPostLoadError: "",

	loadPosts: async (force = false) => {
		if (get().isLoadingPosts) {
			return;
		}

		if (get().hasLoadedPosts && !force) {
			return;
		}

		set({
			isLoadingPosts: true,
			postsLoadError: "",
		});

		try {
			const posts = await postsApi.getPosts();

			set({
				posts: sortPosts(posts),
				isLoadingPosts: false,
				hasLoadedPosts: true,
			});
		} catch (error) {
			set({
				isLoadingPosts: false,
				postsLoadError:
					error instanceof Error ? error.message : "Failed to load posts.",
			});
		}
	},

	loadPost: async (id) => {
		set({
			isLoadingSelectedPost: true,
			selectedPostLoadError: "",
		});

		try {
			const post = await postsApi.getPost(id);

			set((state) => ({
				selectedPost: post,
				posts: replacePost(state.posts, post),
				hasLoadedPosts: true,
				isLoadingSelectedPost: false,
			}));
		} catch (error) {
			set({
				isLoadingSelectedPost: false,
				selectedPostLoadError:
					error instanceof Error ? error.message : "Failed to load post.",
			});
		}
	},

	createPost: async (request) => {
		const createdPost = await postsApi.createPost(request);

		set((state) => ({
			posts: replacePost(state.posts, createdPost),
			hasLoadedPosts: true,
		}));

		return createdPost;
	},

	updatePost: async (id, request) => {
		const updatedPost = await postsApi.updatePost(id, request);

		set((state) => ({
			posts: replacePost(state.posts, updatedPost),
			selectedPost:
				state.selectedPost?.id === updatedPost.id ? updatedPost : state.selectedPost,
		}));

		return updatedPost;
	},

	deletePost: async (id) => {
		await postsApi.deletePost(id);

		set((state) => ({
			posts: state.posts.filter((post) => post.id !== id),
			selectedPost: state.selectedPost?.id === id ? null : state.selectedPost,
		}));
	},

	clearPostsLoadError: () => set({ postsLoadError: "" }),

	clearSelectedPost: () =>
		set({
			selectedPost: null,
			selectedPostLoadError: "",
		}),
}));
