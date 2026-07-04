import { useEffect, useState, type FormEvent } from "react";
import { organizationApi } from "../../services/organizationApi";
import type { Organization } from "../../types/organization";
import { PlatformBillingModal } from "./PlatformBillingModal";
import ConfirmationModal from "../../components/compositions/ConfirmationModal";

export default function PlatformOrganizations() {
	const [organizations, setOrganizations] = useState<Organization[]>([]);
	const [editing, setEditing] = useState<Organization | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [billingOrganization, setBillingOrganization] = useState<Organization | null>(null);
	const [deletingOrganization, setDeletingOrganization] = useState<Organization | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		organizationApi
			.getPlatformOrganizations()
			.then(setOrganizations)
			.catch((reason) =>
				setError(
					reason instanceof Error
						? reason.message
						: "Failed to load organizations."
				)
			)
			.finally(() => setLoading(false));
	}, []);

	async function save(values: { name: string; slug: string }) {
		try {
			const saved = editing
				? await organizationApi.updatePlatformOrganization({
						...editing,
						...values,
					})
				: await organizationApi.createPlatformOrganization(values);
			setOrganizations((current) =>
				editing
					? current.map((item) => (item.id === saved.id ? saved : item))
					: [...current, saved].sort((a, b) => a.name.localeCompare(b.name))
			);
			setEditing(null);
			setIsCreating(false);
			setError("");
		} catch (reason) {
			setError(
				reason instanceof Error
					? reason.message
					: "Failed to save organization."
			);
			throw reason;
		}
	}

	async function toggleActive(organization: Organization) {
		try {
			const updated = await organizationApi.setPlatformOrganizationActive(
				organization.id,
				!organization.isActive
			);
			setOrganizations((current) =>
				current.map((item) => (item.id === updated.id ? updated : item))
			);
		} catch (reason) {
			setError(
				reason instanceof Error
					? reason.message
					: "Failed to update organization."
			);
		}
	}

	async function deleteOrganization() {
		if (!deletingOrganization) return;
		setIsDeleting(true);
		setError("");
		try {
			await organizationApi.deletePlatformOrganization(deletingOrganization.id);
			setOrganizations((current) =>
				current.filter((item) => item.id !== deletingOrganization.id)
			);
			setDeletingOrganization(null);
		} catch (reason) {
			setError(
				reason instanceof Error
					? reason.message
					: "Failed to delete organization."
			);
			setDeletingOrganization(null);
		} finally {
			setIsDeleting(false);
		}
	}

	if (loading) {
		return <p className="text-sm text-slate-500">Loading organizations...</p>;
	}

	return (
		<div className="mx-auto max-w-6xl space-y-6">
			<header className="surface-card flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-xs font-black uppercase tracking-[.14em] text-yepset-600">
						Site administration
					</p>
					<h1 className="mt-2 text-3xl font-black tracking-[-.03em]">
						Organizations
					</h1>
					<p className="mt-1 text-sm text-slate-500">
						Create, maintain and archive customer organizations.
					</p>
				</div>
				<button
					type="button"
					onClick={() => {
						setEditing(null);
						setIsCreating(true);
					}}
					className="btn-primary"
				>
					Add organization
				</button>
			</header>

			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
					{error}
				</div>
			)}

			<div className="grid gap-4 md:grid-cols-2">
				{organizations.map((organization) => (
					<article key={organization.id} className="surface-card p-5">
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<h2 className="truncate text-lg font-bold">
									{organization.name}
								</h2>
								<p className="mt-1 truncate text-sm text-slate-500">
									{organization.slug}
								</p>
							</div>
							<span
								className={`rounded-full px-2.5 py-1 text-xs font-bold ${
									organization.isActive
										? "bg-emerald-100 text-emerald-700"
										: "bg-slate-200 text-slate-600"
								}`}
							>
								{organization.isActive ? "Active" : "Archived"}
							</span>
						</div>
						<div className="mt-5 flex flex-wrap gap-2">
							<button
								type="button"
								onClick={() => {
									setEditing(organization);
									setIsCreating(false);
								}}
								className="btn-secondary"
							>
								Edit
							</button>
							<button
								type="button"
								onClick={() => setBillingOrganization(organization)}
								className="btn-secondary"
							>
								Billing
							</button>
							<button
								type="button"
								onClick={() => void toggleActive(organization)}
								className="btn-secondary"
							>
								{organization.isActive ? "Archive" : "Restore"}
							</button>
							{!organization.isActive && (
								<button
									type="button"
									onClick={() => setDeletingOrganization(organization)}
									className="btn-secondary text-red-700"
								>
									Delete
								</button>
							)}
						</div>
					</article>
				))}
			</div>

			{(isCreating || editing) && (
				<OrganizationModal
					organization={editing}
					onClose={() => {
						setEditing(null);
						setIsCreating(false);
					}}
					onSave={save}
				/>
			)}
			{billingOrganization && (
				<PlatformBillingModal
					organization={billingOrganization}
					onClose={() => setBillingOrganization(null)}
				/>
			)}
			<ConfirmationModal
				isOpen={Boolean(deletingOrganization)}
				title="Permanently delete organization?"
				message="Deletion is only allowed when the organization has no clubs. Organizations containing club data must remain archived."
				confirmText="Delete organization"
				variant="danger"
				isBusy={isDeleting}
				onCancel={() => setDeletingOrganization(null)}
				onConfirm={deleteOrganization}
			/>
		</div>
	);
}

function OrganizationModal({
	organization,
	onClose,
	onSave,
}: {
	organization: Organization | null;
	onClose: () => void;
	onSave: (values: { name: string; slug: string }) => Promise<void>;
}) {
	const [name, setName] = useState(organization?.name ?? "");
	const [slug, setSlug] = useState(organization?.slug ?? "");
	const [saving, setSaving] = useState(false);

	async function submit(event: FormEvent) {
		event.preventDefault();
		setSaving(true);
		try {
			await onSave({ name: name.trim(), slug: slugify(slug) });
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 grid place-items-center bg-yepset-950/60 p-4 backdrop-blur-sm">
			<form
				onSubmit={(event) => void submit(event)}
				className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-5 shadow-2xl"
			>
				<div className="flex items-start justify-between">
					<div>
						<h2 className="text-xl font-bold">
							{organization ? "Edit organization" : "Add organization"}
						</h2>
						<p className="text-sm text-slate-500">
							Configure the customer organization identity.
						</p>
					</div>
					<button type="button" onClick={onClose} aria-label="Close">
						✕
					</button>
				</div>
				<label className="block text-sm font-semibold text-slate-700">
					Name
					<input
						value={name}
						onChange={(event) => {
							setName(event.target.value);
							if (!organization) setSlug(slugify(event.target.value));
						}}
						className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
					/>
				</label>
				<label className="block text-sm font-semibold text-slate-700">
					Slug
					<input
						value={slug}
						onChange={(event) => setSlug(slugify(event.target.value))}
						className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
					/>
				</label>
				<div className="flex justify-end gap-2 border-t pt-4">
					<button type="button" onClick={onClose} className="btn-secondary">
						Cancel
					</button>
					<button
						disabled={saving || !name.trim() || !slug}
						className="btn-primary disabled:opacity-50"
					>
						{saving ? "Saving..." : "Save organization"}
					</button>
				</div>
			</form>
		</div>
	);
}

function slugify(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}
