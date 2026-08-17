export type NotificationType = "NewPost" | "NewEvent" | "EventUpdated" | "NewDirectMessage" | "OperationalRoleAssigned" | "OperationalTaskAssigned" | "OperationalTaskDue" | "OperationalTaskOverdue" | "HandoverStarted" | "HandoverActionRequired" | "HandoverReadyForReview" | "HandoverCompleted" | "OrganizationDocumentUnavailable";
export type NotificationSourceType = "Post" | "Event" | "Match" | "Message" | "Finance" | "System" | "Handover" | "OperationalTask" | "OperationalRole" | "OrganizationDocument";
export type NotificationStatus = "Unread" | "Read";

export type ClubNotification = {
	id: string;
	type: NotificationType;
	sourceType: NotificationSourceType;
	sourceId?: string | null;
	title: string;
	message: string;
	actionPath: string;
	status: NotificationStatus;
	isRead: boolean;
	readAt?: string | null;
	createdAt: string;
	createdByUserEmail: string;
};

export type UnreadNotificationCountResponse = {
	unreadCount: number;
};

export type MarkAllNotificationsReadResponse = {
	updatedCount: number;
};
