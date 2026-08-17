import { Link } from "react-router-dom";
import { ErrorBanner, VaultFrame } from "./HandoverFrame";
import { formatDate } from "./handoverFormat";
import { useHandoverData } from "./useHandoverData";

export default function HandoverOverview() {
	const { data, error, loading } = useHandoverData();
	if (loading) return <VaultFrame><p className="text-sm text-slate-500">Loading continuity information…</p></VaultFrame>;
	if (error || !data) return <VaultFrame><ErrorBanner message={error || "Handover Vault is unavailable."} /></VaultFrame>;
	const critical = data.warnings.filter((warning) => warning.severity === "Critical");
	const attention = data.warnings.filter((warning) => warning.severity === "Attention");
	const covered = data.roles.filter((role) => role.isActive && role.primaryOwnerUserId && !data.warnings.some((warning) => warning.entityType === "OperationalRole" && warning.entityId === role.id));
	const upcoming = data.tasks.filter((task) => task.status !== "Completed" && task.status !== "Cancelled" && task.dueAt).slice(0, 4);
	const activeHandovers = data.handovers.filter((handover) => handover.status !== "Completed" && handover.status !== "Cancelled");
	return (
		<VaultFrame>
			<section className="surface-card p-5 sm:p-6">
				<h2 className="text-xl font-black">Organisation continuity</h2>
				<div className="mt-5 grid grid-cols-3 divide-x divide-slate-200 text-center">
					<ContinuityMetric value={covered.length} label="Covered" tone="green" symbol="✓" />
					<ContinuityMetric value={attention.length} label="Attention" tone="amber" symbol="!" />
					<ContinuityMetric value={critical.length} label="Critical" tone="red" symbol="!" />
				</div>
			</section>

			<div className="grid gap-5 xl:grid-cols-2">
				<section className="surface-card p-5 sm:p-6">
					<div className="flex items-center justify-between"><h2 className="text-xl font-black">Needs attention</h2><Link className="text-sm font-bold text-yepset-700" to="/handover/roles">View roles</Link></div>
					<div className="mt-3 divide-y divide-slate-100">
						{data.warnings.slice(0, 5).map((warning) => <Link key={`${warning.code}-${warning.entityId}`} to={warning.actionPath} className="flex items-center gap-3 py-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-black text-white ${warning.severity === "Critical" ? "bg-red-600" : "bg-amber-400"}`}>!</span><span className="min-w-0 flex-1 text-sm font-semibold text-slate-800">{warning.message}</span><span aria-hidden="true">›</span></Link>)}
						{data.warnings.length === 0 && <p className="py-5 text-sm text-slate-500">No continuity warnings. Everything visible is covered.</p>}
					</div>
				</section>

				<section className="surface-card p-5 sm:p-6">
					<div className="flex items-center justify-between"><h2 className="text-xl font-black">Upcoming tasks</h2><Link className="text-sm font-bold text-yepset-700" to="/handover/tasks">View all</Link></div>
					<div className="mt-3 divide-y divide-slate-100">{upcoming.map((task) => <div key={task.id} className="flex items-center gap-3 py-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-blue-700">▣</span><span className="min-w-0 flex-1 text-sm font-bold">{task.title}</span><span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800">{formatDate(task.dueAt)}</span></div>)}{upcoming.length === 0 && <p className="py-5 text-sm text-slate-500">No upcoming operational tasks.</p>}</div>
				</section>
			</div>

			<section className="surface-card p-5 sm:p-6">
				<div className="flex items-center justify-between"><h2 className="text-xl font-black">Current handovers</h2><Link className="text-sm font-bold text-yepset-700" to="/handover/records">View all</Link></div>
				<div className="mt-3 grid gap-3 md:grid-cols-2">{activeHandovers.map((handover) => { const role = data.roles.find((item) => item.id === handover.operationalRoleId); const pending = handover.items.filter((item) => item.status === "Pending" || item.status === "Blocked").length; return <Link key={handover.id} to={`/handover/records/${handover.id}`} className="rounded-xl border border-slate-200 p-4 transition hover:border-yepset-300"><p className="font-bold">{role?.name ?? "Operational role"}</p><p className="mt-1 text-sm text-slate-500">{pending} checklist item{pending === 1 ? "" : "s"} unresolved</p></Link>; })}{activeHandovers.length === 0 && <p className="text-sm text-slate-500">No active formal handovers.</p>}</div>
			</section>
		</VaultFrame>
	);
}

function ContinuityMetric({ value, label, tone, symbol }: { value: number; label: string; tone: "green" | "amber" | "red"; symbol: string }) {
	const colors = tone === "green" ? "bg-green-600 text-green-700" : tone === "amber" ? "bg-amber-400 text-amber-600" : "bg-red-600 text-red-700";
	return <div className="px-2"><span className={`mx-auto grid h-11 w-11 place-items-center rounded-full text-xl font-black text-white ${colors.split(" ")[0]}`}>{symbol}</span><p className={`mt-2 text-3xl font-black ${colors.split(" ")[1]}`}>{value}</p><p className="text-xs font-bold text-slate-500 sm:text-sm">{label}</p></div>;
}
