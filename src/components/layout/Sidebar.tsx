import { useState } from "react";
import { NavLink } from "react-router-dom";

const navigationItems = [
	{
		label: "Dashboard",
		to: "/",
		end: true,
	},
	{
		label: "Matches",
		to: "/matches",
	},
	{
		label: "Players",
		to: "/players",
	},
	{
		label: "Finances",
		to: "/finance",
	},
	{
		label: "Stats",
		to: "/stats",
	},
	{
		label: "Historical Stats",
		to: "/historical-stats",
	},
	{
		label: "Seasons",
		to: "/seasons",
	},
];

export default function Sidebar() {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	function closeMobileMenu() {
		setIsMobileMenuOpen(false);
	}

	return (
		<>
			<button
				type="button"
				onClick={() => setIsMobileMenuOpen(true)}
				className="fixed left-4 top-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-900 text-white shadow md:hidden"
				aria-label="Open navigation menu"
			>
				<span className="space-y-1.5">
					<span className="block h-0.5 w-5 rounded-full bg-white" />
					<span className="block h-0.5 w-5 rounded-full bg-white" />
					<span className="block h-0.5 w-5 rounded-full bg-white" />
				</span>
			</button>

			<aside className="hidden h-full w-64 shrink-0 flex-col bg-blue-900 text-white md:flex">
				<SidebarContent />
			</aside>

			{isMobileMenuOpen && (
				<div className="fixed inset-0 z-50 md:hidden">
					<button
						type="button"
						className="absolute inset-0 bg-black/50"
						onClick={closeMobileMenu}
						aria-label="Close navigation menu"
					/>

					<aside className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col bg-blue-900 text-white shadow-xl">
						<div className="flex items-center justify-between border-b border-blue-800 p-5">
							<div className="text-xl font-bold">Kingsbridge Colts</div>

							<button
								type="button"
								onClick={closeMobileMenu}
								className="rounded-lg px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
								aria-label="Close navigation menu"
							>
								✕
							</button>
						</div>

						<nav className="flex-1 space-y-2 p-4">
							{navigationItems.map((item) => (
								<SidebarItem
									key={item.to}
									label={item.label}
									to={item.to}
									end={item.end}
									onClick={closeMobileMenu}
								/>
							))}
						</nav>
					</aside>
				</div>
			)}
		</>
	);
}

function SidebarContent() {
	return (
		<>
			<div className="border-b border-blue-800 p-6 text-xl font-bold">
				Kingsbridge Colts
			</div>

			<nav className="flex-1 space-y-2 p-4">
				{navigationItems.map((item) => (
					<SidebarItem
						key={item.to}
						label={item.label}
						to={item.to}
						end={item.end}
					/>
				))}
			</nav>
		</>
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