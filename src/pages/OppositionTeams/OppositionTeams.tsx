import { useEffect, useMemo, useState, type FormEvent } from "react";

import ManagedFileImage from "../../components/files/ManagedFileImage";
import LocationPicker from "../../components/locations/LocationPicker";
import { uploadLinkedFile, getManagedImageValidationError } from "../../services/fileService";
import { filesApi } from "../../services/filesApi";
import { useOppositionTeamStore } from "../../stores/oppositionTeams";
import type { OppositionTeam, SaveOppositionTeamRequest } from "../../types/oppositionTeams";

export default function OppositionTeams() {
	const teams = useOppositionTeamStore((state) => state.teams);
	const isLoading = useOppositionTeamStore((state) => state.isLoading);
	const error = useOppositionTeamStore((state) => state.error);
	const loadTeams = useOppositionTeamStore((state) => state.loadTeams);
	const createTeam = useOppositionTeamStore((state) => state.createTeam);
	const updateTeam = useOppositionTeamStore((state) => state.updateTeam);
	const replaceTeam = useOppositionTeamStore((state) => state.replaceTeam);
	const [search, setSearch] = useState("");
	const [showArchived, setShowArchived] = useState(false);
	const [editingTeam, setEditingTeam] = useState<OppositionTeam | null | undefined>(undefined);

	useEffect(() => { void loadTeams(); }, [loadTeams]);

	const visibleTeams = useMemo(() => {
		const query = search.trim().toLowerCase();
		return teams.filter((team) => (showArchived || team.isActive) &&
			(!query || `${team.name} ${team.location}`.toLowerCase().includes(query)));
	}, [teams, search, showArchived]);

	async function saveTeam(
		request: SaveOppositionTeamRequest,
		badge: File | null,
		removeBadge: boolean
	) {
		if (badge) {
			const validationError = await getManagedImageValidationError(badge, "opposition-badge");
			if (validationError) throw new Error(validationError);
		}

		let saved = editingTeam
			? await updateTeam(editingTeam.id, request)
			: await createTeam(request);
		if (!editingTeam) setEditingTeam(saved);

		if (badge) {
			const uploaded = await uploadLinkedFile({
				file: badge,
				linkedEntityType: "OppositionTeam",
				linkedEntityId: saved.id,
			});
			saved = await filesApi.assignOppositionTeamBadge(uploaded.id);
			replaceTeam(saved);
		} else if (removeBadge && saved.badgeFileId) {
			saved = await filesApi.removeOppositionTeamBadge(saved.id);
			replaceTeam(saved);
		}

		setEditingTeam(undefined);
	}

	return (
		<div className="space-y-5">
			<header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<p className="text-xs font-black uppercase tracking-[.18em] text-yepset-700">Manage club</p>
					<h1 className="mt-1 text-3xl font-black tracking-[-.035em] text-slate-950">Opposition teams</h1>
					<p className="mt-1 max-w-2xl text-sm font-semibold text-slate-500">Save club badges and away grounds once, then use them automatically for fixtures and social graphics.</p>
				</div>
				<button type="button" onClick={() => setEditingTeam(null)} className="btn-primary inline-flex items-center justify-center gap-2"><PlusIcon />Add opposition</button>
			</header>

			<section aria-label="Opposition team summary" className="grid grid-cols-2 gap-3 lg:max-w-2xl">
				<SummaryCard label="Active teams" value={teams.filter((team) => team.isActive).length} tone="blue" />
				<SummaryCard label="Badges saved" value={teams.filter((team) => Boolean(team.badgeFileId)).length} tone="green" />
			</section>

			<section className="surface-card overflow-hidden">
				<div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-[minmax(16rem,1fr)_auto] sm:items-center">
					<label className="relative">
						<span className="sr-only">Search opposition teams</span>
						<SearchIcon />
						<input value={search} onChange={(event) => setSearch(event.target.value)} className="input-field" style={{ paddingLeft: "2.75rem" }} placeholder="Search teams or locations…" />
					</label>
					<label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700">
						<input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} className="h-4 w-4 rounded border-slate-300" />
						Show archived
					</label>
				</div>

				{error && <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{error}</div>}
				{isLoading ? (
					<div className="grid min-h-64 place-items-center p-8"><p className="text-sm font-semibold text-slate-500">Loading opposition teams…</p></div>
				) : visibleTeams.length === 0 ? (
					<div className="grid min-h-64 place-items-center p-8 text-center"><div><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-yepset-50 text-2xl font-black text-yepset-700">VS</div><h2 className="mt-4 text-lg font-black text-slate-900">{teams.length ? "No teams match" : "Build your opposition directory"}</h2><p className="mt-1 text-sm text-slate-500">{teams.length ? "Try another search or show archived teams." : "Add the clubs you regularly play against."}</p>{teams.length === 0 && <button type="button" onClick={() => setEditingTeam(null)} className="btn-primary mt-5">Add first opposition</button>}</div></div>
				) : (
					<div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
						{visibleTeams.map((team) => <TeamCard key={team.id} team={team} onEdit={() => setEditingTeam(team)} />)}
					</div>
				)}
			</section>

			{editingTeam !== undefined && <OppositionTeamModal team={editingTeam} onClose={() => setEditingTeam(undefined)} onSave={saveTeam} />}
		</div>
	);
}

