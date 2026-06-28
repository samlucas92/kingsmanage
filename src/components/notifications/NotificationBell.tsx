import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuthStore } from "../../stores/auth";
import { useNotificationStore } from "../../stores/notifications";
import type { ClubNotification } from "../../types/notifications";
import { formatDisplayDateTime } from "../../utils/date";
import { getNotificationActionPath } from "../../utils/notifications";

const POLL_INTERVAL_MS = 60_000;
const PREVIEW_LIMIT = 5;

export default function NotificationBell() {
	const navigate = useNavigate();
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [isOpen, setIsOpen] = useState(false);

	const currentUser = useAuthStore((state) => state.currentUser);
	const notifications = useNotificationStore((state) => state.notifications);
	const unreadCount = useNotificationStore((state) => state.unreadCount);
	const isLoadingNotifications = useNotificationStore((state) => state.isLoadingNotifications);
	const error = useNotificationStore((state) => state.error);
	const loadNotifications = useNotificationStore((state) => state.loadNotifications);
	const loadUnreadCount = useNotificationStore((state) => state.loadUnreadCount);
	const markRead = useNotificationStore((state) => state.markRead);
	const markAllRead = useNotificationStore((state) => state.markAllRead);
	const resetNotifications = useNotificationStore((state) => state.reset);

	useEffect(() => {
		if (!currentUser) {
			resetNotifications();
			return;
		}

		void loadUnreadCount();

		const intervalId = window.setInterval(() => {
			void loadUnreadCount();
		}, POLL_INTERVAL_MS);

		return () => window.clearInterval(intervalId);
	}, [currentUser, loadUnreadCount, resetNotifications]);

	useEffect(() => {
		if (!isOpen || !currentUser) {
			return;
		}

		void loadNotifications(true);
	}, [currentUser, isOpen, loadNotifications]);

	useEffect(() => {
		function handlePointerDown(event: MouseEvent) {
			if (!containerRef.current) {
				return;
			}

			if (!containerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}

		if (isOpen) {
			window.addEventListener("mousedown", handlePointerDown);
		}

		return () => window.removeEventListener("mousedown", handlePointerDown);
	}, [isOpen]);

	const visibleNotifications = notifications.slice(0, PREVIEW_LIMIT);

	const handleOpenNotification = async (notification: ClubNotification) => {
		if (!notification.isRead) {
			await markRead(notification.id);
		}

		setIsOpen(false);

		navigate(getNotificationActionPath(notification));
	};

	const handleMarkAllRead = async () => {
		await markAllRead();
	};

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				onClick={() => setIsOpen((currentValue) => !currentValue)}
				className="relative grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-yepset-200 hover:bg-yepset-50 hover:text-yepset-800"
				aria-label="Notifications"
			>
				<BellOutlineIcon />
				{unreadCount > 0 && (
					<span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-xs font-bold text-white">
						{unreadCount > 99 ? "99+" : unreadCount}
					</span>
				)}
			</button>

			{isOpen && (
				<div className="absolute right-0 z-30 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
					<div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
						<div>
							<p className="text-sm font-bold text-slate-900">Notifications</p>
							<p className="text-xs text-slate-500">
								{unreadCount === 0 ? "No unread notifications" : `${unreadCount} unread`}
							</p>
						</div>

						{unreadCount > 0 && (
							<button
								type="button"
								onClick={handleMarkAllRead}
								className="text-xs font-bold text-blue-700 hover:text-blue-900"
							>
								Mark all read
							</button>
						)}
					</div>

					{error && (
						<div className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">
							{error}
						</div>
					)}

					<div className="max-h-96 overflow-y-auto">
						{isLoadingNotifications && (
							<div className="px-4 py-6 text-sm text-slate-500">Loading notifications...</div>
						)}

						{!isLoadingNotifications && visibleNotifications.length === 0 && (
							<div className="px-4 py-6 text-sm text-slate-500">You have no notifications yet.</div>
						)}

						{!isLoadingNotifications &&
							visibleNotifications.map((notification) => (
								<button
									key={notification.id}
									type="button"
									onClick={() => void handleOpenNotification(notification)}
									className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50 ${
										notification.isRead ? "bg-white" : "bg-blue-50"
									}`}
								>
									<div className="flex gap-3">
										<span
											className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
												notification.isRead ? "bg-slate-300" : "bg-blue-600"
											}`}
										/>

										<div className="min-w-0 flex-1">
											<p className="line-clamp-1 text-sm font-bold text-slate-900">
												{notification.title}
											</p>
											<p className="mt-1 line-clamp-2 text-xs text-slate-600">
												{notification.message}
											</p>
											<p className="mt-2 text-[11px] font-semibold text-slate-400">
												{formatDisplayDateTime(notification.createdAt)}
											</p>
										</div>
									</div>
								</button>
							))}
					</div>

					<div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-center">
						<Link
							to="/notifications"
							onClick={() => setIsOpen(false)}
							className="text-sm font-bold text-blue-700 hover:text-blue-900"
						>
							View all notifications
						</Link>
					</div>
				</div>
			)}
		</div>
	);
}

function BellOutlineIcon() {
	return (
		<svg
			aria-hidden="true"
			className="h-5 w-5"
			fill="none"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M12 4.25c-3.04 0-5.5 2.46-5.5 5.5v2.85c0 .86-.3 1.69-.86 2.35L4.5 16.3c-.37.44-.06 1.1.52 1.1h13.96c.58 0 .89-.66.52-1.1l-1.14-1.35a3.64 3.64 0 0 1-.86-2.35V9.75c0-3.04-2.46-5.5-5.5-5.5Z"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.9"
			/>
			<path
				d="M9.75 19.25a2.25 2.25 0 0 0 4.5 0"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.9"
			/>
			<path
				d="M12 2.75v1.5"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="1.9"
			/>
		</svg>
	);
}
