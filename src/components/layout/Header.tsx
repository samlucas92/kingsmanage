import { useLocation } from "react-router-dom";

import NotificationBell from "../notifications/NotificationBell";
import ProfileSummary from "./ProfileSummary";

const pageTitles: { matcher: (pathname: string) => boolean; title: string }[] = [
	{ matcher: (pathname) => pathname === "/" || pathname === "/dashboard", title: "Dashboard" },
	{ matcher: (pathname) => pathname === "/players", title: "Players" },
	{ matcher: (pathname) => pathname.startsWith("/players/"), title: "Player Profile" },
	{ matcher: (pathname) => pathname === "/matches", title: "Matches" },
	{ matcher: (pathname) => pathname.startsWith("/matches/"), title: "Match Detail" },
	{ matcher: (pathname) => pathname.startsWith("/events/"), title: "Event Detail" },
	{ matcher: (pathname) => pathname === "/finance", title: "Finance" },
	{ matcher: (pathname) => pathname === "/stats", title: "Stats" },
	{ matcher: (pathname) => pathname === "/historical-stats", title: "Historical Stats" },
	{ matcher: (pathname) => pathname === "/seasons", title: "Seasons" },
	{ matcher: (pathname) => pathname === "/users", title: "Users" },
	{ matcher: (pathname) => pathname === "/notifications", title: "Notifications" },
];

type HeaderProps = {
	onOpenMobileMenu: () => void;
};

export default function Header({ onOpenMobileMenu }: HeaderProps) {
	const location = useLocation();
	const title = getPageTitle(location.pathname);

	return (
		<header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
			<div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={onOpenMobileMenu}
						className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 lg:hidden"
					>
						☰
					</button>

					<h1 className="text-xl font-bold text-slate-900">{title}</h1>
				</div>

				<div className="flex items-center gap-3">
					<NotificationBell />
					<ProfileSummary variant="light" />
				</div>
			</div>
		</header>
	);
}

function getPageTitle(pathname: string) {
	return pageTitles.find((item) => item.matcher(pathname))?.title ?? "Kingsbridge Colts";
}
