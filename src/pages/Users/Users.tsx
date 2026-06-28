import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../stores/auth";
import { usePlayerStore } from "../../stores/players";
import { useUserStore } from "../../stores/users";
import { usersApi } from "../../services/usersApi";
import type { AuthUser, CreateUserRequest, MembershipClubOption, UpdateMembershipsRequest, UpdateUserRequest, UserRole } from "../../types/auth";
import ResetPasswordModal from "./components/ResetPasswordModal";
import UserFormModal from "./components/UserFormModal";

type UserFilter = "All" | "Active" | "Inactive" | UserRole;

const filters: UserFilter[] = ["All", "Active", "Inactive", "Admin", "Coach", "Player"];

export default function Users() {
	const currentUser = useAuthStore((state) => state.currentUser);

	const users = useUserStore((state) => state.users);
	const isLoadingUsers = useUserStore((state) => state.isLoadingUsers);
	const userLoadError = useUserStore((state) => state.userLoadError);
	const loadUsers = useUserStore((state) => state.loadUsers);
	const createUser = useUserStore((state) => state.createUser);
	const updateUser = useUserStore((state) => state.updateUser);
	const updateMemberships = useUserStore((state) => state.updateMemberships);
	const setUserActive = useUserStore((state) => state.setUserActive);
	const resetUserPassword = useUserStore((state) => state.resetUserPassword);

	const players = usePlayerStore((state) => state.players);
	const isLoadingPlayers = usePlayerStore((state) => state.isLoadingPlayers);
	const playerLoadError = usePlayerStore((state) => state.playerLoadError);
	const loadPlayers = usePlayerStore((state) => state.loadPlayers);

	const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
	const [passwordResetUser, setPasswordResetUser] = useState<AuthUser | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [filter, setFilter] = useState<UserFilter>("All");
	const [searchTerm, setSearchTerm] = useState("");
	const [actionError, setActionError] = useState("");
	const [actionMessage, setActionMessage] = useState("");
	const [busyUserId, setBusyUserId] = useState<string | null>(null);
	const [membershipOptions, setMembershipOptions] = useState<MembershipClubOption[]>([]);

	useEffect(() => {
		void loadUsers();
		void loadPlayers();
		void usersApi.getMembershipOptions().then(setMembershipOptions).catch(() => setActionError("Failed to load club membership options."));
	}, [loadPlayers, loadUsers]);

	const playersById = useMemo(() => {
		return players.reduce<Record<string, string>>((lookup, player) => {
			lookup[player.id] = player.name;
			return lookup;
		}, {});
	}, [players]);

	const visibleUsers = useMemo(() => {
		const normalisedSearchTerm = searchTerm.trim().toLowerCase();

		return users.filter((user) => {
			const linkedPlayerName = user.playerId ? playersById[user.playerId] ?? "" : "";
			const matchesSearch =
				!normalisedSearchTerm ||
				user.email.toLowerCase().includes(normalisedSearchTerm) ||
				user.role.toLowerCase().includes(normalisedSearchTerm) ||
				linkedPlayerName.toLowerCase().includes(normalisedSearchTerm);

			if (!matchesSearch) {
				return false;
			}

			if (filter === "Active") {
				return user.isActive;
			}

			if (filter === "Inactive") {
				return !user.isActive;
			}

			if (filter === "Admin" || filter === "Coach" || filter === "Player") {
				return user.role === filter;
			}

			return true;
		});
	}, [filter, playersById, searchTerm, users]);

	const activeUserCount = users.filter((user) => user.isActive).length;
	const playerLinkedCount = users.filter((user) => user.playerId).length;
	const adminCount = users.filter((user) => user.role === "Admin").length;

	if (currentUser?.role !== "Admin") {
		return (
			<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<p className="text-sm font-semibold uppercase tracking-wide text-red-700">
					Admin access required
				</p>
				<h1 className="mt-2 text-2xl font-bold text-slate-900">Users</h1>
				<p className="mt-2 text-sm text-slate-600">
					Only admins can manage user accounts.
				</p>
			</div>
		);
	}

	function openCreateModal() {
		setSelectedUser(null);
		setIsModalOpen(true);
		setActionError("");
		setActionMessage("");
	}

	function openEditModal(user: AuthUser) {
		setSelectedUser(user);
		setIsModalOpen(true);
		setActionError("");
		setActionMessage("");
	}

	function openResetPasswordModal(user: AuthUser) {
		setPasswordResetUser(user);
		setActionError("");
		setActionMessage("");
	}

	async function handleCreateUser(request: CreateUserRequest) {
		return await createUser(request);
	}

	async function handleUpdateUser(id: string, request: UpdateUserRequest) {
		return await updateUser(id, request);
	}

	async function handleUpdateMemberships(id: string, request: UpdateMembershipsRequest) {
		return await updateMemberships(id, request);
	}

	async function handleSetUserActive(user: AuthUser, isActive: boolean) {
		setBusyUserId(user.id);
		setActionError("");
		setActionMessage("");

		try {
			await setUserActive(user.id, isActive);
		} catch (error) {
			setActionError(error instanceof Error ? error.message : "Failed to update user status.");
		} finally {
			setBusyUserId(null);
		}
	}

	async function handleResetPassword(userId: string, newPassword: string) {
		setBusyUserId(userId);
		setActionError("");
		setActionMessage("");

		try {
			await resetUserPassword(userId, newPassword);
			setActionMessage("Password reset successfully.");
		} catch (error) {
			setActionError(error instanceof Error ? error.message : "Failed to reset password.");
			throw error;
		} finally {
			setBusyUserId(null);
		}
	}

	return (
		<div className="space-y-6">
			<div className="surface-card flex flex-col justify-between gap-4 p-6 lg:flex-row lg:items-center">
				<div>
					<p className="text-xs font-black uppercase tracking-[.14em] text-yepset-600">
						Access control
					</p>
					<h1 className="mt-2 text-3xl font-bold text-slate-900">Users</h1>
					<p className="mt-2 max-w-3xl text-sm text-slate-600">
						Create accounts, assign roles, link player accounts, and reset passwords.
					</p>
				</div>

				<button
					type="button"
					onClick={openCreateModal}
					className="btn-primary"
				>
					Create user
				</button>
			</div>

			{(userLoadError || playerLoadError || actionError || actionMessage) && (
				<div
					className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
						actionMessage && !actionError && !userLoadError && !playerLoadError
							? "border-green-200 bg-green-50 text-green-700"
							: "border-red-200 bg-red-50 text-red-700"
					}`}
				>
					{actionError || userLoadError || playerLoadError || actionMessage}
				</div>
			)}

			<div className="grid gap-4 md:grid-cols-3">
				<SummaryCard label="Active users" value={activeUserCount.toString()} />
				<SummaryCard label="Linked players" value={playerLinkedCount.toString()} />
				<SummaryCard label="Admins" value={adminCount.toString()} helper="Full access" />
			</div>

			<div className="surface-card p-4">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex flex-wrap gap-2">
						{filters.map((item) => (
							<button
								key={item}
								type="button"
								onClick={() => setFilter(item)}
								className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
									filter === item
										? "bg-yepset-700 text-white"
										: "bg-slate-100 text-slate-700 hover:bg-yepset-50 hover:text-yepset-800"
								}`}
							>
								{item}
							</button>
						))}
					</div>

					<input
						value={searchTerm}
						onChange={(event) => setSearchTerm(event.target.value)}
						placeholder="Search users or linked players"
						className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-yepset-500 focus:ring-2 focus:ring-yepset-100 lg:max-w-xs"
					/>
				</div>
			</div>

			<div className="surface-card p-4">
				<div className="mb-4">
					<h2 className="text-lg font-bold text-slate-900">User accounts</h2>
					<p className="text-sm text-slate-500">
						Admin-created accounts only. Public signup is deliberately not available.
					</p>
				</div>

				{isLoadingUsers || isLoadingPlayers ? (
					<div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm font-semibold text-slate-500">
						Loading users...
					</div>
				) : visibleUsers.length === 0 ? (
					<div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm font-semibold text-slate-500">
						No users match the selected filter.
					</div>
				) : (
					<>
						<div className="grid gap-3 lg:hidden">
							{visibleUsers.map((user) => (
								<UserCard
									key={user.id}
									user={user}
									linkedPlayerName={user.playerId ? playersById[user.playerId] : undefined}
									isBusy={busyUserId === user.id}
									onEdit={() => openEditModal(user)}
									onResetPassword={() => openResetPasswordModal(user)}
									onSetActive={(isActive) => void handleSetUserActive(user, isActive)}
								/>
							))}
						</div>

						<div className="hidden overflow-x-auto lg:block">
							<table className="w-full text-left text-sm">
								<thead>
									<tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
										<th className="px-3 py-3">User</th>
										<th className="px-3 py-3">Role</th>
										<th className="px-3 py-3">Linked player</th>
										<th className="px-3 py-3">Status</th>
										<th className="px-3 py-3">Last login</th>
										<th className="px-3 py-3 text-right">Actions</th>
									</tr>
								</thead>

								<tbody>
									{visibleUsers.map((user) => (
										<UserTableRow
											key={user.id}
											user={user}
											linkedPlayerName={user.playerId ? playersById[user.playerId] : undefined}
											isBusy={busyUserId === user.id}
											onEdit={() => openEditModal(user)}
											onResetPassword={() => openResetPasswordModal(user)}
											onSetActive={(isActive) => void handleSetUserActive(user, isActive)}
										/>
									))}
								</tbody>
							</table>
						</div>
					</>
				)}
			</div>

			{isModalOpen && <UserFormModal
				key={selectedUser?.id ?? "new-user"}
				isOpen={isModalOpen}
				user={selectedUser}
				players={players}
				membershipOptions={membershipOptions}
				onClose={() => setIsModalOpen(false)}
				onCreateUser={handleCreateUser}
				onUpdateUser={handleUpdateUser}
				onUpdateMemberships={handleUpdateMemberships}
			/>}

			<ResetPasswordModal
				user={passwordResetUser}
				onClose={() => setPasswordResetUser(null)}
				onResetPassword={handleResetPassword}
			/>
		</div>
	);
}

function SummaryCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
	return (
		<div className="surface-card p-4">
			<p className="text-xs font-bold uppercase tracking-[.08em] text-slate-500">{label}</p>
			<p className="mt-2 text-2xl font-black text-yepset-800">{value}</p>
			{helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
		</div>
	);
}

function UserTableRow({
	user,
	linkedPlayerName,
	isBusy,
	onEdit,
	onResetPassword,
	onSetActive,
}: {
	user: AuthUser;
	linkedPlayerName?: string;
	isBusy: boolean;
	onEdit: () => void;
	onResetPassword: () => void;
	onSetActive: (isActive: boolean) => void;
}) {
	return (
		<tr className="border-b border-slate-100 last:border-0">
			<td className="px-3 py-4">
				<div>
					<p className="font-semibold text-slate-900">{user.email}</p>
					<p className="text-xs text-slate-500">Created {formatDate(user.createdAt)}</p>
				</div>
			</td>
			<td className="px-3 py-4">
				<RoleBadge role={user.role} />
			</td>
			<td className="px-3 py-4 text-slate-700">{linkedPlayerName ?? "—"}</td>
			<td className="px-3 py-4">
				<StatusBadge isActive={user.isActive} />
			</td>
			<td className="px-3 py-4 text-slate-700">{formatDate(user.lastLoginAt)}</td>
			<td className="px-3 py-4">
				<div className="flex justify-end gap-2">
					<button
						type="button"
						onClick={onEdit}
						className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
					>
						Edit
					</button>

					<button
						type="button"
						onClick={onResetPassword}
						className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
					>
						Reset password
					</button>

					<button
						type="button"
						disabled={isBusy}
						onClick={() => onSetActive(!user.isActive)}
						className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{user.isActive ? "Deactivate" : "Activate"}
					</button>
				</div>
			</td>
		</tr>
	);
}

