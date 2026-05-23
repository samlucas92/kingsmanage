import { useMemo, useState } from "react";
import { usePlayerStore } from "../../stores/players";
import { useMatchStore } from "../../stores/match";

type StatsRow = {
	id: string;
	name: string;
	number: number;
	positions: string;
	manualApps: number;
	calculatedApps: number;
	starts: number;
	bench: number;
	combinedApps: number;
	goals: number;
	assists: number;
	yellowCards: number;
	redCards: number;
};

type SortKey = keyof StatsRow;

const columns: {
	label: string;
	key: SortKey;
	align?: "left" | "right" | "center";
}[] = [
	{ label: "Name", key: "name", align: "left" },
	{ label: "No.", key: "number", align: "center" },
	{ label: "Positions", key: "positions", align: "left" },
	{ label: "Manual Apps", key: "manualApps", align: "center" },
	{ label: "Calc Apps", key: "calculatedApps", align: "center" },
	{ label: "Starts", key: "starts", align: "center" },
	{ label: "Bench", key: "bench", align: "center" },
	{ label: "Total Apps", key: "combinedApps", align: "center" },
	{ label: "Goals", key: "goals", align: "center" },
	{ label: "Assists", key: "assists", align: "center" },
	{ label: "YC", key: "yellowCards", align: "center" },
	{ label: "RC", key: "redCards", align: "center" },
];

