import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import ManagedFileImage from "../../components/files/ManagedFileImage";
import { sportDefinitions } from "../../constants/sports";
import { clubSetupApi, type CreateSetupStaffRequest } from "../../services/clubSetupApi";
import { clubTeamsApi } from "../../services/clubTeamsApi";
import { filesApi } from "../../services/filesApi";
import {
	getManagedImageValidationError,
	uploadLinkedFile,
} from "../../services/fileService";
import { organizationApi } from "../../services/organizationApi";
import { useAuthStore } from "../../stores/auth";
import type { ClubTeamProfile } from "../../stores/clubTeams";
import type { ClubVenue, SportsClub } from "../../types/organization";
import {
	buildSetupChecklist,
	getSuggestedTeamNames,
	isSetupComplete,
	setupSteps,
} from "./setupModel";
import { SetupProgress } from "./SetupProgress";
import OrganizationAdminNav from "../../components/organization/OrganizationAdminNav";

type TeamDraft = ClubTeamProfile & { isNew?: boolean };

export default function ClubSetup() {
	const navigate = useNavigate();
	const currentUser = useAuthStore((state) => state.currentUser);
	const activeClubId = useAuthStore(
		(state) => state.availableClubs.find((club) => club.isCurrent)?.id
	);
	const [club, setClub] = useState<SportsClub | null>(null);
	const [teams, setTeams] = useState<TeamDraft[]>([]);
	const [step, setStep] = useState(0);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const canInviteStaff =
		currentUser?.isPlatformAdmin ||
		currentUser?.tenantRole === "OrganizationAdmin";

	useEffect(() => {
		let active = true;
		Promise.all([organizationApi.getClubs(), clubTeamsApi.getAll()])
			.then(([clubs, loadedTeams]) => {
				if (!active) return;
				const currentClub =
					clubs.find((item) => item.id === activeClubId) ?? clubs[0];
				if (!currentClub) {
					setError("Select a club before starting setup.");
					return;
				}
				const suggestedNames = getSuggestedTeamNames(currentClub.sportKey);
				const setupTeams = loadedTeams.map((team, index) => {
					const isUntouchedDefault =
						(currentClub.setupStep ?? 0) === 0 &&
						index < suggestedNames.length &&
						(team.displayName === "First Team" ||
							team.displayName === "Second Team");
					return isUntouchedDefault
						? {
								...team,
								displayName: suggestedNames[index],
								shortName: suggestedNames[index],
							}
						: { ...team };
				});
				setClub(normaliseClub(currentClub));
				setTeams(setupTeams);
				setStep(Math.min(currentClub.setupStep ?? 0, setupSteps.length - 1));
			})
			.catch((reason) => {
				if (active) {
					setError(
						reason instanceof Error
							? reason.message
							: "Could not load club setup."
					);
				}
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, [activeClubId]);

	const checklist = useMemo(
		() => (club ? buildSetupChecklist(club, teams, currentUser) : []),
		[club, currentUser, teams]
	);

	async function saveClub(nextStep: number, completed = false) {
		if (!club) return;
		setSaving(true);
		setError("");
		try {
			const updated = await organizationApi.updateClub({
				...club,
				setupStep: Math.max(club.setupStep ?? 0, nextStep),
				setupCompletedAt: completed
					? new Date().toISOString()
					: club.setupCompletedAt,
			});
			setClub(normaliseClub(updated));
			setStep(nextStep);
			updateClubAccess(updated);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Could not save setup.");
			throw reason;
		} finally {
			setSaving(false);
		}
	}

	async function saveTeams() {
		const invalid = teams.find(
			(team) =>
				!team.displayName.trim() ||
				!team.shortName.trim() ||
				!team.competitions.some((competition) => competition.trim())
		);
		if (invalid) {
			setError("Every team needs a name, short name and at least one competition.");
			return;
		}
		setSaving(true);
		setError("");
		try {
			const saved: ClubTeamProfile[] = [];
			for (const team of teams) {
				const cleanTeam = {
					...team,
					displayName: team.displayName.trim(),
					shortName: team.shortName.trim(),
					competitions: team.competitions
						.map((competition) => competition.trim())
						.filter(Boolean),
				};
				saved.push(
					team.isNew
						? await clubTeamsApi.create(cleanTeam)
						: await clubTeamsApi.update(cleanTeam)
				);
			}
			setTeams(saved);
			await saveClub(3);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Could not save teams.");
		} finally {
			setSaving(false);
		}
	}

	async function changeLogo(file: File) {
		if (!club) return;
		const validationError = await getManagedImageValidationError(file, "club-logo");
		if (validationError) {
			setError(validationError);
			return;
		}
		setSaving(true);
		try {
			const uploaded = await uploadLinkedFile({
				file,
				linkedEntityType: "ClubLogo",
				linkedEntityId: club.id,
			});
			setClub(normaliseClub(await filesApi.assignClubLogo(uploaded.id)));
			setError("");
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Could not upload crest.");
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return <p className="text-sm text-slate-500">Loading club setup...</p>;
	}
	if (!club) {
		return <div className="surface-card p-6 text-red-700">{error}</div>;
	}

	return (
		<div className="mx-auto max-w-6xl space-y-5">
			<OrganizationAdminNav />
			<header className="surface-card p-5 sm:p-6">
				<p className="text-xs font-black uppercase tracking-[.14em] text-yepset-600">
					Guided setup
				</p>
				<h1 className="mt-2 text-2xl font-black sm:text-3xl">
					Set up {club.name}
				</h1>
				<p className="mt-2 max-w-3xl text-sm text-slate-600">
					Work through the essentials now, or leave and return later. Progress is
					saved against this club.
				</p>
			</header>

			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
					{error}
				</div>
			)}

			<div className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
				<SetupProgress
					step={step}
					checklist={checklist}
					onStepChange={(nextStep) => {
						setError("");
						setStep(nextStep);
					}}
				/>
				<div className="surface-card min-w-0 p-5 sm:p-6">
					{step === 0 && (
						<IdentityStep
							club={club}
							saving={saving}
							onChange={setClub}
							onLogo={changeLogo}
							onNext={() => saveClub(1)}
						/>
					)}
					{step === 1 && (
						<VenuesStep
							club={club}
							saving={saving}
							onChange={setClub}
							onBack={() => setStep(0)}
							onNext={() => saveClub(2)}
						/>
					)}
					{step === 2 && (
						<TeamsStep
							teams={teams}
							sportKey={club.sportKey}
							saving={saving}
							onChange={setTeams}
							onBack={() => setStep(1)}
							onNext={saveTeams}
						/>
					)}
					{step === 3 && (
						<StaffStep
							teams={teams}
							canInvite={Boolean(canInviteStaff)}
							saving={saving}
							setSaving={setSaving}
							setError={setError}
							onBack={() => setStep(2)}
							onNext={() => saveClub(4)}
						/>
					)}
					{step === 4 && (
						<ReviewStep
							checklist={checklist}
							saving={saving}
							isAlreadyComplete={Boolean(club.setupCompletedAt)}
							onBack={() => setStep(3)}
							onComplete={async () => {
								if (!isSetupComplete(checklist)) {
									setError(
										"Complete the remaining essential items before finishing setup."
									);
									return;
								}
								await saveClub(4, true);
								navigate("/");
							}}
						/>
					)}
				</div>
			</div>
		</div>
	);
}

function IdentityStep({
	club,
	saving,
	onChange,
	onLogo,
	onNext,
}: {
	club: SportsClub;
	saving: boolean;
	onChange: (club: SportsClub) => void;
	onLogo: (file: File) => Promise<void>;
	onNext: () => Promise<void>;
}) {
	const [validation, setValidation] = useState("");
	function submit(event: FormEvent) {
		event.preventDefault();
		if (!club.name.trim() || !club.contactEmail.trim()) {
			setValidation("Club name and contact email are required.");
			return;
		}
		setValidation("");
		void onNext();
	}

	return (
		<form onSubmit={submit}>
			<StepHeading
				title="Club identity"
				description="Choose the sport and add the details members will use to recognise and contact the club."
			/>
			<div className="mt-5 grid gap-4 sm:grid-cols-2">
				<Field label="Club name" value={club.name} onChange={(name) => onChange({ ...club, name })} />
				<label className="text-sm font-semibold text-slate-700">
					Primary sport
					<select
						value={club.sportKey}
						onChange={(event) => onChange({ ...club, sportKey: event.target.value, customFormations: [] })}
						className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
					>
						{Object.values(sportDefinitions).map((sport) => (
							<option key={sport.key} value={sport.key}>{sport.name}</option>
						))}
					</select>
				</label>
				<Field label="Contact email" type="email" value={club.contactEmail} onChange={(contactEmail) => onChange({ ...club, contactEmail })} />
				<Field label="Contact phone" type="tel" value={club.contactPhone} onChange={(contactPhone) => onChange({ ...club, contactPhone })} />
				<Field label="Website" type="url" value={club.websiteUrl} placeholder="https://…" onChange={(websiteUrl) => onChange({ ...club, websiteUrl })} />
				<div className="grid grid-cols-2 gap-3">
					<ColorField label="Primary colour" value={club.primaryColor} onChange={(primaryColor) => onChange({ ...club, primaryColor })} />
					<ColorField label="Secondary colour" value={club.secondaryColor} onChange={(secondaryColor) => onChange({ ...club, secondaryColor })} />
				</div>
			</div>
			<div className="mt-5 rounded-xl border border-slate-200 p-4">
				<p className="text-sm font-bold">Club crest</p>
				<div className="mt-3 flex flex-wrap items-center gap-4">
					{club.logoFileId ? (
						<ManagedFileImage fileId={club.logoFileId} alt={`${club.name} crest`} className="h-20 w-20 rounded-xl object-contain" />
					) : (
						<div className="grid h-20 w-20 place-items-center rounded-xl bg-slate-100 text-2xl font-black">{club.name.charAt(0)}</div>
					)}
					<label className="btn-secondary cursor-pointer">
						{club.logoFileId ? "Replace crest" : "Upload crest"}
						<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void onLogo(file); event.target.value = ""; }} />
					</label>
				</div>
			</div>
			<StepActions saving={saving} validation={validation} onNextLabel="Save and continue" />
		</form>
	);
}

