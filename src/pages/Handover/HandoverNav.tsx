import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../stores/auth";

const items = [
	["Overview", "/handover"],
	["Roles", "/handover/roles"],
	["Tasks", "/handover/tasks"],
	["Handovers", "/handover/records"],
	["Documents", "/handover/documents"],
] as const;

export default function HandoverNav() {
	const user = useAuthStore((state) => state.currentUser);
	return (
		<>
			<header className="overflow-hidden rounded-2xl bg-gradient-to-r from-yepset-950 to-blue-800 px-5 py-5 text-white shadow-lg sm:px-7">
				<p className="text-xs font-black uppercase tracking-[.18em] text-kick-300">Organisation continuity</p>
				<h1 className="mt-1 text-3xl font-black tracking-[-.035em]">Handover Vault</h1>
				<p className="mt-1 text-sm text-blue-100">Keep operational knowledge attached to roles, not individuals.</p>
			</header>
			<nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm" aria-label="Handover Vault">
				{items.map(([label, to]) => (
					<NavLink key={to} to={to} end={to === "/handover"} className={({ isActive }) => `whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold transition ${isActive ? "bg-yepset-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{label}</NavLink>
				))}
			</nav>
			{user?.role !== "Admin" && <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">You can see roles assigned to you, your tasks, and handovers in which you participate.</p>}
		</>
	);
}
