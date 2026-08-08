import { Link, useLocation } from "react-router-dom";

import { useAuthStore } from "../../stores/auth";

type MobileBottomNavigationProps = {
	isMoreOpen: boolean;
	onOpenMore: () => void;
};

type MobileNavigationItem = {
	label: string;
	to: string;
	icon: "dashboard" | "players" | "matches" | "finance" | "reports" | "training" | "events" | "posts" | "messages";
};

export default function MobileBottomNavigation({
	isMoreOpen,
	onOpenMore,
}: MobileBottomNavigationProps) {
	const role = useAuthStore((state) => state.currentUser?.role ?? "Player");
	const location = useLocation();

	const items: MobileNavigationItem[] =
		role === "Admin"
			? [
					{ label: "Dashboard", to: "/", icon: "dashboard" },
					{ label: "Players", to: "/players", icon: "players" },
					{ label: "Matches", to: "/matches", icon: "matches" },
					{ label: "Training", to: "/training", icon: "training" },
				]
			: role === "Coach"
				? [
						{ label: "Dashboard", to: "/", icon: "dashboard" },
						{ label: "Players", to: "/players", icon: "players" },
						{ label: "Matches", to: "/matches", icon: "matches" },
						{ label: "Training", to: "/training", icon: "training" },
					]
				: [
						{ label: "Dashboard", to: "/", icon: "dashboard" },
						{ label: "Events", to: "/?tab=events", icon: "events" },
						{ label: "Posts", to: "/?tab=posts", icon: "posts" },
						{ label: "Messages", to: "/?tab=messages", icon: "messages" },
					];
	const hasActivePrimaryItem = items.some((item) => (
		isMobileItemActive(item.to, location.pathname, location.search)
	));
	const isMoreActive = isMoreOpen || !hasActivePrimaryItem;

	return (
		<nav className="mobile-bottom-nav lg:hidden" aria-label="Mobile navigation">
			{items.map((item) => (
				<Link
					key={item.label}
					to={item.to}
					className={`mobile-bottom-nav__item ${
						isMobileItemActive(item.to, location.pathname, location.search)
							? "mobile-bottom-nav__item--active"
							: ""
					}`}
				>
					<MobileNavigationIcon name={item.icon} />
					<span>{item.label}</span>
				</Link>
			))}

			<button
				type="button"
				onClick={onOpenMore}
				className={`mobile-bottom-nav__item ${isMoreActive ? "mobile-bottom-nav__item--active" : ""}`}
				aria-expanded={isMoreOpen}
				aria-label="Open more navigation options"
			>
				<MobileNavigationIcon name="more" />
				<span>More</span>
			</button>
		</nav>
	);
}

function isMobileItemActive(to: string, pathname: string, search: string) {
	if (to === "/") {
		return pathname === "/" && !search;
	}

	if (to.includes("?")) {
		const tab = new URLSearchParams(to.split("?")[1]).get("tab");
		return `${pathname}${search}` === to || Boolean(tab && pathname.startsWith(`/${tab}/`));
	}

	return pathname === to || pathname.startsWith(`${to}/`);
}

function MobileNavigationIcon({
	name,
}: {
	name: MobileNavigationItem["icon"] | "more";
}) {
	const path =
		name === "dashboard"
			? "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z"
			: name === "players"
				? "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
				: name === "matches" || name === "events"
					? "M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z"
					: name === "finance"
						? "M4 7h16v12H4zM4 10h16m-4 5h1"
						: name === "reports"
							? "M4 19V5m5 14v-8m5 8V8m5 11V3M3 21h18"
							: name === "training"
								? "M12 3v18M7 6h10a3 3 0 0 1 0 6H7m0 0h11a3 3 0 0 1 0 6H7"
								: name === "posts"
									? "M5 4h14v16H5zM8 8h8m-8 4h8m-8 4h5"
									: name === "messages"
										? "M4 5h16v12H8l-4 4V5Zm4 5h8m-8 3h5"
										: "M5 12h.01M12 12h.01M19 12h.01";

	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d={path} />
		</svg>
	);
}