function VenuesStep({
	club,
	saving,
	onChange,
	onBack,
	onNext,
}: {
	club: SportsClub;
	saving: boolean;
	onChange: (club: SportsClub) => void;
	onBack: () => void;
	onNext: () => Promise<void>;
}) {
	const venues = club.venues;
	function updateVenue(id: string, changes: Partial<ClubVenue>) {
		onChange({
			...club,
			venues: venues.map((venue) =>
				venue.id === id
					? { ...venue, ...changes }
					: changes.isDefault
						? { ...venue, isDefault: false }
						: venue
			),
		});
	}
	function submit(event: FormEvent) {
		event.preventDefault();
		if (!venues.some((venue) => venue.isDefault && venue.name.trim() && venue.address.trim())) return;
		void onNext();
	}
	return (
		<form onSubmit={submit}>
			<StepHeading title="Venues and locations" description="Add the grounds, pitches or courts used by the club. The default is pre-filled when creating fixtures and events." />
			<div className="mt-5 space-y-4">
				{venues.map((venue) => (
					<div key={venue.id} className="rounded-xl border border-slate-200 p-4">
						<div className="grid gap-3 sm:grid-cols-2">
							<Field label="Venue name" value={venue.name} onChange={(name) => updateVenue(venue.id, { name })} />
							<Field label="Address" value={venue.address} onChange={(address) => updateVenue(venue.id, { address })} />
							<Field label="Map link" type="url" value={venue.mapUrl} placeholder="https://maps.google.com/…" onChange={(mapUrl) => updateVenue(venue.id, { mapUrl })} />
							<label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold">
								<input type="radio" name="defaultVenue" checked={venue.isDefault} onChange={() => updateVenue(venue.id, { isDefault: true })} />
								Default location
							</label>
						</div>
						<button type="button" className="mt-3 text-sm font-bold text-red-700" onClick={() => onChange({ ...club, venues: venues.filter((item) => item.id !== venue.id) })}>Remove venue</button>
					</div>
				))}
			</div>
			<button type="button" className="btn-secondary mt-4" onClick={() => onChange({ ...club, venues: [...venues, newVenue(venues.length === 0)] })}>Add venue</button>
			<StepActions saving={saving} validation={venues.some((venue) => venue.isDefault && venue.name.trim() && venue.address.trim()) ? "" : "Add a named default venue with an address."} onBack={onBack} onNextLabel="Save and continue" />
		</form>
	);
}

