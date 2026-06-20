import type { UserRole } from "./auth";

export type MessageThreadType = "Direct" | "Group" | "Team" | "Event";
export type MessageStatus = "Active" | "Deleted";

export type MessageThreadParticipant = {
	userId: string;
	joinedAt: string;
	lastReadAt?: string | null;
};

export type MessageThread = {
	id: string;
	type: MessageThreadType;
	title: string;
	directPairKey: string;
	teamId?: string | null;
	eventId?: string | null;
	participants: MessageThreadParticipant[];
	createdAt: string;
	updatedAt: string;
};

export type DirectMessage = {
	id: string;
	threadId: string;
	senderUserId: string;
	senderUserEmail: string;
	body: string;
	status: MessageStatus;
	createdAt: string;
	deletedAt?: string | null;
};

export type MessageThreadSummary = {
	thread: MessageThread;
	lastMessage?: DirectMessage | null;
	unreadCount: number;
};

export type MessageThreadDetail = {
	thread: MessageThread;
	messages: DirectMessage[];
};

export type MessageUser = {
	id: string;
	email: string;
	role: UserRole;
	playerId?: string | null;
};
