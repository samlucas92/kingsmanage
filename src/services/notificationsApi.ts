import { apiClient } from "./apiClient";
import type {
	ClubNotification,
	MarkAllNotificationsReadResponse,
	UnreadNotificationCountResponse,
} from "../types/notifications";

export const notificationsApi = {
	getMine: (unreadOnly = false) =>
		apiClient.get<ClubNotification[]>(`/notifications/mine?unreadOnly=${unreadOnly}`),

	getUnreadCount: () =>
		apiClient.get<UnreadNotificationCountResponse>("/notifications/unread-count"),

	markRead: (id: string) =>
		apiClient.post<ClubNotification>(`/notifications/${id}/mark-read`, {}),

	markAllRead: () =>
		apiClient.post<MarkAllNotificationsReadResponse>("/notifications/mark-all-read", {}),
};
