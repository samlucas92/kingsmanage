import { useMemo, useState, type FormEvent } from "react";
import type { AuthUser, CreateUserRequest, MembershipClubOption, TenantRole, UpdateMembershipsRequest, UpdateUserRequest, UserMembership, UserRole } from "../../../types/auth";
import type { Player } from "../../../stores/players";

type UserFormValues = {
	email: string;
	password: string;
	playerId: string;
	isActive: boolean;
	memberships: UserMembership[];
	defaultClubId: string;
};

type UserFormModalProps = {
	isOpen: boolean;
	user: AuthUser | null;
	players: Player[];
	membershipOptions: MembershipClubOption[];
	onClose: () => void;
	onCreateUser: (request: CreateUserRequest) => Promise<AuthUser>;
	onUpdateUser: (id: string, request: UpdateUserRequest) => Promise<AuthUser>;
	onUpdateMemberships: (id: string, request: UpdateMembershipsRequest) => Promise<AuthUser>;
};

const membershipRoles: TenantRole[] = ["OrganizationAdmin", "ClubAdmin", "TeamManager", "Coach", "Player"];

const defaultFormValues: UserFormValues = {
	email: "",
	password: "",
	playerId: "",
	isActive: true,
	memberships: [{ clubId: null, teamId: null, role: "Player" }],
	defaultClubId: "",
};

