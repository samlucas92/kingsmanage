import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { organizationApi } from "../../services/organizationApi";
import type {
	Organization,
	PlatformOrganizationOnboardingRequest,
	PlatformOrganizationOnboardingResult,
} from "../../types/organization";
import { sportDefinitions } from "../../constants/sports";
import { PlatformBillingModal } from "./PlatformBillingModal";
import ConfirmationModal from "../../components/compositions/ConfirmationModal";

export default function PlatformOrganizations() {
	const [organizations, setOrganizations] = useState<Organization[]>([]);
	const [editing, setEditing] = useState<Organization | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [billingOrganization, setBillingOrganization] = useState<Organization | null>(null);
	const [deletingOrganization, setDeletingOrganization] = useState<Organization | null>(null);
	const [onboardingResult, setOnboardingResult] = useState<PlatformOrganizationOnboardingResult | null>(null);
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

	async function saveOrganization(values: { name: string; slug: string }) {
		try {
			if (!editing) return;
			const saved = await organizationApi.updatePlatformOrganization({
				...editing,
				...values,
			});
			setOrganizations((current) =>
				current.map((item) => (item.id === saved.id ? saved : item))
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

	async function onboardOrganization(values: PlatformOrganizationOnboardingRequest) {
		try {
			const result = await organizationApi.onboardPlatformOrganization(values);
			setOrganizations((current) => [...current, result.organization]
				.sort((a, b) => a.name.localeCompare(b.name)));
			setOnboardingResult(result);
			setIsCreating(false);
			setError("");
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Failed to onboard organization.");
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
					Create organization
				</button>
			</header>

			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
					{error}
				</div>
			)}

			{onboardingResult && (
				<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<p className="text-sm font-black">{onboardingResult.organization.name} is ready</p>
							<p className="mt-1 text-sm text-emerald-800">
								{onboardingResult.club.name} and its Organization Admin account for {onboardingResult.administratorEmail} were created successfully.
							</p>
						</div>
						<button type="button" onClick={() => setOnboardingResult(null)} className="text-sm font-bold text-emerald-800">
							Dismiss
						</button>
					</div>
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

			{isCreating && (
				<OrganizationOnboardingWizard
					onClose={() => setIsCreating(false)}
					onSave={onboardOrganization}
				/>
			)}
			{editing && (
				<OrganizationModal
					organization={editing}
					onClose={() => {
						setEditing(null);
					}}
					onSave={saveOrganization}
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

const onboardingSteps = ["Organization", "First club", "Administrator", "Subscription"] as const;

function OrganizationOnboardingWizard({
	onClose,
	onSave,
}: {
	onClose: () => void;
	onSave: (values: PlatformOrganizationOnboardingRequest) => Promise<void>;
}) {
	const [step, setStep] = useState(0);
	const [saving, setSaving] = useState(false);
	const [submitError, setSubmitError] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [confirmPassword, setConfirmPassword] = useState("");
	const [values, setValues] = useState<PlatformOrganizationOnboardingRequest>({
		organizationName: "",
		organizationSlug: "",
		clubName: "",
		clubSlug: "",
		sportKey: "football",
		primaryColor: "#0f766e",
		secondaryColor: "#d9f99d",
		clubContactEmail: "",
		administratorEmail: "",
		temporaryPassword: generateTemporaryPassword(),
		clubAllowance: 1,
		billingEmail: "",
		subscriptionStatus: "Trialing",
	});

	const update = <Field extends keyof PlatformOrganizationOnboardingRequest>(
		field: Field,
		value: PlatformOrganizationOnboardingRequest[Field]
	) => setValues((current) => ({ ...current, [field]: value }));
	const stepError = getOnboardingStepError(step, values, confirmPassword);

	async function submit(event: FormEvent) {
		event.preventDefault();
		if (step < onboardingSteps.length - 1) {
			if (!stepError) setStep((current) => current + 1);
			return;
		}
		if (stepError) return;

		setSaving(true);
		setSubmitError("");
		try {
			await onSave({
				...values,
				billingEmail: values.billingEmail || values.administratorEmail,
				clubContactEmail: values.clubContactEmail || values.administratorEmail,
			});
		} catch (reason) {
			setSubmitError(
				reason instanceof Error
					? reason.message
					: "The organization workspace could not be created."
			);
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-yepset-950/60 p-3 backdrop-blur-sm sm:p-5">
			<form onSubmit={(event) => void submit(event)} className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100vh-2.5rem)]">
				<header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
					<div>
						<p className="text-xs font-black uppercase tracking-[.14em] text-yepset-600">Organization onboarding</p>
						<h2 className="mt-1 text-xl font-black sm:text-2xl">Create a ready-to-use workspace</h2>
					</div>
					<button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl hover:bg-slate-100" aria-label="Close">✕</button>
				</header>

				<div className="border-b border-slate-200 px-4 py-3 sm:px-6">
					<ol className="grid grid-cols-4 gap-2">
						{onboardingSteps.map((label, index) => (
							<li key={label} className="min-w-0">
								<div className={`h-1.5 rounded-full ${index <= step ? "bg-yepset-600" : "bg-slate-200"}`} />
								<span className={`mt-1.5 block truncate text-[10px] font-bold sm:text-xs ${index === step ? "text-yepset-800" : "text-slate-500"}`}>{label}</span>
							</li>
						))}
					</ol>
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
					{step === 0 && (
						<WizardSection title="Organization identity" description="This is the customer account that will contain its clubs, teams and billing.">
							<WizardInput label="Organization name" value={values.organizationName} autoFocus onChange={(organizationName) => {
								update("organizationName", organizationName);
								update("organizationSlug", slugify(organizationName));
							}} />
							<WizardInput label="Organization slug" value={values.organizationSlug} hint="Used as the stable account identifier." onChange={(value) => update("organizationSlug", slugify(value))} />
						</WizardSection>
					)}

					{step === 1 && (
						<WizardSection title="First club" description="The administrator will land in this club after their first sign-in.">
							<div className="grid gap-4 sm:grid-cols-2">
								<WizardInput label="Club name" value={values.clubName} autoFocus onChange={(clubName) => {
									update("clubName", clubName);
									update("clubSlug", slugify(clubName));
								}} />
								<WizardInput label="Club slug" value={values.clubSlug} onChange={(value) => update("clubSlug", slugify(value))} />
							</div>
							<label className="block text-sm font-bold text-slate-700">Sport
								<select value={values.sportKey} onChange={(event) => update("sportKey", event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm">
									{Object.values(sportDefinitions).map((sport) => <option key={sport.key} value={sport.key}>{sport.name}</option>)}
								</select>
							</label>
							<div className="grid grid-cols-2 gap-4">
								<ColorInput label="Primary colour" value={values.primaryColor} onChange={(value) => update("primaryColor", value)} />
								<ColorInput label="Secondary colour" value={values.secondaryColor} onChange={(value) => update("secondaryColor", value)} />
							</div>
							<WizardInput type="email" label="Club contact email (optional)" value={values.clubContactEmail} onChange={(value) => update("clubContactEmail", value)} />
						</WizardSection>
					)}

					{step === 2 && (
						<WizardSection title="Organization administrator" description="This account receives organization-wide access and can add clubs, staff and teams.">
							<WizardInput type="email" label="Administrator email" value={values.administratorEmail} autoFocus onChange={(administratorEmail) => {
								update("administratorEmail", administratorEmail);
								update("billingEmail", administratorEmail);
							}} />
							<div className="grid gap-4 sm:grid-cols-2">
								<WizardInput type={showPassword ? "text" : "password"} label="Temporary password" value={values.temporaryPassword} onChange={(value) => update("temporaryPassword", value)} />
								<WizardInput type={showPassword ? "text" : "password"} label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} />
							</div>
							<div className="flex flex-wrap items-center gap-3">
								<button type="button" onClick={() => {
									const password = generateTemporaryPassword();
									update("temporaryPassword", password);
									setConfirmPassword(password);
									setShowPassword(true);
								}} className="btn-secondary px-3 py-2 text-xs">Generate password</button>
								<label className="flex items-center gap-2 text-sm font-semibold text-slate-600"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />Show password</label>
							</div>
							<p className="rounded-xl bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900">Share this temporary password securely. The administrator can change it from Settings after signing in.</p>
						</WizardSection>
					)}

					{step === 3 && (
						<WizardSection title="Subscription and review" description="Choose how the new workspace starts. Billing can be adjusted later.">
							<div className="grid gap-4 sm:grid-cols-2">
								<label className="block text-sm font-bold text-slate-700">Starting status
									<select value={values.subscriptionStatus} onChange={(event) => update("subscriptionStatus", event.target.value as "Trialing" | "Active")} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 shadow-sm">
										<option value="Trialing">Trialing</option>
										<option value="Active">Active</option>
									</select>
								</label>
								<label className="block text-sm font-bold text-slate-700">Club allowance
									<input type="number" min={1} max={100} value={values.clubAllowance} onChange={(event) => update("clubAllowance", Number(event.target.value))} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 shadow-sm" />
								</label>
							</div>
							<WizardInput type="email" label="Billing email" value={values.billingEmail} onChange={(value) => update("billingEmail", value)} />
							<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
								<h3 className="font-black text-slate-900">Ready to create</h3>
								<dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
									<ReviewItem label="Organization" value={values.organizationName} />
									<ReviewItem label="First club" value={`${values.clubName} · ${sportDefinitions[values.sportKey]?.name ?? values.sportKey}`} />
									<ReviewItem label="Administrator" value={values.administratorEmail} />
									<ReviewItem label="Subscription" value={`${values.subscriptionStatus} · ${values.clubAllowance} club${values.clubAllowance === 1 ? "" : "s"}`} />
								</dl>
							</div>
						</WizardSection>
					)}

					{stepError && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{stepError}</p>}
					{submitError && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{submitError}</p>}
				</div>

				<footer className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-4 sm:px-6">
					<button type="button" onClick={() => step === 0 ? onClose() : setStep((current) => current - 1)} className="btn-secondary">
						{step === 0 ? "Cancel" : "Back"}
					</button>
					<button disabled={Boolean(stepError) || saving} className="btn-primary disabled:cursor-not-allowed disabled:opacity-45">
						{saving ? "Creating workspace…" : step === onboardingSteps.length - 1 ? "Create workspace" : "Continue"}
					</button>
				</footer>
			</form>
		</div>
	);
}

function WizardSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
	return <section className="space-y-4"><div><h3 className="text-lg font-black text-slate-900">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{description}</p></div>{children}</section>;
}

function WizardInput({ label, value, onChange, type = "text", hint, autoFocus = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; hint?: string; autoFocus?: boolean }) {
	return <label className="block text-sm font-bold text-slate-700">{label}<input type={type} value={value} autoFocus={autoFocus} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 shadow-sm" />{hint && <span className="mt-1 block text-xs font-medium text-slate-500">{hint}</span>}</label>;
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
	return <label className="text-sm font-bold text-slate-700">{label}<span className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-2 py-2 shadow-sm"><input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-8 w-10 cursor-pointer border-0 bg-transparent p-0" /><input value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 border-0 p-0 font-mono text-sm uppercase outline-none" /></span></label>;
}

function ReviewItem({ label, value }: { label: string; value: string }) {
	return <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 font-semibold text-slate-900">{value}</dd></div>;
}

export function getOnboardingStepError(step: number, values: PlatformOrganizationOnboardingRequest, confirmPassword: string) {
	if (step === 0 && (!values.organizationName.trim() || !values.organizationSlug)) return "Enter an organization name and slug to continue.";
	if (step === 1 && (!values.clubName.trim() || !values.clubSlug || !values.sportKey)) return "Enter the first club details to continue.";
	if (step === 2) {
		if (!/^\S+@\S+\.\S+$/.test(values.administratorEmail)) return "Enter a valid administrator email.";
		if (values.temporaryPassword.length < 8) return "The temporary password must contain at least 8 characters.";
		if (values.temporaryPassword !== confirmPassword) return "The temporary passwords do not match.";
	}
	if (step === 3) {
		if (values.clubAllowance < 1 || values.clubAllowance > 100) return "Club allowance must be between 1 and 100.";
		if (values.billingEmail && !/^\S+@\S+\.\S+$/.test(values.billingEmail)) return "Enter a valid billing email.";
	}
	return "";
}

export function generateTemporaryPassword() {
	return `Yp!${crypto.randomUUID().replaceAll("-", "").slice(0, 13)}`;
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
							{organization ? "Edit organization" : "Create organization"}
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
