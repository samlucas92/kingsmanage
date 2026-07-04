import { NavLink } from "react-router-dom";

import { useAuthStore } from "../../stores/auth";

type OrganizationNavItem = {
	label: string;
	to: string;
	end?: boolean;
};

const sharedItems: OrganizationNavItem[] = [
	{ label: "Overview", to: "/organization", end: true },
	{ label: "Setup", to: "/club-setup" },
	{ label: "Club teams", to: "/club-teams" },
];

const organizationAdminItems: OrganizationNavItem[] = [
	{ label: "Users", to: "/users" },
	{ label: "Subscription", to: "/billing" },
];

export default function OrganizationAdminNav() {
	const currentUser = useAuthStore((state) => state.currentUser);
	const canManageOrganization =
		currentUser?.isPlatformAdmin ||
		currentUser?.tenantRole === "OrganizationAdmin";
	const items = canManageOrganization
		? [...sharedItems, ...organizationAdminItems]
		: sharedItems;

	return (
		<nav
			aria-label="Organization administration"
			className="surface-card flex gap-1 overflow-x-auto p-2"
		>
			{items.map((item) => (
				<NavLink
					key={item.to}
					to={item.to}
					end={item.end}
					className={({ isActive }) =>
						`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-black transition ${
							isActive
								? "bg-yepset-700 text-white"
								: "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
						}`
					}
				>
					{item.label}
				</NavLink>
			))}
		</nav>
	);
}
