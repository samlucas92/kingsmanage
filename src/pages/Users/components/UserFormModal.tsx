import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { UserRole, AuthUser, CreateUserRequest, UpdateUserRequest } from "../../../types/auth";
import type { Player } from "../../../stores/players";

type UserFormValues = {
	email: string;
	password: string;
	role: UserRole;
	playerId: string;
	isActive: boolean;
};

type UserFormModalProps = {
	isOpen: boolean;
	user: AuthUser | null;
	players: Player[];
	onClose: () => void;
	onCreateUser: (request: CreateUserRequest) => Promise<void>;
	onUpdateUser: (id: string, request: UpdateUserRequest) => Promise<void>;
};

const roles: UserRole[] = ["Admin", "Coach", "Player"];

const defaultFormValues: UserFormValues = {
	email: "",
	password: "",
	role: "Player",
	playerId: "",
	isActive: true,
};

export default function UserFormModal({
	isOpen,
	user,
	players,
	onClose,
	onCreateUser,
	onUpdateUser,
}: UserFormModalProps) {
	const [formValues, setFormValues] = useState<UserFormValues>(defaultFormValues);
	const [error, setError] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	const sortedPlayers = useMemo(
		() => [...players].sort((firstPlayer, secondPlayer) => firstPlayer.name.localeCompare(secondPlayer.name)),
		[players]
	);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		if (user) {
			setFormValues({
				email: user.email,
				password: "",
				role: user.role,
				playerId: user.playerId ?? "",
				isActive: user.isActive,
			});
		} else {
			setFormValues(defaultFormValues);
		}

		setError("");
		setIsSaving(false);
	}, [isOpen, user]);

	if (!isOpen) {
		return null;
	}

	const isEditing = Boolean(user);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const email = formValues.email.trim();
		const password = formValues.password.trim();
		const playerId = formValues.playerId || null;

		if (!email) {
			setError("Email is required.");
			return;
		}

		if (!isEditing && password.length < 8) {
			setError("Temporary password must be at least 8 characters long.");
			return;
		}

		setIsSaving(true);
		setError("");

		try {
			if (user) {
				await onUpdateUser(user.id, {
					email,
					role: formValues.role,
					playerId,
					isActive: formValues.isActive,
				});
			} else {
				await onCreateUser({
					email,
					password,
					role: formValues.role,
					playerId,
					isActive: formValues.isActive,
				});
			}

			onClose();
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Failed to save user.");
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
			<div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
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

				<form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
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
							<label htmlFor="user-role" className="text-sm font-semibold text-slate-700">
								Role
							</label>
							<select
								id="user-role"
								value={formValues.role}
								onChange={(event) => setFormValues((currentValues) => ({ ...currentValues, role: event.target.value as UserRole }))}
								className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
							>
								{roles.map((role) => (
									<option key={role} value={role}>
										{role}
									</option>
								))}
							</select>
						</div>

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
