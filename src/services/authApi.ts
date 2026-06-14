import type {
	AuthUser,
	ChangePasswordRequest,
	LoginRequest,
	LoginResponse,
} from "../types/auth";
import { apiClient } from "./apiClient";

export const authApi = {
	login: (request: LoginRequest) =>
		apiClient.post<LoginResponse>("/auth/login", request, {
			authenticated: false,
		}),
	getCurrentUser: () => apiClient.get<AuthUser>("/auth/me"),
	changePassword: (request: ChangePasswordRequest) =>
		apiClient.post<void>("/auth/change-password", request),
};
