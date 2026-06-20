import type { ClubNotification, NotificationSourceType, NotificationType } from "../types/notifications";

export function getNotificationActionPath(notification: ClubNotification) {
	if (notification.sourceType === "Post" && notification.sourceId) {
		return `/posts/${notification.sourceId}`;
	}

	if (notification.sourceType === "Event" && notification.sourceId) {
		return `/events/${notification.sourceId}`;
	}

	if (notification.sourceType === "Match" && notification.sourceId) {
		return `/matches/${notification.sourceId}`;
	}

	if (notification.sourceType === "Message") {
		return notification.actionPath || "/dashboard?tab=messages";
	}

	return notification.actionPath || "/";
}

export function getNotificationTypeLabel(type: NotificationType) {
	switch (type) {
		case "NewPost":
			return "New post";
		case "NewEvent":
			return "New event";
		case "EventUpdated":
			return "Event updated";
		case "NewDirectMessage":
			return "New message";
		default:
			return type;
	}
}

export function getNotificationSourceLabel(sourceType: NotificationSourceType) {
	switch (sourceType) {
		case "Post":
			return "Post";
		case "Event":
			return "Event";
		case "Match":
			return "Match";
		case "Message":
			return "Message";
		case "Finance":
			return "Finance";
		case "System":
			return "System";
		default:
			return sourceType;
	}
}
