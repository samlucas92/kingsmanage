import { useLocation } from "react-router-dom";

export default function Header() {
	const location = useLocation();
	const title = getPageTitle(location.pathname);

	return (
		<header className="flex items-center justify-between bg-white px-6 py-4 shadow">
			<div className="min-w-0">
				<h1 className="truncate text-xl font-semibold text-slate-900">
					{title}
				</h1>
			</div>

			<div className="flex items-center gap-4">
				<span className="text-sm text-gray-600">Coach</span>
				<div className="h-8 w-8 rounded-full bg-blue-900" />
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