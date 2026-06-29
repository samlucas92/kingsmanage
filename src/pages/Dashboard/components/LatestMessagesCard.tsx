import { Link } from "react-router-dom";

import { getThreadDisplayName } from "../../../services/messageService";
import { useAuthStore } from "../../../stores/auth";
import { useMessageStore } from "../../../stores/messages";
import { formatDisplayDateTime } from "../../../utils/date";
import { richTextToPlainText } from "../../../utils/richText";
import AttentionCard from "./AttentionCard";

export default function LatestMessagesCard() {
	const currentUser = useAuthStore((state) => state.currentUser);
	const threads = useMessageStore((state) => state.threads);
	const users = useMessageStore((state) => state.users);
	const latest = threads[0];

	return (
		<AttentionCard title="Latest message" tone={latest ? "neutral" : "muted"}>
			{latest && currentUser ? (
				<Link
					to={`/dashboard?tab=messages&threadId=${latest.thread.id}`}
					className="block rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50"
				>
					<div className="flex items-center justify-between gap-3">
						<p className="truncate font-bold text-slate-900">{getThreadDisplayName(latest.thread, currentUser.id, users)}</p>
						{latest.unreadCount > 0 && <span className="rounded-full bg-blue-700 px-2 py-0.5 text-xs font-black text-white">{latest.unreadCount}</span>}
					</div>
					<p className="mt-2 truncate text-sm text-slate-600">{latest.lastMessage?.status === "Deleted" ? "Message deleted" : latest.lastMessage?.body ? richTextToPlainText(latest.lastMessage.body) : "No messages yet"}</p>
					{latest.lastMessage && <p className="mt-2 text-xs font-semibold text-slate-400">{formatDisplayDateTime(latest.lastMessage.createdAt)}</p>}
				</Link>
			) : (
				<div>
					<p className="text-sm text-slate-500">No direct messages yet.</p>
					<Link to="/dashboard?tab=messages" className="mt-3 inline-flex text-sm font-bold text-blue-700 hover:text-blue-900">Open messages</Link>
				</div>
			)}
		</AttentionCard>
	);
}
