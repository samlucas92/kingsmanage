import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { handoverApi } from "../../services/handoverApi";
import { usersApi } from "../../services/usersApi";
import { useAuthStore } from "../../stores/auth";
import type { AuthUser } from "../../types/auth";
import type { OperationalRole } from "../../types/handover";
import { ErrorBanner, VaultFrame } from "./HandoverFrame";
import { useHandoverData } from "./useHandoverData";

const emptyRole: OperationalRole = { id: "", name: "", description: "", isActive: true, displayOrder: 0, primaryOwnerUserId: null, supportingOwnerUserIds: [] };

export default function HandoverRoles() {
	const { data, error, loading, reload, setError } = useHandoverData();
	const isAdmin = useAuthStore((state) => state.currentUser?.role === "Admin");
	const [users, setUsers] = useState<AuthUser[]>([]);
	const [editing, setEditing] = useState<OperationalRole | null>(null);
	const [pendingTransfer, setPendingTransfer] = useState<{ roleId: string; roleName: string; outgoingUserId: string; incomingUserId: string | null } | null>(null);
	const [search, setSearch] = useState("");
	const [showInactive, setShowInactive] = useState(false);
	useEffect(() => { if (isAdmin) void usersApi.getUsers().then(setUsers).catch(() => setUsers([])); }, [isAdmin]);
	const filtered = useMemo(() => (data?.roles ?? []).filter((role) => (showInactive || role.isActive) && role.name.toLowerCase().includes(search.toLowerCase())), [data, search, showInactive]);
	async function save(role: OperationalRole) {
		try {
			const previous = data?.roles.find((item) => item.id === role.id);
			const saved = await handoverApi.saveRole(role);
			if (previous?.primaryOwnerUserId && previous.primaryOwnerUserId !== saved.primaryOwnerUserId) {
				setPendingTransfer({ roleId: saved.id, roleName: saved.name, outgoingUserId: previous.primaryOwnerUserId, incomingUserId: saved.primaryOwnerUserId });
			}
			setEditing(null);
			await reload();
		} catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Failed to save role."); }
	}
	return <VaultFrame>
		<div className="surface-card p-5 sm:p-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-black">Operational roles</h2><p className="mt-1 text-sm text-slate-500">Roles are organisation-owned and can have one primary and several supporting owners.</p></div>{isAdmin && <button className="btn-primary" onClick={() => setEditing({ ...emptyRole })}>Create role</button>}</div>
			<div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]"><input className="rounded-xl border border-slate-300 px-3 py-2" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search roles" /><label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"><input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} /> Show inactive</label></div>
		</div>
		{error && <ErrorBanner message={error} />}
		{loading ? <p className="text-sm text-slate-500">Loading roles…</p> : <div className="grid gap-4 md:grid-cols-2">{filtered.map((role) => {
			const owner = users.find((user) => user.id === role.primaryOwnerUserId);
			const responsibilities = data?.responsibilities.filter((item) => item.operationalRoleId === role.id && item.isActive).length ?? 0;
			const outstanding = data?.tasks.filter((task) => task.operationalRoleId === role.id && task.status !== "Completed" && task.status !== "Cancelled").length ?? 0;
			const warnings = data?.warnings.filter((warning) => warning.entityId === role.id).length ?? 0;
			return <article key={role.id} className="surface-card p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h3 className="text-lg font-black">{role.name}</h3>{!role.isActive && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold">Inactive</span>}{warnings > 0 && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">{warnings} warning{warnings === 1 ? "" : "s"}</span>}</div><p className="mt-1 text-sm text-slate-500">{role.description || "No role description yet."}</p></div>{isAdmin && <button className="text-sm font-bold text-yepset-700" onClick={() => setEditing({ ...role, supportingOwnerUserIds: [...role.supportingOwnerUserIds] })}>Edit</button>}</div><dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center"><Metric value={owner?.email ?? (role.primaryOwnerUserId ? "Assigned" : "Unassigned")} label="Primary owner" /><Metric value={String(responsibilities)} label="Responsibilities" /><Metric value={String(outstanding)} label="Open tasks" /></dl><Link to={`/handover/roles/${role.id}`} className="mt-4 inline-flex text-sm font-bold text-yepset-700">Open role →</Link></article>;
		})}{filtered.length === 0 && <p className="text-sm text-slate-500">No operational roles match these filters.</p>}</div>}
		{editing && <RoleModal role={editing} users={users} onClose={() => setEditing(null)} onSave={save} />}
		{pendingTransfer && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-3"><div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"><h2 className="text-xl font-black">Start a formal handover?</h2><p className="mt-2 text-sm leading-6 text-slate-600">The primary owner of {pendingTransfer.roleName} changed. The new assignment is active now; its handover can remain in progress independently.</p><div className="mt-5 flex justify-end gap-2"><button className="btn-secondary" onClick={() => setPendingTransfer(null)}>Not now</button><Link className="btn-primary" to={`/handover/roles/${pendingTransfer.roleId}?startHandover=1&outgoing=${pendingTransfer.outgoingUserId}&incoming=${pendingTransfer.incomingUserId ?? ""}`}>Set up handover</Link></div></div></div>}
	</VaultFrame>;
}

