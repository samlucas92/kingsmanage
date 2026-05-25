import type { Player } from "../../../stores/players";
import LinkButton from "../../../components/compositions/LinkButton";
import DataTable from "../../../components/compositions/DataTable";
import StatusBadge from "../../../components/compositions/StatusBadge";
import EmptyState from "../../../components/compositions/EmptyState";

interface PlayersTableProps {
	players: Player[];
	onEditPlayer: (player: Player) => void;
	onTogglePlayerActive: (playerId: string) => void;
}

export function PlayersTable({
	players,
	onEditPlayer,
	onTogglePlayerActive,
}: PlayersTableProps) {
	if (players.length === 0) {
		return (
			<div className="overflow-hidden rounded-xl bg-white shadow">
				<div className="p-6">
					<EmptyState
						title="No players found"
						message="No squad members match your current search or filters."
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-xl bg-white shadow">
			<div className="space-y-3 p-3 md:hidden">
				{players.map((player) => (
					<PlayerMobileCard
						key={player.id}
						player={player}
						onEditPlayer={onEditPlayer}
						onTogglePlayerActive={onTogglePlayerActive}
					/>
				))}
			</div>

			<div className="hidden md:block">
				<DataTable
					empty={players.length === 0}
					emptyTitle="No players found"
					emptyMessage="No squad members match your current search or filters."
					minWidthClassName="min-w-[760px]"
				>
					<thead className="border-b bg-gray-50">
						<tr className="text-left">
							<th className="w-[80px] p-3">No.</th>
							<th className="min-w-[180px] p-3">Name</th>
							<th className="min-w-[220px] p-3">Positions</th>
							<th className="w-[90px] p-3">Apps</th>
							<th className="w-[120px] p-3">Status</th>
							<th className="w-[220px] p-3 text-right">Actions</th>
						</tr>
					</thead>

					<tbody>
						{players.map((player) => (
							<tr key={player.id} className="border-b hover:bg-gray-50">
								<td className="whitespace-nowrap p-3">{player.number}</td>

								<td className="p-3 font-medium text-blue-900">
									<LinkButton to={`/players/${player.id}`} variant="plain">
										{player.name}
									</LinkButton>
								</td>

								<td className="p-3">
									<div className="flex flex-wrap gap-2">
										{player.positions.map((position) => (
											<StatusBadge
												key={position}
												label={position}
												tone="info"
											/>
										))}
									</div>
								</td>

								<td className="whitespace-nowrap p-3">
									{player.appearances}
								</td>

								<td className="p-3">
									<StatusBadge
										label={player.isActive ? "Active" : "Inactive"}
										tone={player.isActive ? "success" : "neutral"}
									/>
								</td>

								<td className="p-3">
									<div className="flex justify-end gap-2">
										<button
											type="button"
											onClick={() => onEditPlayer(player)}
											className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-100"
										>
											Edit
										</button>

										<button
											type="button"
											onClick={() => onTogglePlayerActive(player.id)}
											className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-100"
										>
											{player.isActive ? "Deactivate" : "Activate"}
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</DataTable>
			</div>
		</div>
	);
}

function PlayerMobileCard({
	player,
	onEditPlayer,
	onTogglePlayerActive,
}: {
	player: Player;
	onEditPlayer: (player: Player) => void;
	onTogglePlayerActive: (playerId: string) => void;
}) {
	return (
		<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
						#{player.number}
					</p>

					<LinkButton to={`/players/${player.id}`} variant="plain">
						<span className="mt-1 block truncate text-lg font-bold text-blue-900">
							{player.name}
						</span>
					</LinkButton>
				</div>

				<StatusBadge
					label={player.isActive ? "Active" : "Inactive"}
					tone={player.isActive ? "success" : "neutral"}
				/>
			</div>

			<div className="mt-4 grid grid-cols-2 gap-2">
				<div className="rounded-xl bg-slate-50 p-3 text-center">
					<p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
						Apps
					</p>

					<p className="mt-1 text-lg font-black text-slate-900">
						{player.appearances}
					</p>
				</div>

				<div className="rounded-xl bg-slate-50 p-3 text-center">
					<p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
						Positions
					</p>

					<p className="mt-1 text-lg font-black text-slate-900">
						{player.positions.length}
					</p>
				</div>
			</div>

			<div className="mt-4 flex flex-wrap gap-2">
				{player.positions.length === 0 ? (
					<StatusBadge label="No positions" tone="neutral" />
				) : (
					player.positions.map((position) => (
						<StatusBadge key={position} label={position} tone="info" />
					))
				)}
			</div>

			<div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
				<LinkButton
					to={`/players/${player.id}`}
					variant="plain"
					className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-center text-sm font-semibold text-blue-900 hover:bg-blue-100"
				>
					View
				</LinkButton>

				<button
					type="button"
					onClick={() => onEditPlayer(player)}
					className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
				>
					Edit
				</button>

				<button
					type="button"
					onClick={() => onTogglePlayerActive(player.id)}
					className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
						player.isActive
							? "border-red-200 bg-red-50 text-red-800 hover:bg-red-100"
							: "border-green-200 bg-green-50 text-green-800 hover:bg-green-100"
					}`}
				>
					{player.isActive ? "Deactivate" : "Activate"}
				</button>
			</div>
		</div>
	);
}