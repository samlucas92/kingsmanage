import { create } from "zustand";

import { organizationLocationsApi } from "../services/organizationLocationsApi";
import type {
	OrganizationLocation,
	OrganizationLocationInput,
} from "../types/locations";
import { getAsyncErrorMessage } from "./asyncStore";

type OrganizationLocationsState = {
	locations: OrganizationLocation[];
	isLoading: boolean;
	hasLoaded: boolean;
	error: string;
	loadLocations: (force?: boolean) => Promise<void>;
	createLocation: (input: OrganizationLocationInput) => Promise<OrganizationLocation>;
	updateLocation: (id: string, input: OrganizationLocationInput) => Promise<OrganizationLocation>;
	deleteLocation: (id: string) => Promise<void>;
};

function sortLocations(locations: OrganizationLocation[]) {
	return [...locations].sort((first, second) => first.name.localeCompare(second.name));
}

export const useOrganizationLocationsStore = create<OrganizationLocationsState>((set, get) => ({
	locations: [],
	isLoading: false,
	hasLoaded: false,
	error: "",

	loadLocations: async (force = false) => {
		if (get().isLoading || (get().hasLoaded && !force)) return;
		set({ isLoading: true, error: "" });
		try {
			set({
				locations: sortLocations(await organizationLocationsApi.getAll()),
				isLoading: false,
				hasLoaded: true,
			});
		} catch (error) {
			set({
				isLoading: false,
				error: getAsyncErrorMessage(error, "Failed to load known locations."),
			});
		}
	},

	createLocation: async (input) => {
		const created = await organizationLocationsApi.create(input);
		set((state) => ({ locations: sortLocations([...state.locations, created]) }));
		return created;
	},

	updateLocation: async (id, input) => {
		const updated = await organizationLocationsApi.update(id, input);
		set((state) => ({
			locations: sortLocations(
				state.locations.map((location) => location.id === id ? updated : location)
			),
		}));
		return updated;
	},

	deleteLocation: async (id) => {
		await organizationLocationsApi.delete(id);
		set((state) => ({ locations: state.locations.filter((location) => location.id !== id) }));
	},
}));
