import { apiClient } from "./apiClient";
import type { AuthUser, TenantRole } from "../types/auth";

export type CreateSetupStaffRequest = {
	email: string;
	password: string;
	role: Extract<TenantRole, "ClubAdmin" | "TeamManager" | "Coach">;
	teamId: string | null;
};

export const clubSetupApi = {
	createStaff: (request: CreateSetupStaffRequest) =>
		apiClient.post<AuthUser>("/club-setup/staff", request),
};
