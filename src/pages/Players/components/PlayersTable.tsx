import type { Player } from "../../../stores/players";
import LinkButton from "../../../components/compositions/LinkButton";
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
	return (
		<div className="overflow-hidden rounded-xl bg-white shadow">
			{players.length === 0 ? (
				<div className="p-6">
					<EmptyState
						title="No players found"
						message="No squad members match your current search or filters."
					/>
				</div>
			) : (
				<table className="w-full text-sm">
					<thead className="border-b bg-gray-50">
						<tr className="text-left">
							<th className="p-3">No.</th>
							<th className="p-3">Name</th>
							<th className="p-3">Positions</th>
							<th className="p-3">Apps</th>
							<th className="p-3">Status</th>
							<th className="p-3 text-right">Actions</th>
						</tr>
					</thead>

					<tbody>
						{players.map((player) => (
							<tr key={player.id} className="border-b hover:bg-gray-50">
								<td className="p-3">{player.number}</td>

								<td className="p-3 font-medium text-blue-900">
									<LinkButton to={`/players/${player.id}`} variant="plain">
										{player.name}
									</LinkButton>
								</td>

								<td className="p-3">
									<div className="flex flex-wrap gap-2">
										{player.positions.map((position) => (
											<span
												key={position}
												className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
											>
												{position}
											</span>
										))}
									</div>
								</td>

								<td className="p-3">{player.appearances}</td>

								<td className="p-3">
									<span
										className={`rounded-full px-2 py-1 text-xs font-medium ${
											player.isActive
												? "bg-green-100 text-green-700"
												: "bg-gray-200 text-gray-600"
										}`}
									>
										{player.isActive ? "Active" : "Inactive"}
									</span>
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
				</table>
			)}
		</div>
	);
}