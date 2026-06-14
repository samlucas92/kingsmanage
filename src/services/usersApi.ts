import { apiClient } from "./apiClient";
import type {
	AuthUser,
	CreateUserRequest,
	ResetPasswordRequest,
	UpdateUserRequest,
} from "../types/auth";

export const usersApi = {
	getUsers: () => apiClient.get<AuthUser[]>("/users"),
	getUser: (id: string) => apiClient.get<AuthUser>(`/users/${id}`),
	createUser: (request: CreateUserRequest) => apiClient.post<AuthUser>("/users", request),
	updateUser: (id: string, request: UpdateUserRequest) =>
		apiClient.put<AuthUser>(`/users/${id}`, request),
	setUserActive: (id: string, isActive: boolean) =>
		apiClient.patch<AuthUser>(`/users/${id}/active`, isActive),
	resetPassword: (id: string, request: ResetPasswordRequest) =>
		apiClient.post<void>(`/users/${id}/reset-password`, request),
};
