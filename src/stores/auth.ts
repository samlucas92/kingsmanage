import { create } from "zustand";
import { authApi } from "../services/authApi";
import { clearStoredAuthToken, getStoredAuthToken, setStoredAuthToken } from "../services/apiClient";
import type { AuthUser } from "../types/auth";

type AuthState = {
	currentUser: AuthUser | null;
	token: string | null;
	isAuthenticated: boolean;
	isInitialised: boolean;
	isLoading: boolean;
	error: string | null;
	initialise: () => Promise<void>;
	login: (email: string, password: string) => Promise<void>;
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
			const currentUser = await authApi.getCurrentUser();

			set({
				currentUser,
				token,
				isAuthenticated: true,
				isInitialised: true,
				isLoading: false,
			});
		} catch (error) {
			clearStoredAuthToken();

			set({
				currentUser: null,
				token: null,
				isAuthenticated: false,
				isInitialised: true,
				isLoading: false,
				error: error instanceof Error ? error.message : "Your session has expired.",
			});
		}
	},
	login: async (email: string, password: string) => {
		set({ isLoading: true, error: null });

		try {
			const response = await authApi.login({ email, password });

			setStoredAuthToken(response.token);

			set({
				currentUser: response.user,
				token: response.token,
				isAuthenticated: true,
				isInitialised: true,
				isLoading: false,
			});
		} catch (error) {
			clearStoredAuthToken();

			set({
				currentUser: null,
				token: null,
				isAuthenticated: false,
				isLoading: false,
				error: error instanceof Error ? error.message : "Login failed.",
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
		});
	},
	clearError: () => set({ error: null }),
}));

window.addEventListener("kingsmanage:unauthorised", () => {
	useAuthStore.getState().logout();
});
