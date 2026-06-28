import { useEffect, useMemo, useState } from "react";

import { getInitials, getThreadDisplayName } from "../../services/messageService";
import { useAuthStore } from "../../stores/auth";
import { useMessageStore } from "../../stores/messages";
import { useRealtimeStore } from "../../stores/realtime";
import { formatDisplayDateTime } from "../../utils/date";
import MessageThread from "./MessageThread";

const THREAD_POLL_INTERVAL_MS = 20_000;

export default function Messages({ requestedThreadId }: { requestedThreadId?: string | null }) {
	const currentUser = useAuthStore((state) => state.currentUser);
	const threads = useMessageStore((state) => state.threads);
	const users = useMessageStore((state) => state.users);
	const selectedThread = useMessageStore((state) => state.selectedThread);
	const isLoadingThreads = useMessageStore((state) => state.isLoadingThreads);
	const error = useMessageStore((state) => state.error);
	const loadThreads = useMessageStore((state) => state.loadThreads);
	const loadUsers = useMessageStore((state) => state.loadUsers);
	const openThread = useMessageStore((state) => state.openThread);
	const startDirectThread = useMessageStore((state) => state.startDirectThread);
	const clearSelectedThread = useMessageStore((state) => state.clearSelectedThread);
	const clearError = useMessageStore((state) => state.clearError);
	const [isStartingConversation, setIsStartingConversation] = useState(false);
	const [search, setSearch] = useState("");
	const [isStarting, setIsStarting] = useState(false);
	const realtimeStatus = useRealtimeStore((state) => state.status);

	useEffect(() => {
		void loadThreads();
		void loadUsers();
	}, [loadThreads, loadUsers]);

	useEffect(() => {
		if (requestedThreadId && selectedThread?.id !== requestedThreadId) {
			void openThread(requestedThreadId);
		}
	}, [openThread, requestedThreadId, selectedThread?.id]);

	useEffect(() => {
		if (realtimeStatus === "connected") {
			return;
		}

		const intervalId = window.setInterval(() => {
			void loadThreads();
			if (selectedThread) {
				void openThread(selectedThread.id);
			}
		}, THREAD_POLL_INTERVAL_MS);

		return () => window.clearInterval(intervalId);
	}, [loadThreads, openThread, realtimeStatus, selectedThread]);

	const availableUsers = useMemo(() => {
		const value = search.trim().toLowerCase();
		return users.filter((user) => !value || user.email.toLowerCase().includes(value));
	}, [search, users]);

	async function handleStart(userId: string) {
		setIsStarting(true);
		try {
			await startDirectThread(userId);
			setIsStartingConversation(false);
			setSearch("");
		} finally {
			setIsStarting(false);
		}
	}

	return (
		<section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
		{error && (
			<div className="flex items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
				<span>{error}</span>
				<button type="button" onClick={clearError} className="font-bold">Dismiss</button>
			</div>
		)}

		<div className="grid lg:grid-cols-[21rem_minmax(0,1fr)]">
			<aside className={`${selectedThread ? "hidden lg:block" : "block"} h-[68vh] min-h-[32rem] border-r border-slate-200 bg-white`}>
				<div className="border-b border-slate-200 p-4">
					<div className="flex items-center justify-between gap-3">
						<div>
							<h1 className="text-xl font-black text-slate-900">Messages</h1>
							<p className="text-xs text-slate-500">Your direct conversations</p>
						</div>
						<button
							type="button"
							onClick={() => setIsStartingConversation((value) => !value)}
							className="rounded-xl bg-blue-700 px-3 py-2 text-sm font-bold text-white hover:bg-blue-800"
						>
							New
						</button>
					</div>

					{isStartingConversation && (
						<div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
							<label className="text-xs font-bold uppercase tracking-wide text-blue-900" htmlFor="message-user-search">Start a conversation</label>
							<input
								id="message-user-search"
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder="Search by email"
								className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
							/>
							<div className="mt-2 max-h-40 overflow-y-auto">
								{availableUsers.map((user) => (
									<button
										key={user.id}
										type="button"
										disabled={isStarting}
										onClick={() => void handleStart(user.id)}
										className="block w-full truncate rounded-lg px-2 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
									>
										{user.email} <span className="text-xs font-normal text-slate-400">· {user.role}</span>
									</button>
								))}
							</div>
						</div>
					)}
				</div>

				<div className="h-[calc(100%-5.6rem)] overflow-y-auto">
					{isLoadingThreads && threads.length === 0 && <p className="p-5 text-sm text-slate-500">Loading conversations...</p>}
					{!isLoadingThreads && threads.length === 0 && (
						<div className="p-6 text-center text-sm text-slate-500">
							No conversations yet. Choose <strong>New</strong> to message someone.
						</div>
					)}

					{currentUser && threads.map((summary) => {
						const displayName = getThreadDisplayName(summary.thread, currentUser.id, users);
						const isSelected = selectedThread?.id === summary.thread.id;
						return (
							<button
								key={summary.thread.id}
								type="button"
								onClick={() => void openThread(summary.thread.id)}
								className={`flex w-full gap-3 border-b border-slate-100 px-4 py-4 text-left transition ${isSelected ? "bg-blue-50" : "hover:bg-slate-50"}`}
							>
								<div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-200 text-sm font-black text-slate-700">{getInitials(displayName)}</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-start justify-between gap-2">
										<p className={`truncate text-sm ${summary.unreadCount > 0 ? "font-black text-slate-900" : "font-bold text-slate-700"}`}>{displayName}</p>
										{summary.lastMessage && <span className="shrink-0 text-[10px] text-slate-400">{formatDisplayDateTime(summary.lastMessage.createdAt)}</span>}
									</div>
									<div className="mt-1 flex items-center gap-2">
										<p className="min-w-0 flex-1 truncate text-xs text-slate-500">{summary.lastMessage?.status === "Deleted" ? "Message deleted" : summary.lastMessage?.body || "No messages yet"}</p>
										{summary.unreadCount > 0 && <span className="min-w-5 rounded-full bg-blue-700 px-1.5 py-0.5 text-center text-[10px] font-black text-white">{summary.unreadCount}</span>}
									</div>
								</div>
							</button>
						);
					})}
				</div>
			</aside>

			<div className={`${selectedThread ? "block" : "hidden lg:block"}`}>
				<MessageThread onBack={clearSelectedThread} />
			</div>
		</div>
	</section>
	);
}