export default function Stats() {
	const players = usePlayerStore((state) => state.players);
	const matches = useMatchStore((state) => state.matches);

	const [sortKey, setSortKey] = useState<SortKey>("combinedApps");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
	const [includeInactive, setIncludeInactive] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");

	const statsRows = useMemo(() => {
		return players
			.filter((player) => includeInactive || player.isActive)
			.map((player) => {
				const playerMatchStats = matches.flatMap((match) =>
					(match.playerStats ?? []).filter(
						(stat) => stat.playerId === player.id
					)
				);

				const calculatedAppearances = matches.filter((match) =>
					match.selectedPlayers.some(
						(selectedPlayer) => selectedPlayer.playerId === player.id
					)
				).length;

				const starts = matches.filter((match) =>
					match.selectedPlayers.some(
						(selectedPlayer) =>
							selectedPlayer.playerId === player.id &&
							selectedPlayer.area === "pitch"
					)
				).length;

				const bench = matches.filter((match) =>
					match.selectedPlayers.some(
						(selectedPlayer) =>
							selectedPlayer.playerId === player.id &&
							selectedPlayer.area === "bench"
					)
				).length;

				const goals = playerMatchStats.reduce(
					(total, stat) => total + stat.goals,
					0
				);

				const assists = playerMatchStats.reduce(
					(total, stat) => total + stat.assists,
					0
				);

				const yellowCards = playerMatchStats.reduce(
					(total, stat) => total + stat.yellowCards,
					0
				);

				const redCards = playerMatchStats.reduce(
					(total, stat) => total + stat.redCards,
					0
				);

				return {
					id: player.id,
					name: player.name,
					number: player.number,
					positions: player.positions.join(", "),
					manualApps: player.appearances,
					calculatedApps: calculatedAppearances,
					starts,
					bench,
					combinedApps: player.appearances + calculatedAppearances,
					goals,
					assists,
					yellowCards,
					redCards,
				};
			});
	}, [players, matches, includeInactive]);

	const filteredRows = useMemo(() => {
		return statsRows.filter((row) =>
			row.name.toLowerCase().includes(searchTerm.toLowerCase())
		);
	}, [statsRows, searchTerm]);

	const sortedRows = useMemo(() => {
		return [...filteredRows].sort((firstRow, secondRow) => {
			const firstValue = firstRow[sortKey];
			const secondValue = secondRow[sortKey];

			if (typeof firstValue === "number" && typeof secondValue === "number") {
				return sortDirection === "asc"
					? firstValue - secondValue
					: secondValue - firstValue;
			}

			return sortDirection === "asc"
				? String(firstValue).localeCompare(String(secondValue))
				: String(secondValue).localeCompare(String(firstValue));
		});
	}, [filteredRows, sortKey, sortDirection]);

	const totalGoals = statsRows.reduce((total, row) => total + row.goals, 0);
	const totalAssists = statsRows.reduce((total, row) => total + row.assists, 0);
	const totalCalculatedApps = statsRows.reduce(
		(total, row) => total + row.calculatedApps,
		0
	);
	const totalManualApps = statsRows.reduce(
		(total, row) => total + row.manualApps,
		0
	);

	function handleSort(key: SortKey) {
		if (key === sortKey) {
			setSortDirection((currentDirection) =>
				currentDirection === "asc" ? "desc" : "asc"
			);
			return;
		}

		setSortKey(key);
		setSortDirection("desc");
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-blue-900">Stats</h1>

				<p className="text-gray-600">
					Player totals from manual history and match data recorded in the app.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<StatsCard label="Manual Apps" value={totalManualApps} />
				<StatsCard label="Calculated Apps" value={totalCalculatedApps} />
				<StatsCard label="Goals" value={totalGoals} />
				<StatsCard label="Assists" value={totalAssists} />
			</div>

			<div className="flex flex-wrap items-center gap-4 rounded-xl bg-white p-4 shadow">
				<input
					value={searchTerm}
					onChange={(event) => setSearchTerm(event.target.value)}
					placeholder="Search players..."
					className="min-w-64 rounded-lg border px-3 py-2"
				/>

				<label className="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={includeInactive}
						onChange={(event) => setIncludeInactive(event.target.checked)}
					/>
					Include inactive players
				</label>
			</div>

			<div className="overflow-hidden rounded-xl bg-white shadow">
				{sortedRows.length === 0 ? (
					<div className="p-6 text-center text-sm text-slate-500">
						No player stats found.
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="border-b bg-gray-50">
								<tr>
									{columns.map((column) => (
										<th
											key={column.key}
											className={`whitespace-nowrap p-3 ${
												getAlignClass(column.align)
											}`}
										>
											<button
												type="button"
												onClick={() => handleSort(column.key)}
												className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-900"
											>
												{column.label}

												{sortKey === column.key && (
													<span className="text-xs">
														{sortDirection === "asc" ? "↑" : "↓"}
													</span>
												)}
											</button>
										</th>
									))}
								</tr>
							</thead>

							<tbody>
								{sortedRows.map((row) => (
									<tr key={row.id} className="border-b hover:bg-gray-50">
										<td className="whitespace-nowrap p-3 font-medium text-blue-900">
											{row.name}
										</td>

										<td className="p-3 text-center">{row.number}</td>

										<td className="whitespace-nowrap p-3 text-slate-600">
											{row.positions}
										</td>

										<td className="p-3 text-center">{row.manualApps}</td>
										<td className="p-3 text-center">{row.calculatedApps}</td>
										<td className="p-3 text-center">{row.starts}</td>
										<td className="p-3 text-center">{row.bench}</td>

										<td className="p-3 text-center font-semibold text-slate-900">
											{row.combinedApps}
										</td>

										<td className="p-3 text-center font-semibold text-slate-900">
											{row.goals}
										</td>

										<td className="p-3 text-center">{row.assists}</td>
										<td className="p-3 text-center">{row.yellowCards}</td>
										<td className="p-3 text-center">{row.redCards}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}

function StatsCard({
	label,
	value,
}: {
	label: string;
	value: string | number;
}) {
	return (
		<div className="rounded-xl bg-white p-5 shadow">
			<p className="text-sm font-medium text-gray-500">{label}</p>
			<p className="mt-2 text-3xl font-bold text-blue-900">{value}</p>
		</div>
	);
}

function getAlignClass(align?: "left" | "right" | "center") {
	if (align === "right") {
		return "text-right";
	}

	if (align === "center") {
		return "text-center";
	}

	return "text-left";
}