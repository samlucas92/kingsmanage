import type { SportFormation } from "../constants/sports";

export type UserRole = "Admin" | "Coach" | "Player";
export type TenantRole = "OrganizationAdmin" | "ClubAdmin" | "TeamManager" | "Coach" | "Player";

export type UserMembership = {
	organizationId?: string;
	clubId: string | null;
	teamId: string | null;
	role: TenantRole;
};

export type MembershipClubOption = {
	id: string;
	name: string;
	teams: { id: string; name: string }[];
};

export type AuthUser = {
	id: string;
	email: string;
	role: UserRole;
	playerId?: string | null;
	defaultClubId?: string | null;
	tenantRole?: TenantRole | null;
	isPlatformAdmin: boolean;
	memberships: UserMembership[];
	isActive: boolean;
	createdAt?: string;
	updatedAt?: string | null;
	lastLoginAt?: string | null;
};

export type LoginRequest = {
	email: string;
	password: string;
};

export type LoginResponse = {
	token: string;
	expiresAt: string;
	user: AuthUser;
};

export type ClubAccess = {
	id: string;
	name: string;
	sportKey: string;
	primaryColor: string;
	secondaryColor: string;
	customFormations: SportFormation[];
	isCurrent: boolean;
};

export type CreateUserRequest = {
	email: string;
	password: string;
	role: UserRole;
	playerId?: string | null;
	isActive?: boolean;
};

export type UpdateUserRequest = {
	email: string;
	role: UserRole;
	playerId?: string | null;
	isActive: boolean;
	password?: string | null;
};

export type UpdateMembershipsRequest = {
	defaultClubId: string | null;
	memberships: UserMembership[];
};

export type ChangePasswordRequest = {
	currentPassword: string;
	newPassword: string;
};

export type ResetPasswordRequest = {
	newPassword: string;
};
