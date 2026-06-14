import { apiClient } from "./apiClient";
import type {
	ClubEvent,
	CreateClubEventRequest,
	UpdateClubEventAvailabilityRequest,
	UpdateClubEventRequest,
} from "../types/events";

export const eventsApi = {
	getEvents: () => apiClient.get<ClubEvent[]>("/events"),

	getEvent: (id: string) => apiClient.get<ClubEvent>(`/events/${id}`),

	createEvent: (request: CreateClubEventRequest) =>
		apiClient.post<ClubEvent>("/events", request),

	updateEvent: (id: string, request: UpdateClubEventRequest) =>
		apiClient.put<ClubEvent>(`/events/${id}`, request),

	deleteEvent: (id: string) => apiClient.delete<void>(`/events/${id}`),

	markSeen: (id: string) => apiClient.put<ClubEvent>(`/events/${id}/seen`, {}),

	setAvailability: (id: string, request: UpdateClubEventAvailabilityRequest) =>
		apiClient.put<ClubEvent>(`/events/${id}/availability`, request),

	setPlayerAvailability: (
		id: string,
		playerId: string,
		request: UpdateClubEventAvailabilityRequest
	) => apiClient.put<ClubEvent>(`/events/${id}/availability/${playerId}`, request),
};
