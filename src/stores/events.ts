import { create } from "zustand";

import { eventsApi } from "../services/eventsApi";
import type {
	ClubEvent,
	ClubEventAvailabilityStatus,
	CreateClubEventRequest,
	UpdateClubEventRequest,
} from "../types/events";
import { getAsyncErrorMessage } from "./asyncStore";

type EventsState = {
	events: ClubEvent[];
	selectedEvent: ClubEvent | null;
	isLoadingEvents: boolean;
	isLoadingSelectedEvent: boolean;
	hasLoadedEvents: boolean;
	eventsLoadError: string;
	selectedEventLoadError: string;
	loadEvents: (force?: boolean) => Promise<void>;
	loadEvent: (id: string, markSeen?: boolean) => Promise<void>;
	createEvent: (request: CreateClubEventRequest) => Promise<ClubEvent>;
	updateEvent: (id: string, request: UpdateClubEventRequest) => Promise<ClubEvent>;
	deleteEvent: (id: string) => Promise<void>;
	markSeen: (id: string) => Promise<ClubEvent>;
	setAvailability: (id: string, status: ClubEventAvailabilityStatus) => Promise<ClubEvent>;
	setPlayerAvailability: (
		id: string,
		playerId: string,
		status: ClubEventAvailabilityStatus
	) => Promise<ClubEvent>;
	clearEventsLoadError: () => void;
	clearSelectedEvent: () => void;
};

function sortEvents(events: ClubEvent[]) {
	return [...events].sort(
		(firstEvent, secondEvent) =>
			new Date(firstEvent.startDateTime).getTime() -
			new Date(secondEvent.startDateTime).getTime()
	);
}

function replaceEvent(events: ClubEvent[], updatedEvent: ClubEvent) {
	const eventExists = events.some((event) => event.id === updatedEvent.id);

	if (!eventExists) {
		return sortEvents([...events, updatedEvent]);
	}

	return sortEvents(
		events.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))
	);
}

export const useEventStore = create<EventsState>((set, get) => ({
	events: [],
	selectedEvent: null,
	isLoadingEvents: false,
	isLoadingSelectedEvent: false,
	hasLoadedEvents: false,
	eventsLoadError: "",
	selectedEventLoadError: "",

	loadEvents: async (force = false) => {
		if (get().isLoadingEvents && !force) {
			return;
		}

		if (get().hasLoadedEvents && !force) {
			return;
		}

		set({
			isLoadingEvents: true,
			eventsLoadError: "",
		});

		try {
			const events = await eventsApi.getEvents();

			set({
				events: sortEvents(events),
				isLoadingEvents: false,
				hasLoadedEvents: true,
			});
		} catch (error) {
			set({
				isLoadingEvents: false,
				eventsLoadError: getAsyncErrorMessage(error, "Failed to load events."),
			});
		}
	},

	loadEvent: async (id, markSeen = false) => {
		set({
			isLoadingSelectedEvent: true,
			selectedEventLoadError: "",
		});

		try {
			const event = await eventsApi.getEvent(id);
			const selectedEvent = markSeen ? await eventsApi.markSeen(id) : event;

			set((state) => ({
				selectedEvent,
				events: replaceEvent(state.events, selectedEvent),
				hasLoadedEvents: true,
				isLoadingSelectedEvent: false,
			}));
		} catch (error) {
			set({
				isLoadingSelectedEvent: false,
				selectedEventLoadError: getAsyncErrorMessage(error, "Failed to load event."),
			});
		}
	},

	createEvent: async (request) => {
		const createdEvent = await eventsApi.createEvent(request);
		const shouldReloadEvents = Boolean(request.recurrence?.isRecurring);

		set((state) => ({
			events: replaceEvent(state.events, createdEvent),
			hasLoadedEvents: true,
		}));

		if (shouldReloadEvents) {
			await get().loadEvents(true);
		}

		return createdEvent;
	},

	updateEvent: async (id, request) => {
		const updatedEvent = await eventsApi.updateEvent(id, request);

		set((state) => ({
			events: replaceEvent(state.events, updatedEvent),
			selectedEvent:
				state.selectedEvent?.id === updatedEvent.id ? updatedEvent : state.selectedEvent,
		}));

		return updatedEvent;
	},

	deleteEvent: async (id) => {
		await eventsApi.deleteEvent(id);

		set((state) => ({
			events: state.events.filter((event) => event.id !== id),
			selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent,
		}));
	},

	markSeen: async (id) => {
		const updatedEvent = await eventsApi.markSeen(id);

		set((state) => ({
			events: replaceEvent(state.events, updatedEvent),
			selectedEvent:
				state.selectedEvent?.id === updatedEvent.id ? updatedEvent : state.selectedEvent,
		}));

		return updatedEvent;
	},

	setAvailability: async (id, status) => {
		const updatedEvent = await eventsApi.setAvailability(id, { status });

		set((state) => ({
			events: replaceEvent(state.events, updatedEvent),
			selectedEvent:
				state.selectedEvent?.id === updatedEvent.id ? updatedEvent : state.selectedEvent,
		}));

		return updatedEvent;
	},

	setPlayerAvailability: async (id, playerId, status) => {
		const updatedEvent = await eventsApi.setPlayerAvailability(id, playerId, { status });

		set((state) => ({
			events: replaceEvent(state.events, updatedEvent),
			selectedEvent:
				state.selectedEvent?.id === updatedEvent.id ? updatedEvent : state.selectedEvent,
		}));

		return updatedEvent;
	},

	clearEventsLoadError: () => set({ eventsLoadError: "" }),

	clearSelectedEvent: () =>
		set({
			selectedEvent: null,
			selectedEventLoadError: "",
		}),
}));
