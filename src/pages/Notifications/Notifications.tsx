import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import EmptyState from "../../components/compositions/EmptyState";
import PanelCard from "../../components/compositions/PanelCard";
import { useNotificationStore } from "../../stores/notifications";
import type { ClubNotification } from "../../types/notifications";
import { formatDisplayDateTime } from "../../utils/date";
import { getNotificationActionPath, getNotificationSourceLabel } from "../../utils/notifications";

type NotificationFilter = "all" | "unread";

export default function Notifications() {
	const navigate = useNavigate();
	const [filter, setFilter] = useState<NotificationFilter>("all");

	const notifications = useNotificationStore((state) => state.notifications);
	const unreadCount = useNotificationStore((state) => state.unreadCount);
	const isLoadingNotifications = useNotificationStore((state) => state.isLoadingNotifications);
	const error = useNotificationStore((state) => state.error);
	const loadNotifications = useNotificationStore((state) => state.loadNotifications);
	const loadUnreadCount = useNotificationStore((state) => state.loadUnreadCount);
	const markRead = useNotificationStore((state) => state.markRead);
	const markAllRead = useNotificationStore((state) => state.markAllRead);

	useEffect(() => {
		void loadNotifications(true);
		void loadUnreadCount();
	}, [loadNotifications, loadUnreadCount]);

	const visibleNotifications = useMemo(() => {
		if (filter === "unread") {
			return notifications.filter((notification) => !notification.isRead);
		}

		return notifications;
	}, [filter, notifications]);

	const handleOpenNotification = async (notification: ClubNotification) => {
		if (!notification.isRead) {
			await markRead(notification.id);
		}

		navigate(getNotificationActionPath(notification));
	};

	const handleMarkAllRead = async () => {
		await markAllRead();
	};

	return (
		<div className="space-y-4">
			<PanelCard
				title="Notifications"
				description="Club updates, posts and event changes that need your attention."
				action={
					unreadCount > 0 ? (
						<button
							type="button"
							onClick={handleMarkAllRead}
							className="rounded-xl bg-yepset-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-yepset-800"
						>
							Mark all read
						</button>
					) : null
				}
			>
				<div className="flex flex-wrap gap-2">
					<FilterButton
						label="All"
						isActive={filter === "all"}
						onClick={() => setFilter("all")}
					/>
					<FilterButton
						label={`Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
						isActive={filter === "unread"}
						onClick={() => setFilter("unread")}
					/>
				</div>

				{error && (
					<div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
						{error}
					</div>
				)}

				{isLoadingNotifications && (
					<div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
						Loading notifications...
					</div>
				)}

				{!isLoadingNotifications && visibleNotifications.length === 0 && (
					<div className="mt-5">
						<EmptyState
							title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
							message={
								filter === "unread"
									? "You are caught up. Anything new will appear here."
									: "New club posts and event updates will appear here."
							}
						/>
					</div>
				)}

				{!isLoadingNotifications && visibleNotifications.length > 0 && (
					<div className="mt-5 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
						{visibleNotifications.map((notification) => (
							<button
								key={notification.id}
								type="button"
								onClick={() => void handleOpenNotification(notification)}
								className={`block w-full px-4 py-4 text-left transition hover:bg-slate-50 ${
									notification.isRead ? "bg-white" : "bg-yepset-50"
								}`}
							>
								<div className="flex gap-3">
									<span
										className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
											notification.isRead ? "bg-slate-300" : "bg-yepset-600"
										}`}
									/>

									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-start justify-between gap-2">
											<div>
												<p className="text-sm font-bold text-slate-900">
													{notification.title}
												</p>
												<p className="mt-1 text-sm text-slate-600">
													{notification.message}
												</p>
											</div>

											<span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
												{getNotificationSourceLabel(notification.sourceType)}
											</span>
										</div>

										<p className="mt-3 text-xs font-semibold text-slate-400">
											{formatDisplayDateTime(notification.createdAt)}
										</p>
									</div>
								</div>
							</button>
						))}
					</div>
				)}
			</PanelCard>
		</div>
	);
}

function FilterButton({
	label,
	isActive,
	onClick,
}: {
	label: string;
	isActive: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
				isActive
					? "border-yepset-700 bg-yepset-700 text-white"
					: "border-slate-200 bg-white text-slate-700 hover:border-yepset-200 hover:text-yepset-900"
			}`}
		>
			{label}
		</button>
	);
}
