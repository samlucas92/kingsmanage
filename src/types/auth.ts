export type UserRole = "Admin" | "Coach" | "Player";

export type AuthUser = {
	id: string;
	email: string;
	role: UserRole;
	playerId?: string | null;
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

export type ChangePasswordRequest = {
	currentPassword: string;
	newPassword: string;
};

export type ResetPasswordRequest = {
	newPassword: string;
};
