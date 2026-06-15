import { apiClient } from "./apiClient";
import type {
	ClubPost,
	CreateClubPostRequest,
	UpdateClubPostRequest,
} from "../types/posts";

export const postsApi = {
	getPosts: () => apiClient.get<ClubPost[]>("/posts"),

	getPost: (id: string) => apiClient.get<ClubPost>(`/posts/${id}`),

	createPost: (request: CreateClubPostRequest) =>
		apiClient.post<ClubPost>("/posts", request),

	updatePost: (id: string, request: UpdateClubPostRequest) =>
		apiClient.put<ClubPost>(`/posts/${id}`, request),

	deletePost: (id: string) => apiClient.delete<void>(`/posts/${id}`),
};
