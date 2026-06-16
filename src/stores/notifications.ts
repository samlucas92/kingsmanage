import { create } from "zustand";

import { notificationsApi } from "../services/notificationsApi";
import type { ClubNotification } from "../types/notifications";

type NotificationsState = {
	notifications: ClubNotification[];
	unreadCount: number;
	isLoadingNotifications: boolean;
	isLoadingUnreadCount: boolean;
	hasLoadedNotifications: boolean;
	error: string;
	loadNotifications: (force?: boolean, unreadOnly?: boolean) => Promise<void>;
	loadUnreadCount: () => Promise<void>;
	markRead: (id: string) => Promise<ClubNotification | null>;
	markAllRead: () => Promise<void>;
	reset: () => void;
	clearError: () => void;
};

function sortNotifications(notifications: ClubNotification[]) {
	return [...notifications].sort(
		(firstNotification, secondNotification) =>
			new Date(secondNotification.createdAt).getTime() -
			new Date(firstNotification.createdAt).getTime()
	);
}

function replaceNotification(
	notifications: ClubNotification[],
	updatedNotification: ClubNotification
) {
	const notificationExists = notifications.some(
		(notification) => notification.id === updatedNotification.id
	);

	if (!notificationExists) {
		return sortNotifications([...notifications, updatedNotification]);
	}

	return sortNotifications(
		notifications.map((notification) =>
			notification.id === updatedNotification.id ? updatedNotification : notification
		)
	);
}

function countUnread(notifications: ClubNotification[]) {
	return notifications.filter((notification) => !notification.isRead).length;
}

export const useNotificationStore = create<NotificationsState>((set, get) => ({
	notifications: [],
	unreadCount: 0,
	isLoadingNotifications: false,
	isLoadingUnreadCount: false,
	hasLoadedNotifications: false,
	error: "",

	loadNotifications: async (force = false, unreadOnly = false) => {
		if (get().isLoadingNotifications) {
			return;
		}

		if (get().hasLoadedNotifications && !force && !unreadOnly) {
			return;
		}

		set({
			isLoadingNotifications: true,
			error: "",
		});

		try {
			const notifications = await notificationsApi.getMine(unreadOnly);
			const sortedNotifications = sortNotifications(notifications);

			set({
				notifications: sortedNotifications,
				unreadCount: unreadOnly ? get().unreadCount : countUnread(sortedNotifications),
				isLoadingNotifications: false,
				hasLoadedNotifications: !unreadOnly,
			});
		} catch (error) {
			set({
				isLoadingNotifications: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to load notifications.",
			});
		}
	},

	loadUnreadCount: async () => {
		if (get().isLoadingUnreadCount) {
			return;
		}

		set({ isLoadingUnreadCount: true });

		try {
			const response = await notificationsApi.getUnreadCount();

			set({
				unreadCount: response.unreadCount,
				isLoadingUnreadCount: false,
			});
		} catch (error) {
			set({
				isLoadingUnreadCount: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to load notification count.",
			});
		}
	},

	markRead: async (id) => {
		try {
			const updatedNotification = await notificationsApi.markRead(id);

			set((state) => {
				const notifications = replaceNotification(
					state.notifications,
					updatedNotification
				);

				return {
					notifications,
					unreadCount: countUnread(notifications),
				};
			});

			return updatedNotification;
		} catch (error) {
			set({
				error:
					error instanceof Error
						? error.message
						: "Failed to mark notification as read.",
			});

			return null;
		}
	},

	markAllRead: async () => {
		try {
			await notificationsApi.markAllRead();

			set((state) => ({
				notifications: state.notifications.map((notification) => ({
					...notification,
					status: "Read",
					isRead: true,
					readAt: notification.readAt ?? new Date().toISOString(),
				})),
				unreadCount: 0,
			}));
		} catch (error) {
			set({
				error:
					error instanceof Error
						? error.message
						: "Failed to mark notifications as read.",
			});
		}
	},

	reset: () =>
		set({
			notifications: [],
			unreadCount: 0,
			isLoadingNotifications: false,
			isLoadingUnreadCount: false,
			hasLoadedNotifications: false,
			error: "",
		}),

	clearError: () => set({ error: "" }),
}));
