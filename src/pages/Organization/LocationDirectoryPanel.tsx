import { useEffect, useMemo, useState, type FormEvent } from "react";

import ConfirmationModal from "../../components/compositions/ConfirmationModal";
import { useOrganizationLocationsStore } from "../../stores/organizationLocations";
import type { OrganizationLocation } from "../../types/locations";

export default function LocationDirectoryPanel() {
	const locations = useOrganizationLocationsStore((state) => state.locations);
	const isLoading = useOrganizationLocationsStore((state) => state.isLoading);
	const loadError = useOrganizationLocationsStore((state) => state.error);
	const loadLocations = useOrganizationLocationsStore((state) => state.loadLocations);
	const createLocation = useOrganizationLocationsStore((state) => state.createLocation);
	const updateLocation = useOrganizationLocationsStore((state) => state.updateLocation);
	const deleteLocation = useOrganizationLocationsStore((state) => state.deleteLocation);
	const [editing, setEditing] = useState<OrganizationLocation | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [deleting, setDeleting] = useState<OrganizationLocation | null>(null);
	const [search, setSearch] = useState("");
	const [actionError, setActionError] = useState("");
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		void loadLocations();
	}, [loadLocations]);

	const visibleLocations = useMemo(() => {
		const query = search.trim().toLowerCase();
		return locations.filter((location) =>
			!query || `${location.name} ${location.address} ${location.notes}`.toLowerCase().includes(query)
		);
	}, [locations, search]);

	async function handleSave(values: LocationFormValues) {
		try {
			if (editing) {
				await updateLocation(editing.id, values);
			} else {
				await createLocation(values);
			}
			setEditing(null);
			setIsCreating(false);
			setActionError("");
		} catch (error) {
			const message = error instanceof Error ? error.message : "Could not save location.";
			setActionError(message);
			throw error;
		}
	}

	async function handleDelete() {
		if (!deleting) return;
		setIsDeleting(true);
		try {
			await deleteLocation(deleting.id);
			setDeleting(null);
			setActionError("");
		} catch (error) {
			setActionError(error instanceof Error ? error.message : "Could not delete location.");
		} finally {
			setIsDeleting(false);
		}
	}

	return (
		<section className="surface-card p-5">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h2 className="text-lg font-bold text-slate-950">Known locations</h2>
					<p className="mt-1 text-sm text-slate-500">Save regular grounds and venues for quick selection on matches and events.</p>
				</div>
				<button type="button" onClick={() => { setEditing(null); setIsCreating(true); }} className="btn-primary">Add location</button>
			</div>

			{actionError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{actionError}</p>}
			{loadError && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">{loadError}</p>}

			<div className="mt-4">
				<input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 sm:max-w-sm" placeholder="Search locations or addresses" />
			</div>

			{isLoading && locations.length === 0 ? (
				<p className="mt-4 text-sm font-medium text-slate-500">Loading known locations…</p>
			) : visibleLocations.length === 0 ? (
				<div className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">{locations.length === 0 ? "No known locations have been added yet." : "No locations match this search."}</div>
			) : (
				<div className="mt-4 grid gap-3 md:grid-cols-2">
					{visibleLocations.map((location) => (
						<article key={location.id} className="rounded-2xl border border-slate-200 p-4">
							<div className="flex items-start justify-between gap-3">
								<div><h3 className="font-bold text-slate-950">{location.name}</h3><p className="mt-1 whitespace-pre-line text-sm text-slate-600">{location.address}</p></div>
								<span className={`rounded-full px-2 py-1 text-xs font-bold ${location.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>{location.isActive ? "Active" : "Inactive"}</span>
							</div>
							{location.notes && <p className="mt-3 text-xs text-slate-500">{location.notes}</p>}
							<div className="mt-4 flex gap-2"><button type="button" onClick={() => { setEditing(location); setIsCreating(false); }} className="btn-secondary">Edit</button><button type="button" onClick={() => setDeleting(location)} className="btn-secondary border-red-200 text-red-700 hover:bg-red-50">Delete</button></div>
						</article>
					))}
				</div>
			)}

			{(isCreating || editing) && <LocationModal location={editing} onClose={() => { setEditing(null); setIsCreating(false); }} onSave={handleSave} />}
			<ConfirmationModal isOpen={Boolean(deleting)} title={`Delete ${deleting?.name ?? "location"}?`} message="This removes it from the known-location picker. Existing matches and events keep their saved address." confirmText="Delete location" isBusy={isDeleting} variant="danger" onCancel={() => setDeleting(null)} onConfirm={handleDelete} />
		</section>
	);
}

type LocationFormValues = Pick<OrganizationLocation, "name" | "address" | "notes" | "isActive">;

function LocationModal({ location, onClose, onSave }: { location: OrganizationLocation | null; onClose: () => void; onSave: (values: LocationFormValues) => Promise<void> }) {
	const [name, setName] = useState(location?.name ?? "");
	const [address, setAddress] = useState(location?.address ?? "");
	const [notes, setNotes] = useState(location?.notes ?? "");
	const [isActive, setIsActive] = useState(location?.isActive ?? true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();
		if (!name.trim() || !address.trim()) {
			setError("Name and address are required.");
			return;
		}
		setIsSaving(true);
		setError("");
		try {
			await onSave({ name: name.trim(), address: address.trim(), notes: notes.trim(), isActive });
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Could not save location.");
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 grid place-items-center bg-yepset-950/55 p-4 backdrop-blur-sm">
			<form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-5 shadow-2xl">
				<div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{location ? "Edit location" : "Add location"}</h2><p className="text-sm text-slate-500">Create a searchable venue for matches and events.</p></div><button type="button" onClick={onClose}>✕</button></div>
				{error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
				<label className="block text-sm font-semibold text-slate-700">Name<input value={name} maxLength={100} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="e.g. The Hut" /></label>
				<label className="block text-sm font-semibold text-slate-700">Address<textarea value={address} maxLength={300} onChange={(event) => setAddress(event.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Full postal address" /></label>
				<label className="block text-sm font-semibold text-slate-700">Notes <span className="font-normal text-slate-400">(optional)</span><textarea value={notes} maxLength={500} onChange={(event) => setNotes(event.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Parking, entrance or access notes" /></label>
				<label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} /><span><strong className="block text-sm text-slate-900">Available in location picker</strong><span className="text-xs text-slate-500">Inactive locations remain stored but cannot be newly selected.</span></span></label>
				<div className="flex justify-end gap-2 border-t pt-4"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button disabled={isSaving} className="btn-primary disabled:opacity-60">{isSaving ? "Saving…" : "Save location"}</button></div>
			</form>
		</div>
	);
}
