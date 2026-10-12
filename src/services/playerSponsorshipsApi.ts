import { apiClient } from "./apiClient";
import type {
	PlayerSponsorship,
	SubmitPlayerSponsorshipRequest,
	UpdatePlayerSponsorshipRequest,
} from "../types/playerSponsorships";

export const playerSponsorshipsApi = {
	getAll: () => apiClient.get<PlayerSponsorship[]>("/player-sponsorships"),
	getById: (id: string) => apiClient.get<PlayerSponsorship>(`/player-sponsorships/${encodeURIComponent(id)}`),
	getPublic: (goCode: string) => apiClient.get<PlayerSponsorship>(`/player-sponsorships/go/${encodeURIComponent(goCode)}`),
	create: (playerId: string) => apiClient.post<PlayerSponsorship>("/player-sponsorships", { playerId }),
	update: (id: string, request: UpdatePlayerSponsorshipRequest) =>
		apiClient.put<PlayerSponsorship>(`/player-sponsorships/${encodeURIComponent(id)}`, request),
	submit: (goCode: string, request: SubmitPlayerSponsorshipRequest) =>
		apiClient.post<PlayerSponsorship>(`/player-sponsorships/go/${encodeURIComponent(goCode)}/submit`, request),
	delete: (id: string) => apiClient.delete<void>(`/player-sponsorships/${encodeURIComponent(id)}`),
};
