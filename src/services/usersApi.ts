import { apiClient } from "./apiClient";
import type { AuthUser, CreateUserRequest, MembershipClubOption, UpdateMembershipsRequest, UpdateUserRequest } from "../types/auth";

export const usersApi = {
	getUsers: () => apiClient.get<AuthUser[]>("/users"),
	getUser: (id: string) => apiClient.get<AuthUser>(`/users/${id}`),
	createUser: (request: CreateUserRequest) => apiClient.post<AuthUser>("/users", request),
	updateUser: (id: string, request: UpdateUserRequest) => apiClient.put<AuthUser>(`/users/${id}`, request),
	setUserActive: (id: string, isActive: boolean) => apiClient.patch<AuthUser>(`/users/${id}/active`, isActive),
	resetUserPassword: (id: string, newPassword: string) =>
		apiClient.post<void>(`/users/${id}/reset-password`, { newPassword }),
	getMembershipOptions: () => apiClient.get<MembershipClubOption[]>("/user-memberships/options"),
	updateMemberships: (id: string, request: UpdateMembershipsRequest) =>
		apiClient.put<AuthUser>(`/user-memberships/${id}`, request),
};
