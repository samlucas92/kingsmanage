import { NavLink } from "react-router-dom";

export default function Sidebar() {
	return (
		<aside className="flex h-full w-64 shrink-0 flex-col bg-blue-900 text-white">
			<div className="border-b border-blue-800 p-6 text-xl font-bold">
				Kingsbridge Colts
			</div>

			<nav className="flex-1 space-y-2 p-4">
				<SidebarItem label="Dashboard" to="/" end />
				<SidebarItem label="Matches" to="/matches" />
				<SidebarItem label="Players" to="/players" />
				<SidebarItem label="Finances" to="/finance" />
				<SidebarItem label="Stats" to="/stats" />
				<SidebarItem label="Historical Stats" to="/historical-stats" />
				<SidebarItem label="Seasons" to="/seasons" />
			</nav>
		</aside>
	);
}

function SidebarItem({
	label,
	to,
	end = false,
}: {
	label: string;
	to: string;
	end?: boolean;
}) {
	return (
		<NavLink
			to={to}
			end={end}
			className={({ isActive }) =>
				`block rounded-lg px-4 py-2 ${
					isActive
						? "bg-yellow-400 text-black"
						: "text-white hover:bg-blue-800"
				}`
			}
		>
			{label}
		</NavLink>
	);
}