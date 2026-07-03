import { useLocation, useNavigate } from "react-router-dom";

import NotificationBell from "../notifications/NotificationBell";
import AccountMenu from "./AccountMenu";
import ClubSwitcher from "./ClubSwitcher";
import BrandMark from "./BrandMark";
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
	{ matcher: (pathname) => pathname === "/platform/organizations", title: "Organizations" },
	{ matcher: (pathname) => pathname === "/settings", title: "Settings" },
	{ matcher: (pathname) => pathname === "/notifications", title: "Notifications" },
];

export default function Header() {
	const location = useLocation();
	const navigate = useNavigate();
	const title = getPageTitle(location.pathname, location.search);
	const activeClub = useAuthStore((state) => state.availableClubs.find((club) => club.isCurrent));
	const isDetailPage =
		/^\/(matches|players|events|posts)\/[^/]+$/.test(location.pathname);

	return (
		<header className="sticky top-0 z-20 bg-yepset-700 text-white shadow-sm lg:border-b lg:border-slate-200/80 lg:bg-white/88 lg:text-slate-900 lg:backdrop-blur-xl">
			<div className="relative flex h-16 items-center justify-between px-4 lg:hidden">
				{isDetailPage ? (
					<button
						type="button"
						onClick={() => navigate(-1)}
						className="grid h-10 w-10 place-items-center rounded-xl text-2xl text-white hover:bg-white/10"
						aria-label="Go back"
					>
						‹
					</button>
				) : (
					<BrandMark compact inverse />
				)}

				<div className="pointer-events-none absolute inset-x-16 text-center">
					<h1 className="truncate text-base font-black tracking-[-.02em]">{title}</h1>
					{activeClub && <p className="truncate text-[10px] font-semibold text-yepset-100">{activeClub.name}</p>}
				</div>

				<NotificationBell variant="inverse" />
			</div>

			<div className="hidden h-[76px] items-center justify-between gap-4 px-8 lg:flex">
				<div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
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

function getPageTitle(pathname: string, search: string) {
	if (pathname === "/") {
		const tabTitle = new URLSearchParams(search).get("tab");

		if (tabTitle) {
			return tabTitle.charAt(0).toUpperCase() + tabTitle.slice(1);
		}
	}

	return pageTitles.find((item) => item.matcher(pathname))?.title ?? "Yepset";
}
