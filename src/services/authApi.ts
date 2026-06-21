import type { AuthUser, ClubAccess, CreateUserRequest, LoginRequest, LoginResponse, UpdateUserRequest } from "../types/auth";
import { apiClient } from "./apiClient";

export type ChangePasswordRequest = {
	currentPassword: string;
	newPassword: string;
};

export const authApi = {
	login: (request: LoginRequest) =>
		apiClient.post<LoginResponse>("/auth/login", request, {
			authenticated: false,
		}),
	getCurrentUser: () => apiClient.get<AuthUser>("/auth/me"),
	getAvailableClubs: () => apiClient.get<ClubAccess[]>("/club-access"),
	switchClub: (clubId: string) =>
		apiClient.post<LoginResponse>("/club-access/switch", { clubId }),
	changePassword: (request: ChangePasswordRequest) =>
		apiClient.post<void>("/auth/change-password", request),
};

export const usersApi = {
	getUsers: () => apiClient.get<AuthUser[]>("/users"),
	getUser: (id: string) => apiClient.get<AuthUser>(`/users/${id}`),
	createUser: (request: CreateUserRequest) => apiClient.post<AuthUser>("/users", request),
	updateUser: (id: string, request: UpdateUserRequest) => apiClient.put<AuthUser>(`/users/${id}`, request),
	setUserActive: (id: string, isActive: boolean) => apiClient.patch<AuthUser>(`/users/${id}/active`, isActive),
	resetUserPassword: (id: string, newPassword: string) =>
		apiClient.post<void>(`/users/${id}/reset-password`, { newPassword }),
};
