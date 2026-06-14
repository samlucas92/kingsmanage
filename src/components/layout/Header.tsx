import { useLocation } from "react-router-dom";
import ProfileSummary from "./ProfileSummary";

const pageTitles: { matcher: (pathname: string) => boolean; title: string }[] = [
	{ matcher: (pathname) => pathname === "/" || pathname === "/dashboard", title: "Dashboard" },
	{ matcher: (pathname) => pathname === "/players", title: "Players" },
	{ matcher: (pathname) => pathname.startsWith("/players/"), title: "Player Profile" },
	{ matcher: (pathname) => pathname === "/matches", title: "Matches" },
	{ matcher: (pathname) => pathname.startsWith("/matches/"), title: "Match Detail" },
	{ matcher: (pathname) => pathname === "/finance", title: "Finance" },
	{ matcher: (pathname) => pathname === "/stats", title: "Stats" },
	{ matcher: (pathname) => pathname === "/historical-stats", title: "Historical Stats" },
	{ matcher: (pathname) => pathname === "/seasons", title: "Seasons" },
	{ matcher: (pathname) => pathname === "/users", title: "Users" },
];

type HeaderProps = {
	onOpenMobileMenu: () => void;
};

export default function Header({ onOpenMobileMenu }: HeaderProps) {
	const location = useLocation();
	const title = getPageTitle(location.pathname);

	return (
		<header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
			<div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={onOpenMobileMenu}
						className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
						aria-label="Open navigation"
					>
						☰
					</button>
					<h1 className="text-xl font-bold text-slate-900">{title}</h1>
				</div>

				<div className="hidden sm:block lg:hidden xl:block">
					<ProfileSummary compact />
				</div>
			</div>
		</header>
	);
}

function getPageTitle(pathname: string) {
	return pageTitles.find((item) => item.matcher(pathname))?.title ?? "Kingsbridge Colts";
}