function UserCard({
	user,
	linkedPlayerName,
	isBusy,
	onEdit,
	onResetPassword,
	onSetActive,
}: {
	user: AuthUser;
	linkedPlayerName?: string;
	isBusy: boolean;
	onEdit: () => void;
	onResetPassword: () => void;
	onSetActive: (isActive: boolean) => void;
}) {
	return (
		<div className="rounded-xl border border-slate-200 p-4">
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0">
					<p className="truncate font-semibold text-slate-900">{user.email}</p>
					<p className="text-xs text-slate-500">Created {formatDate(user.createdAt)}</p>
				</div>
				<StatusBadge isActive={user.isActive} />
			</div>

			<div className="mt-4 grid grid-cols-2 gap-3 text-sm">
				<div>
					<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</p>
					<div className="mt-1">
						<RoleBadge role={user.role} />
					</div>
				</div>
				<div>
					<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
						Linked player
					</p>
					<p className="mt-1 text-slate-700">{linkedPlayerName ?? "—"}</p>
				</div>
				<div>
					<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
						Last login
					</p>
					<p className="mt-1 text-slate-700">{formatDate(user.lastLoginAt)}</p>
				</div>
			</div>

			<div className="mt-4 flex flex-wrap gap-2">
				<button
					type="button"
					onClick={onEdit}
					className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
				>
					Edit
				</button>

				<button
					type="button"
					onClick={onResetPassword}
					className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
				>
					Reset password
				</button>

				<button
					type="button"
					disabled={isBusy}
					onClick={() => onSetActive(!user.isActive)}
					className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{user.isActive ? "Deactivate" : "Activate"}
				</button>
			</div>
		</div>
	);
}

function RoleBadge({ role }: { role: UserRole }) {
	return (
		<span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
			{role}
		</span>
	);
}

function StatusBadge({ isActive }: { isActive: boolean }) {
	return (
		<span
			className={`rounded-full px-2.5 py-1 text-xs font-bold ${
				isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"
			}`}
		>
			{isActive ? "Active" : "Inactive"}
		</span>
	);
}

function formatDate(value?: string | null) {
	if (!value) {
		return "—";
	}

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "—";
	}

	return date.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}
