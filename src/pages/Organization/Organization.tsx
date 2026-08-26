import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { organizationApi } from "../../services/organizationApi";
import type { Organization as OrganizationModel, SportsClub } from "../../types/organization";
import { sportDefinitions } from "../../constants/sports";
import { getManagedImageValidationError, uploadLinkedFile } from "../../services/fileService";
import { filesApi } from "../../services/filesApi";
import ManagedFileImage from "../../components/files/ManagedFileImage";
import { FormationManagerModal } from "./FormationManagerModal";
import { useAuthStore } from "../../stores/auth";
import { OrganizationDashboardPanel } from "./OrganizationDashboardPanel";
import OrganizationAdminNav from "../../components/organization/OrganizationAdminNav";
import ConfirmationModal from "../../components/compositions/ConfirmationModal";

const sports = Object.keys(sportDefinitions);

export default function Organization() {
	const currentUser = useAuthStore((state) => state.currentUser);
	const canManageOrganization =
		currentUser?.isPlatformAdmin ||
		currentUser?.tenantRole === "OrganizationAdmin";
	const [organization, setOrganization] = useState<OrganizationModel | null>(null);
	const [clubs, setClubs] = useState<SportsClub[]>([]);
	const [editingClub, setEditingClub] = useState<SportsClub | null>(null);
	const [formationClub, setFormationClub] = useState<SportsClub | null>(null);
	const [deletingClub, setDeletingClub] = useState<SportsClub | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
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

	async function saveClub(values: Pick<SportsClub, "name" | "slug" | "sportKey" | "primaryColor" | "secondaryColor">) {
		try {
			if (editingClub) {
				const updated = await organizationApi.updateClub({
					...editingClub,
					...values,
					customFormations:
						editingClub.sportKey === values.sportKey
							? editingClub.customFormations
							: [],
					defaultFormationKey:
						editingClub.sportKey === values.sportKey
							? editingClub.defaultFormationKey
							: "",
				});
				setClubs((current) => current.map((club) => club.id === updated.id ? updated : club));
				updateClubAccess(updated);
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

	async function deleteClub() {
		if (!deletingClub) return;
		setIsDeleting(true);
		try {
			await organizationApi.deleteClub(deletingClub.id);
			setClubs((current) => current.filter((club) => club.id !== deletingClub.id));
			useAuthStore.setState((state) => ({
				availableClubs: state.availableClubs.filter(
					(club) => club.id !== deletingClub.id
				),
			}));
			setDeletingClub(null);
			setError("");
		} catch (deleteError) {
			setError(
				deleteError instanceof Error
					? deleteError.message
					: "Failed to delete club."
			);
		} finally {
			setIsDeleting(false);
		}
	}

	async function saveClubFormations(
		club: SportsClub,
		customFormations: SportsClub["customFormations"],
		defaultFormationKey: string
	) {
		try {
			const updated = await organizationApi.updateClub({
				...club,
				customFormations,
				defaultFormationKey,
			});
			setClubs((current) =>
				current.map((item) => (item.id === updated.id ? updated : item))
			);
			updateClubAccess(updated);
			setFormationClub(null);
			setError("");
		} catch (saveError) {
			setError(
				saveError instanceof Error
					? saveError.message
					: "Failed to save formations."
			);
			throw saveError;
		}
	}

	async function changeClubLogo(club: SportsClub, file: File) {
		const validationError = await getManagedImageValidationError(file, "club-logo");
		if (validationError) {
			setError(validationError);
			return;
		}
		try {
			const uploaded = await uploadLinkedFile({
				file,
				linkedEntityType: "ClubLogo",
				linkedEntityId: club.id,
			});
			const updated = await filesApi.assignClubLogo(uploaded.id);
			setClubs((current) => current.map((item) => item.id === updated.id ? updated : item));
			setError("");
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Failed to update club logo.");
		}
	}

	async function removeClubLogo(club: SportsClub) {
		try {
			const updated = await filesApi.removeClubLogo(club.id);
			setClubs((current) => current.map((item) => item.id === updated.id ? updated : item));
			setError("");
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Failed to remove club logo.");
		}
	}

	if (isLoading) return <p className="text-sm text-slate-500">Loading organization...</p>;

	return (
		<div className="mx-auto max-w-6xl space-y-6">
			<OrganizationAdminNav />
			<div className="surface-card flex flex-col gap-3 p-6 sm:flex-row sm:items-end sm:justify-between">
				<div><p className="text-xs font-black uppercase tracking-[.14em] text-yepset-600">Administration</p><h1 className="mt-2 text-3xl font-black tracking-[-.03em]">Organization and clubs</h1></div>
				{canManageOrganization && <button onClick={() => { setEditingClub(null); setIsCreating(true); }} className="btn-primary">Add club</button>}
			</div>

			{error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

			{organization && canManageOrganization && (
				<form onSubmit={saveOrganization} className="surface-card p-5">
					<h2 className="text-lg font-bold">Organization details</h2>
					<div className="mt-4 grid gap-4 sm:grid-cols-2">
						<Field label="Name" value={organization.name} onChange={(name) => setOrganization({ ...organization, name })} />
						<Field label="Slug" value={organization.slug} onChange={(slug) => setOrganization({ ...organization, slug: slugify(slug) })} />
					</div>
					<div className="mt-4 flex justify-end"><button className="btn-primary">Save organization</button></div>
				</form>
			)}

			{canManageOrganization && <OrganizationDashboardPanel clubs={clubs} />}

			<section className="space-y-3">
				<div><h2 className="text-xl font-bold">Clubs</h2><p className="text-sm text-slate-500">Each club has its own sport, teams and operational data.</p></div>
				<div className="grid gap-4 md:grid-cols-2">
					{clubs.map((club) => (
						<article key={club.id} className="surface-card p-5 transition hover:border-yepset-200">
							<div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3">{club.logoFileId ? <ManagedFileImage fileId={club.logoFileId} alt={`${club.name} logo`} className="h-16 w-16 rounded-xl object-contain" /> : <div className="grid h-16 w-16 place-items-center rounded-xl bg-yepset-100 text-xl font-black text-yepset-700">{club.name.charAt(0)}</div>}<div><h3 className="font-bold text-slate-900">{club.name}</h3><p className="mt-1 text-sm text-slate-500">{labelSport(club.sportKey)} · {club.slug}</p></div></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${club.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{club.isActive ? "Active" : "Archived"}</span></div>
							<div className="mt-5 flex flex-wrap gap-2">{useAuthStore.getState().availableClubs.some((item) => item.id === club.id && item.isCurrent) && <Link to="/club-setup" className="btn-primary">Guided setup</Link>}<button onClick={() => setFormationClub(club)} className="btn-secondary w-full justify-center sm:w-auto">Formations &amp; default</button><button onClick={() => { setEditingClub(club); setIsCreating(false); }} className="btn-secondary">Edit</button><label className="btn-secondary cursor-pointer">Change logo<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void changeClubLogo(club, file); event.target.value = ""; }} /></label>{club.logoFileId && <button onClick={() => void removeClubLogo(club)} className="btn-secondary text-red-700">Remove logo</button>}{canManageOrganization && <button onClick={() => void toggleClub(club)} className="btn-secondary">{club.isActive ? "Archive" : "Restore"}</button>}{canManageOrganization && !club.isActive && <button onClick={() => setDeletingClub(club)} className="btn-secondary border-red-200 text-red-700 hover:bg-red-50">Delete</button>}</div>
						</article>
					))}
				</div>
			</section>

			{(isCreating || editingClub) && <ClubModal club={editingClub} onClose={() => { setEditingClub(null); setIsCreating(false); }} onManageFormations={editingClub ? () => { setFormationClub(editingClub); setEditingClub(null); } : undefined} onSave={saveClub} />}
			{formationClub && <FormationManagerModal club={formationClub} onClose={() => setFormationClub(null)} onSave={(formations, defaultFormationKey) => saveClubFormations(formationClub, formations, defaultFormationKey)} />}
			<ConfirmationModal
				isOpen={deletingClub !== null}
				title={`Delete ${deletingClub?.name ?? "club"}?`}
				message="This permanently deletes the club. The club must be archived, you must be working in a different club, and it cannot have teams, users or operational data."
				confirmText="Delete club"
				isBusy={isDeleting}
				variant="danger"
				onCancel={() => setDeletingClub(null)}
				onConfirm={deleteClub}
			/>
		</div>
	);
}

function ClubModal({ club, onClose, onManageFormations, onSave }: { club: SportsClub | null; onClose: () => void; onManageFormations?: () => void; onSave: (values: Pick<SportsClub, "name" | "slug" | "sportKey" | "primaryColor" | "secondaryColor">) => Promise<void> }) {
	const [name, setName] = useState(club?.name ?? "");
	const [slug, setSlug] = useState(club?.slug ?? "");
	const [sportKey, setSportKey] = useState(club?.sportKey ?? "football");
	const [primaryColor, setPrimaryColor] = useState(club?.primaryColor ?? "#0f766e");
	const [secondaryColor, setSecondaryColor] = useState(club?.secondaryColor ?? "#d9f99d");
	const [saving, setSaving] = useState(false);
	return <div className="fixed inset-0 z-50 grid place-items-center bg-yepset-950/55 p-4 backdrop-blur-sm"><form onSubmit={(event) => { event.preventDefault(); setSaving(true); void onSave({ name: name.trim(), slug: slugify(slug), sportKey, primaryColor, secondaryColor }).finally(() => setSaving(false)); }} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-5 shadow-2xl"><div className="flex justify-between"><div><h2 className="text-xl font-bold">{club ? "Edit club" : "Add club"}</h2><p className="text-sm text-slate-500">Configure the club’s identity, colours and sport.</p></div><button type="button" onClick={onClose}>✕</button></div><Field label="Name" value={name} onChange={(value) => { setName(value); if (!club) setSlug(slugify(value)); }} /><Field label="Slug" value={slug} onChange={(value) => setSlug(slugify(value))} /><label className="block text-sm font-semibold text-slate-700">Sport<select value={sportKey} onChange={(event) => setSportKey(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2">{sports.map((sport) => <option key={sport} value={sport}>{labelSport(sport)}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2"><ColorField label="Primary colour" value={primaryColor} onChange={setPrimaryColor} /><ColorField label="Secondary colour" value={secondaryColor} onChange={setSecondaryColor} /></div>{onManageFormations && <button type="button" onClick={onManageFormations} className="btn-secondary w-full justify-center">Manage formations</button>}<div className="flex flex-wrap justify-end gap-2 border-t pt-4"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button disabled={saving || !name.trim() || !slug} className="btn-primary disabled:opacity-50">{saving ? "Saving..." : "Save club"}</button></div></form></div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
	return <label className="block text-sm font-semibold text-slate-700">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-yepset-500 focus:ring-2 focus:ring-yepset-100" /></label>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
	return <label className="block text-sm font-semibold text-slate-700">{label}<span className="mt-1 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-2 py-1.5"><input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-11 cursor-pointer rounded border-0 bg-transparent p-0" /><span className="font-mono text-xs uppercase text-slate-600">{value}</span></span></label>;
}

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function labelSport(value: string) { return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }

function updateClubAccess(club: SportsClub) {
	useAuthStore.setState((state) => ({
		availableClubs: state.availableClubs.map((item) =>
			item.id === club.id
				? {
						...item,
						name: club.name,
						sportKey: club.sportKey,
						primaryColor: club.primaryColor,
						secondaryColor: club.secondaryColor,
						customFormations: club.customFormations,
						defaultFormationKey: club.defaultFormationKey,
					}
				: item
		),
	}));
}
