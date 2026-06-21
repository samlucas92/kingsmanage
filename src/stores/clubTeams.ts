import { create } from "zustand";

import { clubTeamsApi } from "../services/clubTeamsApi";
import type { ClubTeam } from "./match";

export type { ClubTeam } from "./match";

export type ClubTeamProfile = {
	id: string;
	displayName: string;
	shortName: string;
	isActive: boolean;
	sortOrder: number;
	createdAt?: string;
	updatedAt?: string;
};

export const FIRST_TEAM_ID = "11111111-1111-1111-1111-111111111101";
export const SECOND_TEAM_ID = "22222222-2222-2222-2222-222222222202";

export const defaultClubTeamProfiles: ClubTeamProfile[] = [
	{ id: FIRST_TEAM_ID, displayName: "First Team", shortName: "First", isActive: true, sortOrder: 0 },
	{ id: SECOND_TEAM_ID, displayName: "Second Team", shortName: "Second", isActive: true, sortOrder: 1 },
];

type ClubTeamStore = {
	profiles: ClubTeamProfile[];
	isLoading: boolean;
	hasLoaded: boolean;
	error: string;
	loadProfiles: (force?: boolean) => Promise<void>;
	createProfile: (profile: Omit<ClubTeamProfile, "id">) => Promise<void>;
	updateProfile: (profile: ClubTeamProfile) => Promise<void>;
	deleteProfile: (id: string) => Promise<void>;
};

function sortProfiles(profiles: ClubTeamProfile[]) {
	return [...profiles].sort((a, b) => a.sortOrder - b.sortOrder || a.displayName.localeCompare(b.displayName));
}

export const useClubTeamStore = create<ClubTeamStore>()((set, get) => ({
	profiles: defaultClubTeamProfiles,
	isLoading: false,
	hasLoaded: false,
	error: "",
	loadProfiles: async (force = false) => {
		if (get().isLoading || (get().hasLoaded && !force)) return;
		set({ isLoading: true, error: "" });
		try {
			const profiles = await clubTeamsApi.getAll();
			set({ profiles: sortProfiles(profiles.length ? profiles : defaultClubTeamProfiles), isLoading: false, hasLoaded: true });
		} catch (error) {
			set({ isLoading: false, hasLoaded: true, error: error instanceof Error ? error.message : "Failed to load club teams." });
		}
	},
	createProfile: async (profile) => {
		const created = await clubTeamsApi.create(profile);
		set((state) => ({ profiles: sortProfiles([...state.profiles, created]), error: "" }));
	},
	updateProfile: async (profile) => {
		const updated = await clubTeamsApi.update(profile);
		set((state) => ({
			profiles: sortProfiles(state.profiles.map((item) => item.id === updated.id ? updated : item)),
			error: "",
		}));
	},
	deleteProfile: async (id) => {
		await clubTeamsApi.delete(id);
		set((state) => ({
			profiles: state.profiles.filter((profile) => profile.id !== id),
			error: "",
		}));
	},
}));

export function normaliseLegacyTeamId(teamId: string) {
	if (teamId === "first" || teamId === "First") return FIRST_TEAM_ID;
	if (teamId === "second" || teamId === "Second") return SECOND_TEAM_ID;
	return teamId;
}

export function getClubTeamLabel(profiles: ClubTeamProfile[], teamId: ClubTeam | string) {
	const normalisedId = normaliseLegacyTeamId(teamId);
	return profiles.find((profile) => profile.id === normalisedId)?.displayName ?? "Unknown team";
}
