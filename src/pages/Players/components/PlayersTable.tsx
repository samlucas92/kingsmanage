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
		<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
			<div className="divide-y divide-slate-100 md:hidden">
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
		<div className="flex items-center gap-3 px-3 py-3">
			<LinkButton to={`/players/${player.id}`} variant="plain" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-yepset-100 text-sm font-black text-yepset-900">
				{getInitials(player.name)}
			</LinkButton>

			<LinkButton to={`/players/${player.id}`} variant="plain" className="min-w-0 flex-1">
				<span className="block truncate text-sm font-black text-slate-950">
					{player.name}
				</span>
				<span className="mt-1 block truncate text-[11px] font-semibold text-slate-500">
					#{player.number} · {player.positions.length > 0 ? player.positions.join(", ") : "No positions"}
				</span>
				<span className="mt-1 block text-[10px] font-bold text-yepset-700">
					{player.appearances} appearances · {player.isActive ? "Active" : "Inactive"}
				</span>
			</LinkButton>

			<LinkButton
				to={`/players/${player.id}`}
				variant="plain"
				className="grid h-9 w-7 shrink-0 place-items-center text-xl text-yepset-700"
			>
				›
			</LinkButton>

			<details className="group relative shrink-0">
				<summary className="grid h-9 w-7 cursor-pointer list-none place-items-center text-lg font-black text-slate-500">
					⋮
				</summary>
				<div className="absolute right-0 z-10 mt-1 grid min-w-36 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
					<button
						type="button"
						onClick={() => onEditPlayer(player)}
						className="rounded-lg px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
					>
						Edit player
					</button>
					<button
						type="button"
						onClick={() => onTogglePlayerActive(player.id)}
						className="rounded-lg px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
					>
						{player.isActive ? "Deactivate" : "Activate"}
					</button>
				</div>
			</details>
		</div>
	);
}

function getInitials(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("");
}
