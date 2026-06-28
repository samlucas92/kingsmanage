import {
	HubConnectionBuilder,
	HubConnectionState,
	LogLevel,
	type HubConnection,
} from "@microsoft/signalr";
import { create } from "zustand";

import { getRealtimeHubUrl, getStoredAuthToken } from "../services/apiClient";
import type { DirectMessage } from "../types/messages";
import type { ClubNotification } from "../types/notifications";
import { useMessageStore } from "./messages";
import { useNotificationStore } from "./notifications";

export type RealtimeStatus =
	| "disconnected"
	| "connecting"
	| "connected"
	| "reconnecting"
	| "unavailable";

type MessageDeletedEvent = {
	messageId: string;
	threadId: string;
	deletedAt?: string | null;
};

type RealtimeState = {
	status: RealtimeStatus;
	start: () => Promise<void>;
	stop: () => Promise<void>;
};

let connection: HubConnection | null = null;
let retryTimer: number | null = null;

function setStatus(status: RealtimeStatus) {
	useRealtimeStore.setState({ status });
}

function scheduleRetry() {
	if (retryTimer !== null || !getStoredAuthToken()) {
		return;
	}

	retryTimer = window.setTimeout(() => {
		retryTimer = null;
		void useRealtimeStore.getState().start();
	}, 30_000);
}

function registerHandlers(hubConnection: HubConnection) {
	hubConnection.on("NotificationReceived", (notification: ClubNotification) => {
		useNotificationStore.getState().receiveNotification(notification);
	});

	hubConnection.on("NotificationsChanged", () => {
		void useNotificationStore.getState().refreshNotifications();
	});

	hubConnection.on("MessageReceived", (message: DirectMessage) => {
		const messageStore = useMessageStore.getState();
		messageStore.receiveMessage(message);
		void messageStore.loadThreads();

		if (messageStore.selectedThread?.id === message.threadId) {
			void messageStore.openThread(message.threadId);
		}
	});

	hubConnection.on("MessageDeleted", (event: MessageDeletedEvent) => {
		useMessageStore.getState().receiveMessageDeleted(event.messageId, event.deletedAt);
		void useMessageStore.getState().loadThreads();
	});

	hubConnection.on("ThreadChanged", () => {
		void useMessageStore.getState().loadThreads();
	});

	hubConnection.onreconnecting(() => setStatus("reconnecting"));

	hubConnection.onreconnected(() => {
		setStatus("connected");
		void refreshRealtimeData();
	});

	hubConnection.onclose(() => {
		setStatus(getStoredAuthToken() ? "unavailable" : "disconnected");
		scheduleRetry();
	});
}

async function refreshRealtimeData() {
	await Promise.all([
		useNotificationStore.getState().refreshNotifications(),
		useMessageStore.getState().loadThreads(),
	]);
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
	status: "disconnected",

	start: async () => {
		if (!getStoredAuthToken()) {
			set({ status: "disconnected" });
			return;
		}

		if (
			connection?.state === HubConnectionState.Connected ||
			connection?.state === HubConnectionState.Connecting ||
			connection?.state === HubConnectionState.Reconnecting
		) {
			return;
		}

		if (!connection) {
			connection = new HubConnectionBuilder()
				.withUrl(getRealtimeHubUrl(), {
					accessTokenFactory: () => getStoredAuthToken() ?? "",
				})
				.withAutomaticReconnect([0, 2_000, 5_000, 10_000, 30_000])
				.configureLogging(import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning)
				.build();
			registerHandlers(connection);
		}

		set({ status: "connecting" });

		try {
			await connection.start();
			set({ status: "connected" });
			await refreshRealtimeData();
		} catch {
			set({ status: "unavailable" });
			scheduleRetry();
		}
	},

	stop: async () => {
		if (retryTimer !== null) {
			window.clearTimeout(retryTimer);
			retryTimer = null;
		}

		const activeConnection = connection;
		connection = null;
		set({ status: "disconnected" });

		if (activeConnection) {
			await activeConnection.stop();
		}
	},
}));
