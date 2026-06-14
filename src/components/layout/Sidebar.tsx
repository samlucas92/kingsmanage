import { NavLink, useNavigate } from "react-router-dom";

import { useAuthStore } from "../../stores/auth";
import ProfileSummary from "./ProfileSummary";

type NavigationRole = "Admin" | "Coach" | "Player";

type NavigationItem = {
	label: string;
	to: string;
	end?: boolean;
	roles: NavigationRole[];
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
		label: "Users",
		to: "/users",
		roles: ["Admin"],
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
					<div className="fixed inset-0 bg-slate-900/40" onClick={onCloseMobileMenu} />
					<div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-blue-950 text-white shadow-xl">
						<div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
							<div>
								<p className="text-xs uppercase tracking-[0.25em] text-yellow-300">Kingsbridge</p>
								<p className="text-lg font-bold">KingsManage</p>
							</div>

							<button
								type="button"
								onClick={onCloseMobileMenu}
								className="rounded-lg px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
							>
								✕
							</button>
						</div>

						<SidebarContent onNavigate={onCloseMobileMenu} />
					</div>
				</div>
			)}

			<aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-blue-950 text-white lg:flex">
				<div className="border-b border-white/10 px-5 py-5">
					<p className="text-xs uppercase tracking-[0.25em] text-yellow-300">Kingsbridge</p>
					<p className="text-xl font-bold">KingsManage</p>
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

		return item.roles.includes(role);
	});

	const handleSignOut = () => {
		logout();
		onNavigate?.();
		navigate("/login", { replace: true });
	};

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<nav className="flex-1 space-y-1 px-3 py-4">
				{visibleNavigationItems.map((item) => (
					<SidebarItem
						key={item.to}
						label={item.label}
						to={item.to}
						end={item.end}
						onClick={onNavigate}
					/>
				))}
			</nav>

			<div className="space-y-3 border-t border-white/10 p-3">
				<ProfileSummary variant="dark" />

				<button
					type="button"
					onClick={handleSignOut}
					className="w-full rounded-lg border border-white/15 px-4 py-2 text-left text-sm font-semibold text-white transition hover:bg-white/10"
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
	end = false,
	onClick,
}: {
	label: string;
	to: string;
	end?: boolean;
	onClick?: () => void;
}) {
	return (
		<NavLink
			to={to}
			end={end}
			onClick={onClick}
			className={({ isActive }) =>
				`block rounded-lg px-4 py-2 text-sm font-semibold transition ${
					isActive ? "bg-yellow-400 text-black" : "text-white hover:bg-blue-800"
				}`
			}
		>
			{label}
		</NavLink>
	);
}
