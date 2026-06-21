import { useEffect, useState } from "react";

import { useClubTeamStore, type ClubTeamProfile } from "../../stores/clubTeams";

export default function ClubTeams() {
	const profiles = useClubTeamStore((state) => state.profiles);
	const isLoading = useClubTeamStore((state) => state.isLoading);
	const error = useClubTeamStore((state) => state.error);
	const loadProfiles = useClubTeamStore((state) => state.loadProfiles);
	const createProfile = useClubTeamStore((state) => state.createProfile);
	const updateProfile = useClubTeamStore((state) => state.updateProfile);
	const deleteProfile = useClubTeamStore((state) => state.deleteProfile);

	useEffect(() => { void loadProfiles(); }, [loadProfiles]);

	return (
		<div className="space-y-6">
			<header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Club setup</p>
				<h1 className="mt-2 text-3xl font-bold text-slate-900">Club teams</h1>
				<p className="mt-2 max-w-3xl text-sm text-slate-600">
					Create every team your club manages, including senior, youth, ladies and girls teams. Inactive teams remain attached to historical records.
				</p>
			</header>

			{error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

			<CreateTeamForm onCreate={createProfile} nextSortOrder={profiles.length} />

			<div className="grid gap-6 xl:grid-cols-2">
				{profiles.map((profile) => (
					<TeamProfileForm key={profile.id} profile={profile} onSave={updateProfile} onDelete={deleteProfile} />
				))}
			</div>

			{isLoading && <p className="text-sm text-slate-500">Loading club teams...</p>}
		</div>
	);
}

function TeamProfileForm({ profile, onSave, onDelete }: {
	profile: ClubTeamProfile;
	onSave: (profile: ClubTeamProfile) => Promise<void>;
	onDelete: (id: string) => Promise<void>;
}) {
	const [draft, setDraft] = useState(profile);
	const [isSaving, setIsSaving] = useState(false);
	const [message, setMessage] = useState("");

	useEffect(() => setDraft(profile), [profile]);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!draft.displayName.trim() || !draft.shortName.trim()) {
			setMessage("Display name and short name are required.");
			return;
		}
		setIsSaving(true);
		setMessage("");
		try {
			await onSave({ ...draft, displayName: draft.displayName.trim(), shortName: draft.shortName.trim() });
			setMessage("Team saved.");
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Could not save team.");
		} finally {
			setIsSaving(false);
		}
	}

	async function handleDelete() {
		if (!window.confirm(`Delete ${profile.displayName}? This cannot be undone.`)) {
			return;
		}

		setIsSaving(true);
		setMessage("");
		try {
			await onDelete(profile.id);
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Could not delete team.");
			setIsSaving(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-xs font-bold uppercase tracking-wide text-slate-500">Club team</p>
					<h2 className="mt-1 text-xl font-bold text-slate-900">{profile.displayName}</h2>
				</div>
				<label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
					<input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} className="h-4 w-4" />
					Active
				</label>
			</div>

			<div className="mt-5 grid gap-4 sm:grid-cols-2">
				<label className="text-sm font-semibold text-slate-700">Display name
					<input value={draft.displayName} maxLength={50} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
				</label>
				<label className="text-sm font-semibold text-slate-700">Short name
					<input value={draft.shortName} maxLength={20} onChange={(event) => setDraft({ ...draft, shortName: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
				</label>
				<label className="text-sm font-semibold text-slate-700">Display order
					<input type="number" min={0} value={draft.sortOrder} onChange={(event) => setDraft({ ...draft, sortOrder: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
				</label>
			</div>

			<div className="mt-5 flex flex-wrap items-center justify-between gap-3">
				<button type="button" disabled={isSaving} onClick={() => void handleDelete()} className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">Delete team</button>
				<p className={`text-sm ${message === "Team saved." ? "text-green-700" : "text-red-700"}`}>{message}</p>
				<button type="submit" disabled={isSaving} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{isSaving ? "Saving..." : "Save team"}</button>
			</div>
		</form>
	);
}

function CreateTeamForm({ onCreate, nextSortOrder }: {
	onCreate: (profile: Omit<ClubTeamProfile, "id">) => Promise<void>;
	nextSortOrder: number;
}) {
	const [displayName, setDisplayName] = useState("");
	const [shortName, setShortName] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [message, setMessage] = useState("");

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!displayName.trim() || !shortName.trim()) {
			setMessage("Display name and short name are required.");
			return;
		}

		setIsSaving(true);
		setMessage("");
		try {
			await onCreate({
				displayName: displayName.trim(),
				shortName: shortName.trim(),
				isActive: true,
				sortOrder: nextSortOrder,
			});
			setDisplayName("");
			setShortName("");
			setMessage("Team created.");
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Could not create team.");
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
			<h2 className="text-lg font-bold text-blue-950">Add a team</h2>
			<div className="mt-4 grid gap-4 sm:grid-cols-2">
				<label className="text-sm font-semibold text-slate-700">Display name
					<input value={displayName} maxLength={50} onChange={(event) => setDisplayName(event.target.value)} placeholder="e.g. Under 18s" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
				</label>
				<label className="text-sm font-semibold text-slate-700">Short name
					<input value={shortName} maxLength={20} onChange={(event) => setShortName(event.target.value)} placeholder="e.g. U18" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" />
				</label>
			</div>
			<div className="mt-4 flex items-center justify-between gap-3">
				<p className={`text-sm ${message === "Team created." ? "text-green-700" : "text-red-700"}`}>{message}</p>
				<button type="submit" disabled={isSaving} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{isSaving ? "Creating..." : "Create team"}</button>
			</div>
		</form>
	);
}
