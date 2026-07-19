import { create } from "zustand";
import { usersApi } from "../services/usersApi";
import type { AuthUser, CreateUserRequest, UpdateMembershipsRequest, UpdateUserRequest } from "../types/auth";
import { getAsyncErrorMessage } from "./asyncStore";

type UserState = {
	users: AuthUser[];
	isLoadingUsers: boolean;
	hasLoadedUsers: boolean;
	userLoadError: string;
	loadUsers: (force?: boolean) => Promise<void>;
	createUser: (request: CreateUserRequest) => Promise<AuthUser>;
	updateUser: (id: string, request: UpdateUserRequest) => Promise<AuthUser>;
	updateMemberships: (id: string, request: UpdateMembershipsRequest) => Promise<AuthUser>;
	setUserActive: (id: string, isActive: boolean) => Promise<AuthUser>;
	resetUserPassword: (id: string, newPassword: string) => Promise<void>;
	clearUserLoadError: () => void;
};

function sortUsers(users: AuthUser[]) {
	return [...users].sort((firstUser, secondUser) => {
		if (firstUser.isActive !== secondUser.isActive) {
			return firstUser.isActive ? -1 : 1;
		}

		return firstUser.email.localeCompare(secondUser.email);
	});
}

function replaceUser(users: AuthUser[], updatedUser: AuthUser) {
	const exists = users.some((user) => user.id === updatedUser.id);

	if (!exists) {
		return sortUsers([...users, updatedUser]);
	}

	return sortUsers(users.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
}

export const useUserStore = create<UserState>((set, get) => ({
	users: [],
	isLoadingUsers: false,
	hasLoadedUsers: false,
	userLoadError: "",
	loadUsers: async (force = false) => {
		if (get().isLoadingUsers) {
			return;
		}

		if (get().hasLoadedUsers && !force) {
			return;
		}

		set({ isLoadingUsers: true, userLoadError: "" });

		try {
			const users = await usersApi.getUsers();

			set({
				users: sortUsers(users),
				isLoadingUsers: false,
				hasLoadedUsers: true,
			});
		} catch (error) {
			set({
				isLoadingUsers: false,
				userLoadError: getAsyncErrorMessage(error, "Failed to load users."),
			});
		}
	},
	createUser: async (request) => {
		const createdUser = await usersApi.createUser(request);

		set((state) => ({
			users: replaceUser(state.users, createdUser),
			hasLoadedUsers: true,
		}));

		return createdUser;
	},
	updateUser: async (id, request) => {
		const updatedUser = await usersApi.updateUser(id, request);

		set((state) => ({
			users: replaceUser(state.users, updatedUser),
		}));

		return updatedUser;
	},
	updateMemberships: async (id, request) => {
		const updatedUser = await usersApi.updateMemberships(id, request);
		set((state) => ({ users: replaceUser(state.users, updatedUser) }));
		return updatedUser;
	},
	setUserActive: async (id, isActive) => {
		const updatedUser = await usersApi.setUserActive(id, isActive);

		set((state) => ({
			users: replaceUser(state.users, updatedUser),
		}));

		return updatedUser;
	},
	resetUserPassword: async (id, newPassword) => {
		await usersApi.resetUserPassword(id, newPassword);
	},
	clearUserLoadError: () => set({ userLoadError: "" }),
}));
