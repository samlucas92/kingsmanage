import { create } from "zustand";

import { messagesApi } from "../services/messagesApi";
import type {
	DirectMessage,
	MessageThread,
	MessageThreadSummary,
	MessageUser,
} from "../types/messages";

type MessagesState = {
	threads: MessageThreadSummary[];
	users: MessageUser[];
	selectedThread: MessageThread | null;
	messages: DirectMessage[];
	isLoadingThreads: boolean;
	isLoadingThread: boolean;
	isSending: boolean;
	error: string;
	loadThreads: () => Promise<void>;
	loadUsers: () => Promise<void>;
	openThread: (threadId: string, markAsRead?: boolean) => Promise<void>;
	startDirectThread: (userId: string) => Promise<MessageThread>;
	sendMessage: (body: string) => Promise<void>;
	deleteMessage: (messageId: string) => Promise<void>;
	clearSelectedThread: () => void;
	clearError: () => void;
	reset: () => void;
};

function getErrorMessage(error: unknown, fallback: string) {
	return error instanceof Error ? error.message : fallback;
}

export const useMessageStore = create<MessagesState>((set, get) => ({
	threads: [],
	users: [],
	selectedThread: null,
	messages: [],
	isLoadingThreads: false,
	isLoadingThread: false,
	isSending: false,
	error: "",

	loadThreads: async () => {
		if (get().isLoadingThreads) {
			return;
		}

		set({ isLoadingThreads: true });
		try {
			const threads = await messagesApi.getThreads();
			set({ threads, isLoadingThreads: false, error: "" });
		} catch (error) {
			set({
				isLoadingThreads: false,
				error: getErrorMessage(error, "Failed to load conversations."),
			});
		}
	},

	loadUsers: async () => {
		try {
			set({ users: await messagesApi.getUsers(), error: "" });
		} catch (error) {
			set({ error: getErrorMessage(error, "Failed to load message users.") });
		}
	},

	openThread: async (threadId, markAsRead = true) => {
		if (get().isLoadingThread && get().selectedThread?.id === threadId) {
			return;
		}

		set({ isLoadingThread: true });
		try {
			const detail = await messagesApi.getThread(threadId);
			set({
				selectedThread: detail.thread,
				messages: detail.messages,
				isLoadingThread: false,
				error: "",
			});

			if (markAsRead) {
				await messagesApi.markRead(threadId);
				set((state) => ({
					threads: state.threads.map((summary) =>
						summary.thread.id === threadId ? { ...summary, unreadCount: 0 } : summary
					),
				}));
			}
		} catch (error) {
			set({
				isLoadingThread: false,
				error: getErrorMessage(error, "Failed to load this conversation."),
			});
		}
	},

	startDirectThread: async (userId) => {
		const thread = await messagesApi.createDirectThread(userId);
		await get().loadThreads();
		await get().openThread(thread.id);
		return thread;
	},

	sendMessage: async (body) => {
		const threadId = get().selectedThread?.id;
		if (!threadId || get().isSending) {
			return;
		}

		set({ isSending: true });
		try {
			const message = await messagesApi.sendMessage(threadId, body);
			set((state) => ({ messages: [...state.messages, message], isSending: false, error: "" }));
			await get().loadThreads();
		} catch (error) {
			set({
				isSending: false,
				error: getErrorMessage(error, "Failed to send message."),
			});
			throw error;
		}
	},

	deleteMessage: async (messageId) => {
		try {
			await messagesApi.deleteMessage(messageId);
			set((state) => ({
				messages: state.messages.map((message) =>
					message.id === messageId
						? { ...message, body: "", status: "Deleted", deletedAt: new Date().toISOString() }
						: message
				),
			}));
		} catch (error) {
			set({ error: getErrorMessage(error, "Failed to delete message.") });
		}
	},

	clearSelectedThread: () => set({ selectedThread: null, messages: [] }),
	clearError: () => set({ error: "" }),
	reset: () => set({
		threads: [],
		users: [],
		selectedThread: null,
		messages: [],
		isLoadingThreads: false,
		isLoadingThread: false,
		isSending: false,
		error: "",
	}),
}));
