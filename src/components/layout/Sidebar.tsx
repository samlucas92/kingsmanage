import { useState } from "react";
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
	group?: NavigationGroupId;
	tenantRoles?: string[];
	mobileOnly?: boolean;
	platformOnly?: boolean;
};

type NavigationGroupId = "insights" | "manage-club" | "community";

type NavigationGroup = {
	id: NavigationGroupId;
	label: string;
	iconPath: string;
	mobileOnly?: boolean;
};

const navigationGroups: NavigationGroup[] = [
	{ id: "insights", label: "Insights", iconPath: "/reports" },
	{ id: "manage-club", label: "Manage club", iconPath: "/organization" },
	{ id: "community", label: "Community", iconPath: "/?tab=messages", mobileOnly: true },
];

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
		label: "Training",
		to: "/training",
		roles: ["Admin", "Coach"],
	},
	{
		label: "Forms",
		to: "/forms",
		roles: ["Admin", "Coach", "Player"],
	},
	{
		label: "Social Media",
		to: "/social-media",
		roles: ["Admin", "Coach"],
	},
	{
		label: "Reports",
		to: "/reports",
		roles: ["Admin", "Coach"],
		group: "insights",
	},
	{
		label: "Stats",
		to: "/stats",
		roles: ["Admin", "Coach"],
		group: "insights",
	},
	{
		label: "Historical Stats",
		to: "/historical-stats",
		roles: ["Admin", "Coach"],
		group: "insights",
	},
	{
		label: "Finances",
		to: "/finance",
		roles: ["Admin"],
		group: "manage-club",
	},
	{
		label: "Handover Vault",
		to: "/handover",
		roles: ["Admin", "Coach"],
		group: "manage-club",
	},
	{
		label: "Seasons",
		to: "/seasons",
		roles: ["Admin"],
		group: "manage-club",
	},
	{
		label: "Organizations",
		to: "/platform/organizations",
		roles: ["Admin"],
		group: "manage-club",
		platformOnly: true,
	},
	{
		label: "Organization",
		to: "/organization",
		roles: ["Admin"],
		group: "manage-club",
		tenantRoles: ["OrganizationAdmin", "ClubAdmin"],
	},
	{
		label: "Events",
		to: "/?tab=events",
		roles: ["Admin", "Coach", "Player"],
		group: "community",
		mobileOnly: true,
	},
	{
		label: "Posts",
		to: "/?tab=posts",
		roles: ["Admin", "Coach", "Player"],
		group: "community",
		mobileOnly: true,
	},
	{
		label: "Messages",
		to: "/?tab=messages",
		roles: ["Admin", "Coach", "Player"],
		group: "community",
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
	const location = useLocation();

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
	const primaryNavigationItems = visibleNavigationItems.filter((item) => !item.group);
	const visibleNavigationGroups = navigationGroups
		.map((group) => ({
			...group,
			items: visibleNavigationItems.filter((item) => item.group === group.id),
		}))
		.filter((group) => group.items.length > 0);
	const standardNavigationGroups = visibleNavigationGroups.filter((group) => !group.mobileOnly);
	const mobileNavigationGroups = visibleNavigationGroups.filter((group) => group.mobileOnly);
	const activeGroupId = visibleNavigationGroups.find((group) => (
		group.items.some((item) => isNavigationItemActive(item.to, location.pathname, location.search))
	))?.id;
	const [openGroupId, setOpenGroupId] = useState<NavigationGroupId>();
	const [collapsedActiveGroupId, setCollapsedActiveGroupId] = useState<NavigationGroupId>();
	const isGroupOpen = (groupId: NavigationGroupId) => activeGroupId === groupId
		? collapsedActiveGroupId !== groupId
		: openGroupId === groupId;
	const toggleGroup = (groupId: NavigationGroupId) => {
		if (activeGroupId === groupId) {
			setCollapsedActiveGroupId((current) => current === groupId ? undefined : groupId);
			return;
		}

		setCollapsedActiveGroupId(activeGroupId);
		setOpenGroupId((current) => current === groupId ? undefined : groupId);
	};

	const handleSignOut = () => {
		logout();
		onNavigate?.();
		navigate("/login", { replace: true });
	};

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Primary navigation">
				{primaryNavigationItems.map((item) => (
					<SidebarItem
						key={item.to}
						label={item.label}
						to={item.to}
						mobileOnly={item.mobileOnly}
						onClick={onNavigate}
					/>
				))}

				{standardNavigationGroups.length > 0 && (
					<div className="mt-3 space-y-1 border-t border-white/10 pt-3">
						{standardNavigationGroups.map((group) => (
							<SidebarNavigationGroup
								key={group.id}
								group={group}
								isOpen={isGroupOpen(group.id)}
								isActive={activeGroupId === group.id}
								onToggle={() => toggleGroup(group.id)}
								onNavigate={onNavigate}
							/>
						))}
					</div>
				)}

				{mobileNavigationGroups.length > 0 && (
					<div className="mt-3 space-y-1 border-t border-white/10 pt-3 lg:hidden">
						{mobileNavigationGroups.map((group) => (
							<SidebarNavigationGroup
								key={group.id}
								group={group}
								isOpen={isGroupOpen(group.id)}
								isActive={activeGroupId === group.id}
								onToggle={() => toggleGroup(group.id)}
								onNavigate={onNavigate}
							/>
						))}
					</div>
				)}
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

function SidebarNavigationGroup({
	group,
	isOpen,
	isActive,
	onToggle,
	onNavigate,
}: {
	group: NavigationGroup & { items: NavigationItem[] };
	isOpen: boolean;
	isActive: boolean;
	onToggle: () => void;
	onNavigate?: () => void;
}) {
	return (
		<div className={group.mobileOnly ? "lg:hidden" : undefined}>
			<button
				type="button"
				onClick={onToggle}
				className={`group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
					isActive || isOpen
						? "bg-white/8 text-white"
						: "text-yepset-100 hover:bg-white/8 hover:text-white"
				}`}
				aria-expanded={isOpen}
			>
				<NavigationIcon path={group.iconPath} />
				<span className="min-w-0 flex-1 truncate">{group.label}</span>
				<svg
					viewBox="0 0 20 20"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.8"
					className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
					aria-hidden="true"
				>
					<path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</button>

			{isOpen && (
				<div className="ml-5 mt-1 space-y-1 border-l border-white/10 pl-2">
					{group.items.map((item) => (
						<SidebarItem
							key={item.to}
							label={item.label}
							to={item.to}
							mobileOnly={item.mobileOnly}
							nested
							onClick={onNavigate}
						/>
					))}
				</div>
			)}
		</div>
	);
}

function SidebarItem({
	label,
	to,
	mobileOnly = false,
	nested = false,
	onClick,
}: {
	label: string;
	to: string;
	mobileOnly?: boolean;
	nested?: boolean;
	onClick?: () => void;
}) {
	const location = useLocation();
	const isActive = isNavigationItemActive(to, location.pathname, location.search);

	return (
		<Link
			to={to}
			onClick={onClick}
			className={`group items-center gap-3 rounded-xl px-3 font-bold transition ${
					mobileOnly ? "flex lg:hidden" : "flex"
				} ${
					nested ? "min-h-10 py-2 text-[13px]" : "min-h-11 py-2.5 text-sm"
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

function isNavigationItemActive(to: string, pathname: string, search: string) {
	if (to === "/") return pathname === "/" && !search;
	if (to.includes("?")) {
		const tab = new URLSearchParams(to.split("?")[1]).get("tab");
		return `${pathname}${search}` === to || Boolean(tab && pathname.startsWith(`/${tab}/`));
	}
	return pathname === to || pathname.startsWith(`${to}/`);
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
				: path === "/social-media"
					? "M4 5h16v14H4V5Zm3 10 3-3 2 2 3-4 3 5M8 9h.01"
				: path === "/players" || path === "/users"
					? "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
					: path === "/finance"
						? "M4 19V9m5 10V5m5 14v-7m5 7V3"
						: path === "/reports"
							? "M4 19V5m5 14v-8m5 8V8m5 11V3M3 21h18"
							: path === "/forms"
								? "M6 3h9l3 3v15H6V3Zm8 0v4h4M9 11h6M9 15h6M9 19h3"
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
