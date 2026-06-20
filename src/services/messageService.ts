import type { MessageThread, MessageUser } from "../types/messages";

export function getOtherParticipantId(thread: MessageThread, currentUserId: string) {
	return thread.participants.find((participant) => participant.userId !== currentUserId)?.userId;
}

export function getThreadDisplayName(
	thread: MessageThread,
	currentUserId: string,
	users: MessageUser[]
) {
	if (thread.title) {
		return thread.title;
	}

	const otherUserId = getOtherParticipantId(thread, currentUserId);
	return users.find((user) => user.id === otherUserId)?.email ?? "Direct message";
}

export function getInitials(value: string) {
	const name = value.split("@")[0] ?? value;
	return name
		.split(/[._\-\s]+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("") || "?";
}
