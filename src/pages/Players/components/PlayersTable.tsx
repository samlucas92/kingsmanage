import type { Player } from "../../../stores/players";
import LinkButton from "../../../components/compositions/LinkButton";
import DataTable from "../../../components/compositions/DataTable";
import StatusBadge from "../../../components/compositions/StatusBadge";

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
	return (
		<div className="overflow-hidden rounded-xl bg-white shadow">
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
	);
}