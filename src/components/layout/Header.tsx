import { useLocation } from "react-router-dom";

import NotificationBell from "../notifications/NotificationBell";
import AccountMenu from "./AccountMenu";
import ClubSwitcher from "./ClubSwitcher";
import { useAuthStore } from "../../stores/auth";
import RealtimeStatus from "../realtime/RealtimeStatus";

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
	{ matcher: (pathname) => pathname === "/organization", title: "Organization" },
	{ matcher: (pathname) => pathname === "/settings", title: "Settings" },
	{ matcher: (pathname) => pathname === "/notifications", title: "Notifications" },
];

type HeaderProps = {
	onOpenMobileMenu: () => void;
};

export default function Header({ onOpenMobileMenu }: HeaderProps) {
	const location = useLocation();
	const title = getPageTitle(location.pathname);
	const activeClub = useAuthStore((state) => state.availableClubs.find((club) => club.isCurrent));

	return (
		<header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/88 backdrop-blur-xl">
			<div className="flex h-[76px] items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
				<div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
					<button
						type="button"
						onClick={onOpenMobileMenu}
						className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-lg font-bold text-yepset-800 shadow-sm transition hover:border-yepset-200 hover:bg-yepset-50 lg:hidden"
						aria-label="Open navigation menu"
					>
						☰
					</button>

					<div className="min-w-0">
						<h1 className="truncate text-xl font-black tracking-[-.025em] text-slate-950 sm:text-2xl">{title}</h1>
						{activeClub && <p className="hidden truncate text-xs font-semibold text-slate-500 sm:block">{activeClub.name}</p>}
					</div>
				</div>

				<div className="flex shrink-0 items-center gap-2 sm:gap-3">
					<RealtimeStatus />
					<ClubSwitcher />
					<NotificationBell />
					<AccountMenu />
				</div>
			</div>
		</header>
	);
}

function getPageTitle(pathname: string) {
	return pageTitles.find((item) => item.matcher(pathname))?.title ?? "Yepset";
}