export default function UserFormModal({
	isOpen,
	user,
	players,
	membershipOptions,
	onClose,
	onCreateUser,
	onUpdateUser,
	onUpdateMemberships,
}: UserFormModalProps) {
	const [formValues, setFormValues] = useState<UserFormValues>(() => buildInitialValues(user, membershipOptions));
	const [error, setError] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	const sortedPlayers = useMemo(
		() => [...players].sort((firstPlayer, secondPlayer) => firstPlayer.name.localeCompare(secondPlayer.name)),
		[players]
	);

	if (!isOpen) {
		return null;
	}

	const isEditing = Boolean(user);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const email = formValues.email.trim();
		const password = formValues.password.trim();
		const playerId = formValues.playerId || null;
		const memberships = formValues.memberships.map((membership) => ({ ...membership, organizationId: undefined }));

		if (!email) {
			setError("Email is required.");
			return;
		}

		if (!isEditing && password.length < 8) {
			setError("Temporary password must be at least 8 characters long.");
			return;
		}

		if (!memberships.length) {
			setError("At least one membership is required.");
			return;
		}

		const invalidMembership = memberships.find((membership) =>
			(membership.role !== "OrganizationAdmin" && !membership.clubId) ||
			(membership.role === "TeamManager" && !membership.teamId));
		if (invalidMembership) {
			setError(invalidMembership.role === "TeamManager" ? "Team Managers must be assigned to a team." : "A club is required for each club-level membership.");
			return;
		}

		setIsSaving(true);
		setError("");

		try {
			const role = mapMembershipsToUserRole(memberships);
			let savedUser: AuthUser;
			if (user) {
				savedUser = await onUpdateUser(user.id, {
					email,
					role,
					playerId,
					isActive: formValues.isActive,
				});
			} else {
				savedUser = await onCreateUser({
					email,
					password,
					role,
					playerId,
					isActive: formValues.isActive,
				});
			}
			await onUpdateMemberships(savedUser.id, {
				defaultClubId: formValues.defaultClubId || null,
				memberships,
			});

			onClose();
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Failed to save user.");
		} finally {
			setIsSaving(false);
		}
	}

	function updateMembership(index: number, changes: Partial<UserMembership>) {
		setFormValues((current) => ({
			...current,
			memberships: current.memberships.map((membership, itemIndex) =>
				itemIndex === index ? { ...membership, ...changes } : membership),
		}));
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
			<div className="flex max-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl">
				<div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
					<div>
						<h2 className="text-lg font-bold text-slate-900">{isEditing ? "Edit user" : "Create user"}</h2>
						<p className="mt-1 text-sm text-slate-500">
							{isEditing ? "Update access details for this account." : "Create an account and assign the correct access level."}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
					>
						✕
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto px-5 py-5">
					{error && (
						<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
							{error}
						</div>
					)}

					<div>
						<label htmlFor="user-email" className="text-sm font-semibold text-slate-700">
							Email
						</label>
						<input
							id="user-email"
							type="email"
							value={formValues.email}
							onChange={(event) => setFormValues((currentValues) => ({ ...currentValues, email: event.target.value }))}
							className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
							placeholder="name@example.com"
						/>
					</div>

					{!isEditing && (
						<div>
							<label htmlFor="user-password" className="text-sm font-semibold text-slate-700">
								Temporary password
							</label>
							<input
								id="user-password"
								type="text"
								value={formValues.password}
								onChange={(event) => setFormValues((currentValues) => ({ ...currentValues, password: event.target.value }))}
								className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
								placeholder="At least 8 characters"
							/>
							<p className="mt-1 text-xs text-slate-500">The user can log in with this password. Password reset/change can be added later.</p>
						</div>
					)}

					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<label htmlFor="user-active" className="text-sm font-semibold text-slate-700">
								Status
							</label>
							<select
								id="user-active"
								value={formValues.isActive ? "active" : "inactive"}
								onChange={(event) => setFormValues((currentValues) => ({ ...currentValues, isActive: event.target.value === "active" }))}
								className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
							>
								<option value="active">Active</option>
								<option value="inactive">Inactive</option>
							</select>
						</div>
					</div>

					<div className="space-y-3 border-t border-slate-200 pt-4">
						<div className="flex items-center justify-between gap-3">
							<div>
								<h3 className="text-sm font-bold text-slate-900">Club memberships</h3>
								<p className="text-xs text-slate-500">Assign organization, club, or team-level access.</p>
							</div>
							<button type="button" onClick={() => setFormValues((current) => ({ ...current, memberships: [...current.memberships, { clubId: membershipOptions[0]?.id ?? null, teamId: null, role: "Player" }] }))} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50">
								Add membership
							</button>
						</div>

						{formValues.memberships.map((membership, index) => {
							const club = membershipOptions.find((option) => option.id === membership.clubId);
							const allowsTeam = membership.role === "TeamManager" || membership.role === "Coach" || membership.role === "Player";
							return (
								<div key={`${index}-${membership.role}`} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
									<select aria-label={`Membership ${index + 1} role`} value={membership.role} onChange={(event) => updateMembership(index, { role: event.target.value as TenantRole, clubId: event.target.value === "OrganizationAdmin" ? null : membership.clubId ?? membershipOptions[0]?.id ?? null, teamId: null })} className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm">
										{membershipRoles.map((role) => <option key={role} value={role}>{formatTenantRole(role)}</option>)}
									</select>
									<select aria-label={`Membership ${index + 1} club`} value={membership.clubId ?? ""} disabled={membership.role === "OrganizationAdmin"} onChange={(event) => updateMembership(index, { clubId: event.target.value || null, teamId: null })} className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm disabled:bg-slate-100">
										<option value="">Entire organization</option>
										{membershipOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
									</select>
									<select aria-label={`Membership ${index + 1} team`} value={membership.teamId ?? ""} disabled={!allowsTeam || !club} onChange={(event) => updateMembership(index, { teamId: event.target.value || null })} className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm disabled:bg-slate-100">
										<option value="">{membership.role === "TeamManager" ? "Select team" : "All teams"}</option>
										{club?.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
									</select>
									<button type="button" aria-label={`Remove membership ${index + 1}`} onClick={() => setFormValues((current) => ({ ...current, memberships: current.memberships.filter((_, itemIndex) => itemIndex !== index) }))} className="rounded-lg px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50">Remove</button>
								</div>
							);
						})}

						<div>
							<label htmlFor="default-club" className="text-sm font-semibold text-slate-700">Default club</label>
							<select id="default-club" value={formValues.defaultClubId} onChange={(event) => setFormValues((current) => ({ ...current, defaultClubId: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm sm:max-w-md">
								<option value="">Use first available club</option>
								{membershipOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
							</select>
						</div>
					</div>

					<div>
						<label htmlFor="user-player" className="text-sm font-semibold text-slate-700">
							Linked player
						</label>
						<select
							id="user-player"
							value={formValues.playerId}
							onChange={(event) => setFormValues((currentValues) => ({ ...currentValues, playerId: event.target.value }))}
							className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
						>
							<option value="">No linked player</option>
							{sortedPlayers.map((player) => (
								<option key={player.id} value={player.id}>
									{player.name}{player.number ? ` #${player.number}` : ""}{!player.isActive ? " (inactive)" : ""}
								</option>
							))}
						</select>
						<p className="mt-1 text-xs text-slate-500">Use this for player accounts so their dashboard can show their stats and finance later.</p>
					</div>

					<div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={onClose}
							className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSaving}
							className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{isSaving ? "Saving..." : isEditing ? "Save user" : "Create user"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

function mapMembershipsToUserRole(memberships: UserMembership[]): UserRole {
	if (memberships.some((membership) => membership.role === "OrganizationAdmin" || membership.role === "ClubAdmin")) return "Admin";
	if (memberships.some((membership) => membership.role === "TeamManager" || membership.role === "Coach")) return "Coach";
	return "Player";
}

function formatTenantRole(role: TenantRole) {
	return role.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function buildInitialValues(user: AuthUser | null, membershipOptions: MembershipClubOption[]): UserFormValues {
	if (user) {
		return {
			email: user.email,
			password: "",
			playerId: user.playerId ?? "",
			isActive: user.isActive,
			memberships: user.memberships.length ? user.memberships : [{ clubId: user.defaultClubId ?? null, teamId: null, role: user.tenantRole ?? "Player" }],
			defaultClubId: user.defaultClubId ?? "",
		};
	}

	return {
		...defaultFormValues,
		memberships: [{ clubId: membershipOptions[0]?.id ?? null, teamId: null, role: "Player" }],
		defaultClubId: membershipOptions[0]?.id ?? "",
	};
}
