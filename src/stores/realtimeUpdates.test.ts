import { beforeEach, describe, expect, it } from "vitest";

import type { DirectMessage } from "../types/messages";
import type { ClubNotification } from "../types/notifications";
import { useMessageStore } from "./messages";
import { useNotificationStore } from "./notifications";

const notification: ClubNotification = {
	id: "notification-1",
	type: "NewDirectMessage",
	sourceType: "Message",
	sourceId: "message-1",
	title: "New message",
	message: "Hello",
	actionPath: "/dashboard?tab=messages",
	status: "Unread",
	isRead: false,
	readAt: null,
	createdAt: "2026-06-28T10:00:00.000Z",
	createdByUserEmail: "coach@example.com",
};

const message: DirectMessage = {
	id: "message-1",
	threadId: "thread-1",
	senderUserId: "user-2",
	senderUserEmail: "coach@example.com",
	body: "Hello",
	status: "Active",
	createdAt: "2026-06-28T10:00:00.000Z",
	deletedAt: null,
};

describe("real-time store updates", () => {
	beforeEach(() => {
		useNotificationStore.getState().reset();
		useMessageStore.getState().reset();
	});

	it("adds a received notification once and increments the unread badge once", () => {
		useNotificationStore.getState().receiveNotification(notification);
		useNotificationStore.getState().receiveNotification(notification);

		expect(useNotificationStore.getState().notifications).toEqual([notification]);
		expect(useNotificationStore.getState().unreadCount).toBe(1);
	});

	it("adds a received message to its open thread without duplicating the sender echo", () => {
		useMessageStore.setState({
			selectedThread: {
				id: "thread-1",
				type: "Direct",
				title: "",
				directPairKey: "",
				participants: [],
				createdAt: "2026-06-28T09:00:00.000Z",
				updatedAt: "2026-06-28T10:00:00.000Z",
			},
		});

		useMessageStore.getState().receiveMessage(message);
		useMessageStore.getState().receiveMessage(message);

		expect(useMessageStore.getState().messages).toEqual([message]);
	});

	it("applies a live deletion to the open conversation", () => {
		useMessageStore.setState({ messages: [message] });

		useMessageStore
			.getState()
			.receiveMessageDeleted(message.id, "2026-06-28T10:05:00.000Z");

		expect(useMessageStore.getState().messages[0]).toMatchObject({
			id: message.id,
			body: "",
			status: "Deleted",
			deletedAt: "2026-06-28T10:05:00.000Z",
		});
	});
});
