import { useEffect, useState, type FormEvent } from "react";
import { organizationApi } from "../../services/organizationApi";
import type { Organization as OrganizationModel, SportsClub } from "../../types/organization";
import { sportDefinitions } from "../../constants/sports";

const sports = Object.keys(sportDefinitions);

export default function Organization() {
	const [organization, setOrganization] = useState<OrganizationModel | null>(null);
	const [clubs, setClubs] = useState<SportsClub[]>([]);
	const [editingClub, setEditingClub] = useState<SportsClub | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		Promise.all([organizationApi.get(), organizationApi.getClubs()])
			.then(([loadedOrganization, loadedClubs]) => {
				setOrganization(loadedOrganization);
				setClubs(loadedClubs);
			})
			.catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Failed to load organization."))
			.finally(() => setIsLoading(false));
	}, []);

	async function saveOrganization(event: FormEvent) {
		event.preventDefault();
		if (!organization) return;
		try {
			setOrganization(await organizationApi.update(organization));
			setError("");
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Failed to save organization.");
		}
	}

	async function saveClub(values: Pick<SportsClub, "name" | "slug" | "sportKey">) {
		try {
			if (editingClub) {
				const updated = await organizationApi.updateClub({ ...editingClub, ...values });
				setClubs((current) => current.map((club) => club.id === updated.id ? updated : club));
			} else {
				const created = await organizationApi.createClub(values);
				setClubs((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
			}
			setEditingClub(null);
			setIsCreating(false);
			setError("");
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Failed to save club.");
		}
	}

	async function toggleClub(club: SportsClub) {
		try {
			const updated = await organizationApi.setClubActive(club.id, !club.isActive);
			setClubs((current) => current.map((item) => item.id === updated.id ? updated : item));
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Failed to update club.");
		}
	}

	if (isLoading) return <p className="text-sm text-slate-500">Loading organization...</p>;

	return (
		<div className="mx-auto max-w-6xl space-y-6">
			<div className="surface-card flex flex-col gap-3 p-6 sm:flex-row sm:items-end sm:justify-between">
				<div><p className="text-xs font-black uppercase tracking-[.14em] text-yepset-600">Administration</p><h1 className="mt-2 text-3xl font-black tracking-[-.03em]">Organization and clubs</h1></div>
				<button onClick={() => { setEditingClub(null); setIsCreating(true); }} className="btn-primary">Add club</button>
			</div>

			{error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

			{organization && (
				<form onSubmit={saveOrganization} className="surface-card p-5">
					<h2 className="text-lg font-bold">Organization details</h2>
					<div className="mt-4 grid gap-4 sm:grid-cols-2">
						<Field label="Name" value={organization.name} onChange={(name) => setOrganization({ ...organization, name })} />
						<Field label="Slug" value={organization.slug} onChange={(slug) => setOrganization({ ...organization, slug: slugify(slug) })} />
					</div>
					<div className="mt-4 flex justify-end"><button className="btn-primary">Save organization</button></div>
				</form>
			)}

			<section className="space-y-3">
				<div><h2 className="text-xl font-bold">Clubs</h2><p className="text-sm text-slate-500">Each club has its own sport, teams and operational data.</p></div>
				<div className="grid gap-4 md:grid-cols-2">
					{clubs.map((club) => (
						<article key={club.id} className="surface-card p-5 transition hover:border-yepset-200">
							<div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{club.name}</h3><p className="mt-1 text-sm text-slate-500">{labelSport(club.sportKey)} · {club.slug}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${club.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{club.isActive ? "Active" : "Archived"}</span></div>
							<div className="mt-5 flex gap-2"><button onClick={() => { setEditingClub(club); setIsCreating(false); }} className="btn-secondary">Edit</button><button onClick={() => void toggleClub(club)} className="btn-secondary">{club.isActive ? "Archive" : "Restore"}</button></div>
						</article>
					))}
				</div>
			</section>

			{(isCreating || editingClub) && <ClubModal club={editingClub} onClose={() => { setEditingClub(null); setIsCreating(false); }} onSave={saveClub} />}
		</div>
	);
}

function ClubModal({ club, onClose, onSave }: { club: SportsClub | null; onClose: () => void; onSave: (values: Pick<SportsClub, "name" | "slug" | "sportKey">) => Promise<void> }) {
	const [name, setName] = useState(club?.name ?? "");
	const [slug, setSlug] = useState(club?.slug ?? "");
	const [sportKey, setSportKey] = useState(club?.sportKey ?? "football");
	const [saving, setSaving] = useState(false);
	return <div className="fixed inset-0 z-50 grid place-items-center bg-yepset-950/55 p-4 backdrop-blur-sm"><form onSubmit={(event) => { event.preventDefault(); setSaving(true); void onSave({ name: name.trim(), slug: slugify(slug), sportKey }).finally(() => setSaving(false)); }} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-5 shadow-2xl"><div className="flex justify-between"><div><h2 className="text-xl font-bold">{club ? "Edit club" : "Add club"}</h2><p className="text-sm text-slate-500">Configure the club’s identity and sport.</p></div><button type="button" onClick={onClose}>✕</button></div><Field label="Name" value={name} onChange={(value) => { setName(value); if (!club) setSlug(slugify(value)); }} /><Field label="Slug" value={slug} onChange={(value) => setSlug(slugify(value))} /><label className="block text-sm font-semibold text-slate-700">Sport<select value={sportKey} onChange={(event) => setSportKey(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2">{sports.map((sport) => <option key={sport} value={sport}>{labelSport(sport)}</option>)}</select></label><div className="flex justify-end gap-2 border-t pt-4"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button disabled={saving || !name.trim() || !slug} className="btn-primary disabled:opacity-50">{saving ? "Saving..." : "Save club"}</button></div></form></div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
	return <label className="block text-sm font-semibold text-slate-700">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-yepset-500 focus:ring-2 focus:ring-yepset-100" /></label>;
}

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function labelSport(value: string) { return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
