import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../stores/auth";
import { usePlayerStore } from "../../stores/players";
import { useUserStore } from "../../stores/users";
import type { AuthUser, CreateUserRequest, UpdateUserRequest, UserRole } from "../../types/auth";
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
	const setUserActive = useUserStore((state) => state.setUserActive);

	const players = usePlayerStore((state) => state.players);
	const isLoadingPlayers = usePlayerStore((state) => state.isLoadingPlayers);
	const playerLoadError = usePlayerStore((state) => state.playerLoadError);
	const loadPlayers = usePlayerStore((state) => state.loadPlayers);

	const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [filter, setFilter] = useState<UserFilter>("All");
	const [searchTerm, setSearchTerm] = useState("");
	const [actionError, setActionError] = useState("");
	const [busyUserId, setBusyUserId] = useState<string | null>(null);

	useEffect(() => {
		void loadUsers();
		void loadPlayers();
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
			const matchesSearch = !normalisedSearchTerm
				|| user.email.toLowerCase().includes(normalisedSearchTerm)
				|| user.role.toLowerCase().includes(normalisedSearchTerm)
				|| linkedPlayerName.toLowerCase().includes(normalisedSearchTerm);

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
			<div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 text-sm text-yellow-900">
				<p className="text-base font-bold">Admin access required</p>
				<p className="mt-1">Only admins can manage user accounts.</p>
			</div>
		);
	}

	function openCreateModal() {
		setSelectedUser(null);
		setIsModalOpen(true);
		setActionError("");
	}

	function openEditModal(user: AuthUser) {
		setSelectedUser(user);
		setIsModalOpen(true);
		setActionError("");
	}

	async function handleCreateUser(request: CreateUserRequest) {
		await createUser(request);
	}

	async function handleUpdateUser(id: string, request: UpdateUserRequest) {
		await updateUser(id, request);
	}

	async function handleSetUserActive(user: AuthUser, isActive: boolean) {
		setBusyUserId(user.id);
		setActionError("");

		try {
			await setUserActive(user.id, isActive);
		} catch (error) {
			setActionError(error instanceof Error ? error.message : "Failed to update user status.");
		} finally {
			setBusyUserId(null);
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Access control</p>
					<h2 className="mt-1 text-2xl font-bold text-slate-900">Users</h2>
					<p className="mt-1 text-sm text-slate-500">Create accounts, assign roles, and link player accounts ready for the future player dashboard.</p>
				</div>
				<button
					type="button"
					onClick={openCreateModal}
					className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
				>
					Create user
				</button>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<SummaryCard label="Total users" value={users.length.toString()} />
				<SummaryCard label="Active users" value={activeUserCount.toString()} />
				<SummaryCard label="Linked player accounts" value={playerLinkedCount.toString()} helper={`${adminCount} admin${adminCount === 1 ? "" : "s"}`} />
			</div>

			{(userLoadError || playerLoadError || actionError) && (
				<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
					{actionError || userLoadError || playerLoadError}
				</div>
			)}

			<div className="rounded-2xl bg-white p-4 shadow-sm">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex flex-wrap gap-2">
						{filters.map((item) => (
							<button
								key={item}
								type="button"
								onClick={() => setFilter(item)}
								className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
									filter === item ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
								}`}
							>
								{item}
							</button>
						))}
					</div>
					<input
						type="search"
						value={searchTerm}
						onChange={(event) => setSearchTerm(event.target.value)}
						placeholder="Search users or linked players"
						className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 lg:max-w-xs"
					/>
				</div>
			</div>

			<div className="rounded-2xl bg-white shadow-sm">
				<div className="border-b border-slate-200 px-5 py-4">
					<h3 className="text-lg font-bold text-slate-900">User accounts</h3>
					<p className="mt-1 text-sm text-slate-500">Admin-created accounts only. Public signup is deliberately not available.</p>
				</div>

				{isLoadingUsers || isLoadingPlayers ? (
					<div className="px-5 py-8 text-sm text-slate-500">Loading users...</div>
				) : visibleUsers.length === 0 ? (
					<div className="px-5 py-8 text-sm text-slate-500">No users match the selected filter.</div>
				) : (
					<>
						<div className="hidden overflow-x-auto lg:block">
							<table className="min-w-full divide-y divide-slate-200 text-sm">
								<thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
									<tr>
										<th className="px-4 py-3">User</th>
										<th className="px-4 py-3">Role</th>
										<th className="px-4 py-3">Linked player</th>
										<th className="px-4 py-3">Status</th>
										<th className="px-4 py-3">Last login</th>
										<th className="px-4 py-3 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{visibleUsers.map((user) => (
										<UserTableRow
											key={user.id}
											user={user}
											linkedPlayerName={user.playerId ? playersById[user.playerId] : undefined}
											isBusy={busyUserId === user.id}
											onEdit={() => openEditModal(user)}
											onSetActive={(isActive) => void handleSetUserActive(user, isActive)}
										/>
									))}
								</tbody>
							</table>
						</div>

						<div className="divide-y divide-slate-100 lg:hidden">
							{visibleUsers.map((user) => (
								<UserCard
									key={user.id}
									user={user}
									linkedPlayerName={user.playerId ? playersById[user.playerId] : undefined}
									isBusy={busyUserId === user.id}
									onEdit={() => openEditModal(user)}
									onSetActive={(isActive) => void handleSetUserActive(user, isActive)}
								/>
							))}
						</div>
					</>
				)}
			</div>

			<UserFormModal
				isOpen={isModalOpen}
				user={selectedUser}
				players={players}
				onClose={() => setIsModalOpen(false)}
				onCreateUser={handleCreateUser}
				onUpdateUser={handleUpdateUser}
			/>
		</div>
	);
}

function SummaryCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
	return (
		<div className="rounded-2xl bg-white p-5 shadow-sm">
			<p className="text-sm font-medium text-slate-500">{label}</p>
			<p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
			{helper && <p className="mt-1 text-xs font-medium text-slate-500">{helper}</p>}
		</div>
	);
}

function UserTableRow({
	user,
	linkedPlayerName,
	isBusy,
	onEdit,
	onSetActive,
}: {
	user: AuthUser;
	linkedPlayerName?: string;
	isBusy: boolean;
	onEdit: () => void;
	onSetActive: (isActive: boolean) => void;
}) {
	return (
		<tr className="hover:bg-slate-50">
			<td className="px-4 py-3">
				<p className="font-semibold text-slate-900">{user.email}</p>
				<p className="text-xs text-slate-500">Created {formatDate(user.createdAt)}</p>
			</td>
			<td className="px-4 py-3"><RoleBadge role={user.role} /></td>
			<td className="px-4 py-3 text-slate-700">{linkedPlayerName ?? "—"}</td>
			<td className="px-4 py-3"><StatusBadge isActive={user.isActive} /></td>
			<td className="px-4 py-3 text-slate-600">{formatDate(user.lastLoginAt)}</td>
			<td className="px-4 py-3">
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
	onSetActive,
}: {
	user: AuthUser;
	linkedPlayerName?: string;
	isBusy: boolean;
	onEdit: () => void;
	onSetActive: (isActive: boolean) => void;
}) {
	return (
		<div className="space-y-4 px-5 py-4">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="break-words font-semibold text-slate-900">{user.email}</p>
					<p className="mt-1 text-xs text-slate-500">Created {formatDate(user.createdAt)}</p>
				</div>
				<StatusBadge isActive={user.isActive} />
			</div>

			<div className="grid gap-3 text-sm sm:grid-cols-2">
				<div>
					<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</p>
					<div className="mt-1"><RoleBadge role={user.role} /></div>
				</div>
				<div>
					<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Linked player</p>
					<p className="mt-1 font-medium text-slate-800">{linkedPlayerName ?? "—"}</p>
				</div>
				<div>
					<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last login</p>
					<p className="mt-1 font-medium text-slate-800">{formatDate(user.lastLoginAt)}</p>
				</div>
			</div>

			<div className="flex flex-col gap-2 sm:flex-row">
				<button
					type="button"
					onClick={onEdit}
					className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
				>
					Edit
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
		<span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
			{role}
		</span>
	);
}

function StatusBadge({ isActive }: { isActive: boolean }) {
	return (
		<span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>
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
