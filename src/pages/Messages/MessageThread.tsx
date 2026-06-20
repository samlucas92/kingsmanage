import { useEffect, useRef, useState, type FormEvent } from "react";

import { getInitials, getThreadDisplayName } from "../../services/messageService";
import { useAuthStore } from "../../stores/auth";
import { useMessageStore } from "../../stores/messages";
import { formatDisplayDateTime } from "../../utils/date";

export default function MessageThread({ onBack }: { onBack: () => void }) {
	const currentUser = useAuthStore((state) => state.currentUser);
	const thread = useMessageStore((state) => state.selectedThread);
	const users = useMessageStore((state) => state.users);
	const messages = useMessageStore((state) => state.messages);
	const isLoading = useMessageStore((state) => state.isLoadingThread);
	const isSending = useMessageStore((state) => state.isSending);
	const sendMessage = useMessageStore((state) => state.sendMessage);
	const deleteMessage = useMessageStore((state) => state.deleteMessage);
	const [body, setBody] = useState("");
	const endRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	if (!thread || !currentUser) {
		return (
			<div className="hidden h-full items-center justify-center p-8 text-center text-sm text-slate-500 lg:flex">
				Select a conversation to read and send messages.
			</div>
		);
	}

	const displayName = getThreadDisplayName(thread, currentUser.id, users);

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();
		const trimmedBody = body.trim();
		if (!trimmedBody || isSending) {
			return;
		}

		try {
			await sendMessage(trimmedBody);
			setBody("");
		} catch {
			// The store exposes the API error above the messenger panel.
		}
	}

	return (
		<div className="flex h-[68vh] min-h-[32rem] flex-col bg-white">
		<header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
			<button
				type="button"
				onClick={onBack}
				className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
				aria-label="Back to conversations"
			>
				<ArrowLeftIcon />
			</button>

			<div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-black text-blue-800">
				{getInitials(displayName)}
			</div>
			<div className="min-w-0">
				<h2 className="truncate font-bold text-slate-900">{displayName}</h2>
				<p className="text-xs text-slate-500">Direct message</p>
			</div>
		</header>

		<div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6">
			{isLoading && messages.length === 0 && (
				<p className="text-center text-sm text-slate-500">Loading messages...</p>
			)}

			{!isLoading && messages.length === 0 && (
				<div className="mx-auto mt-16 max-w-sm text-center">
					<p className="font-bold text-slate-800">Start the conversation</p>
					<p className="mt-2 text-sm text-slate-500">Messages are private to the people in this conversation.</p>
				</div>
			)}

			<div className="space-y-3">
				{messages.map((message) => {
					const isMine = message.senderUserId === currentUser.id;
					const isDeleted = message.status === "Deleted";

					return (
						<div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
							<div className={`group max-w-[85%] sm:max-w-[72%] ${isMine ? "items-end" : "items-start"}`}>
								<div className={`rounded-2xl px-4 py-2.5 text-sm leading-6 ${
									isMine ? "rounded-br-md bg-blue-700 text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
								}`}>
									{isDeleted ? <span className="italic opacity-70">Message deleted</span> : message.body}
								</div>
								<div className={`mt-1 flex items-center gap-2 px-1 text-[11px] text-slate-400 ${isMine ? "justify-end" : "justify-start"}`}>
									<span>{formatDisplayDateTime(message.createdAt)}</span>
									{isMine && !isDeleted && (
										<button type="button" onClick={() => void deleteMessage(message.id)} className="font-semibold hover:text-red-600">
											Delete
										</button>
									)}
								</div>
							</div>
						</div>
					);
				})}
				<div ref={endRef} />
			</div>
		</div>

		<form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-3 sm:p-4">
			<div className="flex items-end gap-2">
				<textarea
					value={body}
					onChange={(event) => setBody(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter" && !event.shiftKey) {
							event.preventDefault();
							event.currentTarget.form?.requestSubmit();
						}
					}}
					maxLength={4000}
					rows={1}
					placeholder={`Message ${displayName}`}
					className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
				/>
				<button
					type="submit"
					disabled={!body.trim() || isSending}
					className="h-11 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isSending ? "Sending..." : "Send"}
				</button>
			</div>
		</form>
		</div>
	);
}

function ArrowLeftIcon() {
	return <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}
