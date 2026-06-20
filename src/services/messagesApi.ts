import { apiClient } from "./apiClient";
import type {
	DirectMessage,
	MessageThread,
	MessageThreadDetail,
	MessageThreadSummary,
	MessageUser,
} from "../types/messages";

export const messagesApi = {
	getUsers: () => apiClient.get<MessageUser[]>("/messages/users"),
	getThreads: () => apiClient.get<MessageThreadSummary[]>("/messages/threads"),
	createDirectThread: (userId: string) =>
		apiClient.post<MessageThread>("/messages/threads/direct", { userId }),
	getThread: (threadId: string) =>
		apiClient.get<MessageThreadDetail>(`/messages/threads/${threadId}`),
	sendMessage: (threadId: string, body: string) =>
		apiClient.post<DirectMessage>(`/messages/threads/${threadId}/messages`, { body }),
	markRead: (threadId: string) =>
		apiClient.post<MessageThread>(`/messages/threads/${threadId}/mark-read`, {}),
	deleteMessage: (messageId: string) => apiClient.delete<void>(`/messages/${messageId}`),
};
