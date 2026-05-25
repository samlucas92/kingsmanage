import { useLocation } from "react-router-dom";
import ProfileSummary from "./ProfileSummary";

type HeaderProps = {
	onOpenMobileMenu: () => void;
};

export default function Header({ onOpenMobileMenu }: HeaderProps) {
	const location = useLocation();
	const title = getPageTitle(location.pathname);

	return (
		<header className="flex min-w-0 items-center justify-between bg-white px-4 py-3 shadow md:px-6 md:py-4">
			<div className="flex min-w-0 items-center gap-3">
				<button
					type="button"
					onClick={onOpenMobileMenu}
					className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-900 text-white shadow md:hidden"
					aria-label="Open navigation menu"
				>
					<span className="space-y-1.5">
						<span className="block h-0.5 w-5 rounded-full bg-white" />
						<span className="block h-0.5 w-5 rounded-full bg-white" />
						<span className="block h-0.5 w-5 rounded-full bg-white" />
					</span>
				</button>

				<h1 className="truncate text-lg font-semibold text-slate-900 md:text-xl">
					{title}
				</h1>
			</div>

			<div className="ml-3 hidden shrink-0 md:block">
				<ProfileSummary />
			</div>
		</header>
	);
}

function getPageTitle(pathname: string) {
	if (pathname === "/" || pathname === "/dashboard") {
		return "Dashboard";
	}

	if (pathname === "/players") {
		return "Players";
	}

	if (pathname.startsWith("/players/")) {
		return "Player Profile";
	}

	if (pathname === "/matches") {
		return "Matches";
	}

	if (pathname.startsWith("/matches/")) {
		return "Match Detail";
	}

	if (pathname === "/finance") {
		return "Finance";
	}

	if (pathname === "/stats") {
		return "Stats";
	}

	if (pathname === "/historical-stats") {
		return "Historical Stats";
	}

	if (pathname === "/seasons") {
		return "Seasons";
	}

	return "Kingsbridge Colts";
}