function Metric({ value, label }: { value: string; label: string }) { return <div className="min-w-0"><dd className="truncate text-sm font-black text-slate-900" title={value}>{value}</dd><dt className="mt-1 text-[11px] font-semibold text-slate-500">{label}</dt></div>; }

function RoleModal({ role, users, onClose, onSave }: { role: OperationalRole; users: AuthUser[]; onClose: () => void; onSave: (role: OperationalRole) => Promise<void> }) {
	const [value, setValue] = useState(role);
	const [saving, setSaving] = useState(false);
	function submit(event: FormEvent) { event.preventDefault(); setSaving(true); void onSave(value).finally(() => setSaving(false)); }
	return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/60 p-3"><form onSubmit={submit} className="w-full max-w-xl space-y-4 rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-xl font-black">{role.id ? "Edit operational role" : "Create operational role"}</h2><p className="text-sm text-slate-500">Owner assignments remain within this organisation.</p></div><button type="button" onClick={onClose}>✕</button></div><Field label="Role name"><input required value={value.name} onChange={(event) => setValue({ ...value, name: event.target.value })} /></Field><Field label="Short description"><textarea rows={3} value={value.description} onChange={(event) => setValue({ ...value, description: event.target.value })} /></Field><Field label="Primary owner"><select value={value.primaryOwnerUserId ?? ""} onChange={(event) => setValue({ ...value, primaryOwnerUserId: event.target.value || null })}><option value="">No primary owner</option>{users.filter((user) => user.isActive).map((user) => <option key={user.id} value={user.id}>{user.email}</option>)}</select></Field><fieldset><legend className="text-sm font-bold text-slate-700">Supporting owners</legend><div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">{users.filter((user) => user.isActive && user.id !== value.primaryOwnerUserId).map((user) => <label key={user.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value.supportingOwnerUserIds.includes(user.id)} onChange={(event) => setValue({ ...value, supportingOwnerUserIds: event.target.checked ? [...value.supportingOwnerUserIds, user.id] : value.supportingOwnerUserIds.filter((id) => id !== user.id) })} />{user.email}</label>)}</div></fieldset><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={value.isActive} onChange={(event) => setValue({ ...value, isActive: event.target.checked })} /> Active role</label><div className="flex justify-end gap-2 border-t pt-4"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={saving || !value.name.trim()}>{saving ? "Saving…" : "Save role"}</button></div></form></div>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-bold text-slate-700">{label}<span className="mt-1 block [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-slate-300 [&>input]:px-3 [&>input]:py-2 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-slate-300 [&>select]:px-3 [&>select]:py-2 [&>textarea]:w-full [&>textarea]:rounded-xl [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:px-3 [&>textarea]:py-2">{children}</span></label>; }