function TeamCard({ team, onEdit }: { team: OppositionTeam; onEdit: () => void }) {
	return (
		<button type="button" onClick={onEdit} className="group flex min-h-36 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-yepset-300 hover:shadow-md">
			{team.badgeFileId ? <ManagedFileImage fileId={team.badgeFileId} alt={`${team.name} badge`} className="h-20 w-20 shrink-0 rounded-2xl border border-slate-100 bg-white object-contain p-1" /> : <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-slate-100 text-xl font-black text-slate-500">{initials(team.name)}</div>}
			<div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="truncate font-black text-slate-950">{team.name}</h2>{!team.isActive && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black uppercase text-slate-600">Archived</span>}</div><p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-500">{team.location || "Away ground not added"}</p><p className="mt-3 text-xs font-black uppercase tracking-wide text-yepset-700 group-hover:text-yepset-900">Edit team →</p></div>
		</button>
	);
}

function OppositionTeamModal({ team, onClose, onSave }: { team: OppositionTeam | null; onClose: () => void; onSave: (request: SaveOppositionTeamRequest, badge: File | null, removeBadge: boolean) => Promise<void> }) {
	const [name, setName] = useState(team?.name ?? "");
	const [location, setLocation] = useState(team?.location ?? "");
	const [isActive, setIsActive] = useState(team?.isActive ?? true);
	const [badge, setBadge] = useState<File | null>(null);
	const [badgePreview, setBadgePreview] = useState("");
	const [removeBadge, setRemoveBadge] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => () => { if (badgePreview) URL.revokeObjectURL(badgePreview); }, [badgePreview]);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!name.trim()) { setError("Team name is required."); return; }
		setIsSaving(true);
		setError("");
		try {
			await onSave({ name: name.trim(), location: location.trim(), isActive }, badge, removeBadge);
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "The opposition team could not be saved.");
		} finally {
			setIsSaving(false);
		}
	}

	function chooseBadge(file?: File) {
		if (!file) return;
		if (badgePreview) URL.revokeObjectURL(badgePreview);
		setBadge(file);
		setBadgePreview(URL.createObjectURL(file));
		setRemoveBadge(false);
	}

	return (
		<div className="fixed inset-0 z-50 flex items-end bg-yepset-950/55 backdrop-blur-sm sm:items-center sm:justify-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="opposition-team-title">
			<button type="button" className="absolute inset-0" onClick={isSaving ? undefined : onClose} aria-label="Close" />
			<form onSubmit={(event) => void submit(event)} className="relative z-10 flex max-h-[96vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
				<header className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-7"><div><p className="text-xs font-black uppercase tracking-[.16em] text-yepset-700">Opposition directory</p><h2 id="opposition-team-title" className="mt-1 text-2xl font-black text-slate-950">{team ? "Edit opposition" : "Add opposition"}</h2></div><button type="button" onClick={onClose} disabled={isSaving} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-xl text-slate-500">×</button></header>
				<div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-slate-50/70 p-5 sm:p-7">
					<section className="rounded-2xl border border-slate-200 bg-white p-5">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
							{badgePreview ? <img src={badgePreview} alt="Badge preview" className="h-24 w-24 rounded-2xl border border-slate-200 object-contain p-1" /> : team?.badgeFileId && !removeBadge ? <ManagedFileImage fileId={team.badgeFileId} alt={`${team.name} badge`} className="h-24 w-24 rounded-2xl border border-slate-200 object-contain p-1" /> : <div className="grid h-24 w-24 place-items-center rounded-2xl bg-slate-100 text-2xl font-black text-slate-500">{initials(name) || "VS"}</div>}
							<div><p className="font-black text-slate-900">Club badge</p><p className="mt-1 text-sm text-slate-500">Square PNG, JPG or WebP works best.</p><div className="mt-3 flex flex-wrap gap-2"><label className="btn-secondary cursor-pointer">{team?.badgeFileId ? "Replace badge" : "Choose badge"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { chooseBadge(event.target.files?.[0]); event.target.value = ""; }} /></label>{team?.badgeFileId && !removeBadge && !badge && <button type="button" onClick={() => setRemoveBadge(true)} className="rounded-xl px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50">Remove</button>}</div></div>
						</div>
					</section>
					<section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
						<label className="block"><span className="text-xs font-black uppercase tracking-wide text-slate-500">Team name</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required className="input-field mt-1.5" placeholder="e.g. Murton Rovers" /></label>
						<LocationPicker value={location} onChange={setLocation} label="Away ground / location" />
						{team && <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-700"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="h-4 w-4 rounded border-slate-300" />Active and available for new fixtures</label>}
					</section>
					{error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{error}</div>}
				</div>
				<footer className="flex justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-7"><button type="button" onClick={onClose} disabled={isSaving} className="btn-secondary">Cancel</button><button type="submit" disabled={isSaving} className="btn-primary disabled:opacity-60">{isSaving ? "Saving…" : "Save opposition"}</button></footer>
			</form>
		</div>
	);
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: "blue" | "green" }) {
	return <article className="surface-card flex items-center gap-4 p-4 sm:p-5"><div className={`grid h-12 w-12 place-items-center rounded-full text-lg font-black ${tone === "green" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{tone === "green" ? "✓" : "VS"}</div><div><p className="text-sm font-bold text-slate-500">{label}</p><p className="text-3xl font-black text-slate-950">{value}</p></div></article>;
}

function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function PlusIcon() { return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v8m-4-4h8" /></svg>; }
function SearchIcon() { return <svg className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>; }
