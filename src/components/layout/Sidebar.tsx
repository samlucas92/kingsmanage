import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuthStore } from "../../stores/auth";
import ClubSwitcher from "./ClubSwitcher";
import ProfileSummary from "./ProfileSummary";
import BrandMark from "./BrandMark";

type NavigationRole = "Admin" | "Coach" | "Player";

type NavigationItem = {
	label: string;
	to: string;
	end?: boolean;
	roles: NavigationRole[];
	tenantRoles?: string[];
	mobileOnly?: boolean;
	platformOnly?: boolean;
};

const navigationItems: NavigationItem[] = [
	{
		label: "Dashboard",
		to: "/",
		end: true,
		roles: ["Admin", "Coach", "Player"],
	},
	{
		label: "Matches",
		to: "/matches",
		roles: ["Admin", "Coach"],
	},
	{
		label: "Players",
		to: "/players",
		roles: ["Admin", "Coach"],
	},
	{
		label: "Finances",
		to: "/finance",
		roles: ["Admin"],
	},
	{
		label: "Stats",
		to: "/stats",
		roles: ["Admin", "Coach"],
	},
	{
		label: "Historical Stats",
		to: "/historical-stats",
		roles: ["Admin", "Coach"],
	},
	{
		label: "Seasons",
		to: "/seasons",
		roles: ["Admin"],
	},
	{
		label: "Organizations",
		to: "/platform/organizations",
		roles: ["Admin"],
		platformOnly: true,
	},
	{
		label: "Organization",
		to: "/organization",
		roles: ["Admin"],
		tenantRoles: ["OrganizationAdmin", "ClubAdmin"],
	},
	{
		label: "Events",
		to: "/?tab=events",
		roles: ["Admin", "Coach", "Player"],
		mobileOnly: true,
	},
	{
		label: "Posts",
		to: "/?tab=posts",
		roles: ["Admin", "Coach", "Player"],
		mobileOnly: true,
	},
	{
		label: "Messages",
		to: "/?tab=messages",
		roles: ["Admin", "Coach", "Player"],
		mobileOnly: true,
	},
];

type SidebarProps = {
	isMobileMenuOpen: boolean;
	onCloseMobileMenu: () => void;
};

export default function Sidebar({
	isMobileMenuOpen,
	onCloseMobileMenu,
}: SidebarProps) {
	return (
		<>
			{isMobileMenuOpen && (
				<div className="fixed inset-0 z-40 lg:hidden">
					<div className="fixed inset-0 bg-yepset-950/55 backdrop-blur-sm" onClick={onCloseMobileMenu} />
					<div className="fixed inset-y-0 left-0 flex w-[min(19rem,88vw)] flex-col bg-yepset-950 text-white shadow-2xl">
						<div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
							<BrandMark inverse />

							<button
								type="button"
								onClick={onCloseMobileMenu}
								className="grid h-10 w-10 place-items-center rounded-xl text-lg font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
								aria-label="Close navigation menu"
							>
								✕
							</button>
						</div>

						<SidebarContent onNavigate={onCloseMobileMenu} />
					</div>
				</div>
			)}

			<aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-yepset-950 text-white shadow-[10px_0_40px_rgba(8,42,40,.08)] lg:flex">
				<div className="border-b border-white/10 px-5 py-[18px]">
					<BrandMark inverse />
				</div>

				<SidebarContent />
			</aside>
		</>
	);
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
	const navigate = useNavigate();

	const currentUser = useAuthStore((state) => state.currentUser);
	const logout = useAuthStore((state) => state.logout);

	const role = currentUser?.role as NavigationRole | undefined;

	const visibleNavigationItems = navigationItems.filter((item) => {
		if (!role) {
			return false;
		}

		return item.roles.includes(role) &&
			(!item.platformOnly || currentUser?.isPlatformAdmin) &&
			(!item.tenantRoles || (currentUser?.tenantRole && item.tenantRoles.includes(currentUser.tenantRole)));
	});

	const handleSignOut = () => {
		logout();
		onNavigate?.();
		navigate("/login", { replace: true });
	};

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Primary navigation">
				{visibleNavigationItems.map((item) => (
					<SidebarItem
						key={item.to}
						label={item.label}
						to={item.to}
						mobileOnly={item.mobileOnly}
						onClick={onNavigate}
					/>
				))}
			</nav>

			<div className="shrink-0 space-y-3 border-t border-white/10 p-3 lg:hidden">
				<div className="lg:hidden">
					<ClubSwitcher variant="dark" />
				</div>
				<ProfileSummary variant="dark" />

				<button
					type="button"
					onClick={handleSignOut}
					className="w-full rounded-xl border border-white/15 px-4 py-2.5 text-left text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
				>
					Sign out
				</button>
			</div>
		</div>
	);
}

function SidebarItem({
	label,
	to,
	mobileOnly = false,
	onClick,
}: {
	label: string;
	to: string;
	mobileOnly?: boolean;
	onClick?: () => void;
}) {
	const location = useLocation();
	const isActive =
		to === "/"
			? location.pathname === "/" && !location.search
			: to.includes("?")
				? `${location.pathname}${location.search}` === to
				: location.pathname === to || location.pathname.startsWith(`${to}/`);

	return (
		<Link
			to={to}
			onClick={onClick}
			className={`group min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
					mobileOnly ? "flex lg:hidden" : "flex"
				} ${
					isActive
						? "bg-kick-400 text-yepset-950 shadow-[0_8px_20px_rgba(190,242,100,.12)]"
						: "text-yepset-100 hover:bg-white/8 hover:text-white"
				}`}
			aria-current={isActive ? "page" : undefined}
		>
			<NavigationIcon path={to} />
			<span>{label}</span>
		</Link>
	);
}

function NavigationIcon({ path }: { path: string }) {
	const iconPath =
		path === "/"
			? "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z"
			: path === "/?tab=events"
				? "M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Zm3 10h2m2 0h2m-6 4h2"
				: path === "/?tab=posts"
					? "M5 4h14v16H5zM8 8h8m-8 4h8m-8 4h5"
					: path === "/?tab=messages"
						? "M4 5h16v12H8l-4 4V5Zm4 5h8m-8 3h5"
			: path === "/matches"
				? "M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z"
				: path === "/players" || path === "/users"
					? "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
					: path === "/finance"
						? "M4 19V9m5 10V5m5 14v-7m5 7V3"
						: path === "/stats" || path === "/historical-stats"
							? "m4 17 5-5 4 4 7-9M15 7h5v5"
							: path === "/seasons"
								? "M5 4h14v16H5zM8 2v4m8-4v4M5 9h14"
								: path === "/club-teams"
									? "M12 3 3 8l9 5 9-5-9-5Zm-7 9 7 4 7-4m-14 4 7 4 7-4"
									: path === "/organization"
										? "M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6M8 11h.01M12 11h.01M16 11h.01"
										: "M4 21V8l8-5 8 5v13M9 21v-7h6v7";

	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0 opacity-80 transition group-hover:opacity-100" aria-hidden="true">
			<path d={iconPath} />
		</svg>
	);
}
