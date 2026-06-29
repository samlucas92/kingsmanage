import { apiClient } from "./apiClient";
import type {
	ClubPost,
	CreateClubPostRequest,
	UpdateClubPostRequest,
	ClubPostTemplate,
	SaveClubPostTemplateRequest,
} from "../types/posts";

export const postsApi = {
	getPosts: () => apiClient.get<ClubPost[]>("/posts"),

	getPost: (id: string) => apiClient.get<ClubPost>(`/posts/${id}`),

	createPost: (request: CreateClubPostRequest) =>
		apiClient.post<ClubPost>("/posts", request),

	updatePost: (id: string, request: UpdateClubPostRequest) =>
		apiClient.put<ClubPost>(`/posts/${id}`, request),

	deletePost: (id: string) => apiClient.delete<void>(`/posts/${id}`),

	getTemplates: () => apiClient.get<ClubPostTemplate[]>("/post-templates"),
	createTemplate: (request: SaveClubPostTemplateRequest) =>
		apiClient.post<ClubPostTemplate>("/post-templates", request),
	updateTemplate: (id: string, request: SaveClubPostTemplateRequest) =>
		apiClient.put<ClubPostTemplate>(`/post-templates/${id}`, request),
	deleteTemplate: (id: string) =>
		apiClient.delete<void>(`/post-templates/${id}`),
};
