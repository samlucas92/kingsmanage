import { create } from "zustand";
import { authApi } from "../services/authApi";
import { clearStoredAuthToken, getStoredAuthToken, setStoredAuthToken } from "../services/apiClient";
import type { AuthUser, ClubAccess } from "../types/auth";

type AuthState = {
	currentUser: AuthUser | null;
	token: string | null;
	isAuthenticated: boolean;
	isInitialised: boolean;
	isLoading: boolean;
	error: string | null;
	availableClubs: ClubAccess[];
	isSwitchingClub: boolean;
	initialise: () => Promise<void>;
	login: (email: string, password: string) => Promise<void>;
	changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
	switchClub: (clubId: string) => Promise<void>;
	logout: () => void;
	clearError: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
	currentUser: null,
	token: getStoredAuthToken(),
	isAuthenticated: Boolean(getStoredAuthToken()),
	isInitialised: false,
	isLoading: false,
	error: null,
	availableClubs: [],
	isSwitchingClub: false,
	initialise: async () => {
		if (get().isInitialised) {
			return;
		}

		const token = getStoredAuthToken();

		if (!token) {
			set({
				currentUser: null,
				token: null,
				isAuthenticated: false,
				isInitialised: true,
				isLoading: false,
			});
			return;
		}

		set({ isLoading: true, error: null });

		try {
			const [currentUser, availableClubs] = await Promise.all([
				authApi.getCurrentUser(),
				authApi.getAvailableClubs(),
			]);

			set({
				currentUser,
				token,
				isAuthenticated: true,
				isInitialised: true,
				isLoading: false,
				availableClubs,
			});
		} catch (error) {
			clearStoredAuthToken();

			set({
				currentUser: null,
				token: null,
				isAuthenticated: false,
				isInitialised: true,
				isLoading: false,
				availableClubs: [],
				error: error instanceof Error ? error.message : "Your session has expired.",
			});
		}
	},
	login: async (email: string, password: string) => {
		set({ isLoading: true, error: null });

		try {
			const response = await authApi.login({ email, password });
			setStoredAuthToken(response.token);
			const availableClubs = await authApi.getAvailableClubs();

			set({
				currentUser: response.user,
				token: response.token,
				isAuthenticated: true,
				isInitialised: true,
				isLoading: false,
				availableClubs,
			});
		} catch (error) {
			clearStoredAuthToken();

			set({
				currentUser: null,
				token: null,
				isAuthenticated: false,
				isLoading: false,
				availableClubs: [],
				error: error instanceof Error ? error.message : "Login failed.",
			});

			throw error;
		}
	},
	changePassword: async (currentPassword: string, newPassword: string) => {
		await authApi.changePassword({ currentPassword, newPassword });
	},
	switchClub: async (clubId: string) => {
		const currentClub = get().availableClubs.find((club) => club.isCurrent);
		if (currentClub?.id === clubId || get().isSwitchingClub) return;

		set({ isSwitchingClub: true, error: null });
		try {
			const response = await authApi.switchClub(clubId);
			setStoredAuthToken(response.token);
			set({ token: response.token, currentUser: response.user });
			window.location.reload();
		} catch (error) {
			set({
				isSwitchingClub: false,
				error: error instanceof Error ? error.message : "Could not switch club.",
			});
			throw error;
		}
	},
	logout: () => {
		clearStoredAuthToken();

		set({
			currentUser: null,
			token: null,
			isAuthenticated: false,
			isInitialised: true,
			isLoading: false,
			error: null,
			availableClubs: [],
			isSwitchingClub: false,
		});
	},
	clearError: () => set({ error: null }),
}));

window.addEventListener("kingsmanage:unauthorised", () => {
	useAuthStore.getState().logout();
});