function TeamsStep({
	teams,
	sportKey,
	saving,
	onChange,
	onBack,
	onNext,
}: {
	teams: TeamDraft[];
	sportKey: string;
	saving: boolean;
	onChange: (teams: TeamDraft[]) => void;
	onBack: () => void;
	onNext: () => Promise<void>;
}) {
	const suggestedNames = getSuggestedTeamNames(sportKey);
	function update(id: string, changes: Partial<TeamDraft>) {
		onChange(teams.map((team) => team.id === id ? { ...team, ...changes } : team));
	}
	return (
		<div>
			<StepHeading title="Teams and competitions" description="Start with the suggested sport-specific names, then tailor the teams and competitions to your club." />
			<div className="mt-5 space-y-4">
				{teams.map((team, index) => (
					<div key={team.id} className="rounded-xl border border-slate-200 p-4">
						<div className="grid gap-3 sm:grid-cols-2">
							<Field label="Team name" value={team.displayName || suggestedNames[index] || ""} onChange={(displayName) => update(team.id, { displayName })} />
							<Field label="Short name" value={team.shortName} onChange={(shortName) => update(team.id, { shortName })} />
						</div>
						<label className="mt-3 block text-sm font-semibold text-slate-700">
							Competitions <span className="font-normal text-slate-500">one per line</span>
							<textarea rows={3} value={team.competitions.join("\n")} onChange={(event) => update(team.id, { competitions: event.target.value.split("\n") })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="League&#10;Cup" />
						</label>
						{team.isNew && <button type="button" className="mt-2 text-sm font-bold text-red-700" onClick={() => onChange(teams.filter((item) => item.id !== team.id))}>Remove team</button>}
					</div>
				))}
			</div>
			<button type="button" className="btn-secondary mt-4" onClick={() => onChange([...teams, newTeam(teams.length)])}>Add another team</button>
			<StepActions saving={saving} validation="" onBack={onBack} onNext={() => void onNext()} onNextLabel="Save teams" />
		</div>
	);
}

function StaffStep({
	teams,
	canInvite,
	saving,
	setSaving,
	setError,
	onBack,
	onNext,
}: {
	teams: TeamDraft[];
	canInvite: boolean;
	saving: boolean;
	setSaving: (saving: boolean) => void;
	setError: (error: string) => void;
	onBack: () => void;
	onNext: () => Promise<void>;
}) {
	const [request, setRequest] = useState<CreateSetupStaffRequest>({
		email: "",
		password: "",
		role: "Coach",
		teamId: null,
	});
	const [created, setCreated] = useState<string[]>([]);
	async function createStaff(event: FormEvent) {
		event.preventDefault();
		setSaving(true);
		setError("");
		try {
			const user = await clubSetupApi.createStaff(request);
			setCreated((current) => [...current, user.email]);
			setRequest({ email: "", password: "", role: "Coach", teamId: null });
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Could not create staff access.");
		} finally {
			setSaving(false);
		}
	}
	return (
		<div>
			<StepHeading title="Staff access" description="Create secure access for the people helping run this club. Temporary passwords should be shared privately." />
			{canInvite ? (
				<form onSubmit={createStaff} className="mt-5 rounded-xl border border-slate-200 p-4">
					<div className="grid gap-3 sm:grid-cols-2">
						<Field label="Email" type="email" value={request.email} onChange={(email) => setRequest({ ...request, email })} />
						<Field label="Temporary password" type="password" value={request.password} onChange={(password) => setRequest({ ...request, password })} />
						<label className="text-sm font-semibold text-slate-700">Role<select value={request.role} onChange={(event) => { const role = event.target.value as CreateSetupStaffRequest["role"]; setRequest({ ...request, role, teamId: role === "ClubAdmin" ? null : request.teamId }); }} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"><option value="ClubAdmin">Club Admin</option><option value="Coach">Coach</option><option value="TeamManager">Team Manager</option></select></label>
						<label className="text-sm font-semibold text-slate-700">Team<select disabled={request.role === "ClubAdmin"} value={request.teamId ?? ""} onChange={(event) => setRequest({ ...request, teamId: event.target.value || null })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 disabled:bg-slate-100"><option value="">{request.role === "TeamManager" ? "Select a team" : "All club teams"}</option>{teams.filter((team) => !team.isNew).map((team) => <option key={team.id} value={team.id}>{team.displayName}</option>)}</select></label>
					</div>
					<button disabled={saving || !request.email.trim() || request.password.length < 8 || (request.role === "TeamManager" && !request.teamId)} className="btn-primary mt-4 disabled:opacity-50">Create staff access</button>
					{created.length > 0 && <p className="mt-3 text-sm font-semibold text-emerald-700">Created: {created.join(", ")}</p>}
				</form>
			) : (
				<div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Only an Organization Admin can add staff. Your own Club Admin access already satisfies the essential setup requirement.</div>
			)}
			<StepActions saving={saving} validation="" onBack={onBack} onNext={() => void onNext()} onNextLabel="Continue to review" />
		</div>
	);
}

function ReviewStep({
	checklist,
	saving,
	isAlreadyComplete,
	onBack,
	onComplete,
}: {
	checklist: ReturnType<typeof buildSetupChecklist>;
	saving: boolean;
	isAlreadyComplete: boolean;
	onBack: () => void;
	onComplete: () => Promise<void>;
}) {
	return (
		<div>
			<StepHeading title="Ready to use Yepset" description="These essentials give the club enough information to create fixtures, events, team selections and posts." />
			<ul className="mt-5 space-y-3">
				{checklist.map((item) => <li key={item.label} className={`flex items-center gap-3 rounded-xl border p-4 font-semibold ${item.complete ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}><span>{item.complete ? "✓" : "!"}</span>{item.label}</li>)}
			</ul>
			{isAlreadyComplete && <p className="mt-4 text-sm font-semibold text-emerald-700">This club has already completed guided setup. You can still revisit and update any step.</p>}
			<StepActions saving={saving} validation="" onBack={onBack} onNext={() => void onComplete()} onNextLabel={isAlreadyComplete ? "Save and return" : "Finish setup"} disabled={!isSetupComplete(checklist)} />
		</div>
	);
}

function StepHeading({ title, description }: { title: string; description: string }) {
	return <div><p className="text-xs font-black uppercase tracking-[.14em] text-yepset-600">Step</p><h2 className="mt-1 text-2xl font-black">{title}</h2><p className="mt-2 text-sm text-slate-600">{description}</p></div>;
}

function StepActions({ saving, validation, onBack, onNext, onNextLabel, disabled = false }: { saving: boolean; validation: string; onBack?: () => void; onNext?: () => void; onNextLabel: string; disabled?: boolean }) {
	return <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between"><div>{onBack && <button type="button" onClick={onBack} className="btn-secondary w-full sm:w-auto">Back</button>}{validation && <p className="mt-2 text-sm font-semibold text-amber-700">{validation}</p>}</div><button type={onNext ? "button" : "submit"} onClick={onNext} disabled={saving || disabled || Boolean(validation)} className="btn-primary justify-center disabled:opacity-50">{saving ? "Saving..." : onNextLabel}</button></div>;
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
	return <label className="text-sm font-semibold text-slate-700">{label}<input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-yepset-500 focus:ring-2 focus:ring-yepset-100" /></label>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
	return <label className="text-xs font-semibold text-slate-600">{label}<span className="mt-1 flex items-center gap-2 rounded-xl border border-slate-300 px-2 py-1.5"><input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-8 w-10 border-0 bg-transparent" /><span className="text-xs font-mono">{value}</span></span></label>;
}

function newVenue(isDefault: boolean): ClubVenue {
	return { id: crypto.randomUUID(), name: "", address: "", mapUrl: "", isDefault };
}

function newTeam(index: number): TeamDraft {
	return { id: `new-${crypto.randomUUID()}`, displayName: "", shortName: "", isActive: true, sortOrder: index, competitions: [], isNew: true };
}

function normaliseClub(club: SportsClub): SportsClub {
	return {
		...club,
		primaryColor: club.primaryColor || "#0f766e",
		secondaryColor: club.secondaryColor || "#d9f99d",
		contactEmail: club.contactEmail || "",
		contactPhone: club.contactPhone || "",
		websiteUrl: club.websiteUrl || "",
		venues: club.venues ?? [],
		setupStep: club.setupStep ?? 0,
	};
}

function updateClubAccess(club: SportsClub) {
	useAuthStore.setState((state) => ({
		availableClubs: state.availableClubs.map((item) =>
			item.id === club.id
				? { ...item, name: club.name, sportKey: club.sportKey, customFormations: club.customFormations }
				: item
		),
	}));
}
