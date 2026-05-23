import { useEffect, useMemo, useState } from "react";
import { usePlayerStore } from "../../stores/players";
import { useHistoricalStatsStore } from "../../stores/historicalStats";

export default function HistoricalStats() {
	const players = usePlayerStore((state) => state.players);

	const historicalPlayerStats = useHistoricalStatsStore(
		(state) => state.historicalPlayerStats
	);
	const initialiseHistoricalStats = useHistoricalStatsStore(
		(state) => state.initialiseHistoricalStats
	);
	const setHistoricalPlayerStats = useHistoricalStatsStore(
		(state) => state.setHistoricalPlayerStats
	);

	const [includeInactive, setIncludeInactive] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");

	useEffect(() => {
		initialiseHistoricalStats(players);
	}, [players, initialiseHistoricalStats]);

	const rows = useMemo(() => {
		return players
			.filter((player) => includeInactive || player.isActive)
			.filter((player) =>
				player.name.toLowerCase().includes(searchTerm.toLowerCase())
			)
			.map((player) => {
				const record = historicalPlayerStats.find(
					(record) => record.playerId === player.id
				);

				return {
					player,
					appearances: record?.appearances ?? 0,
					goals: record?.goals ?? 0,
					updatedAt: record?.updatedAt,
				};
			})
			.sort((firstRow, secondRow) =>
				firstRow.player.name.localeCompare(secondRow.player.name)
			);
	}, [players, historicalPlayerStats, includeInactive, searchTerm]);

	const totalAppearances = rows.reduce(
		(total, row) => total + row.appearances,
		0
	);

	const totalGoals = rows.reduce((total, row) => total + row.goals, 0);

	function handleUpdateAppearances(playerId: string, value: string) {
		const currentRecord = historicalPlayerStats.find(
			(record) => record.playerId === playerId
		);

		setHistoricalPlayerStats(playerId, {
			appearances: Number(value),
			goals: currentRecord?.goals ?? 0,
		});
	}

	function handleUpdateGoals(playerId: string, value: string) {
		const currentRecord = historicalPlayerStats.find(
			(record) => record.playerId === playerId
		);

		setHistoricalPlayerStats(playerId, {
			appearances: currentRecord?.appearances ?? 0,
			goals: Number(value),
		});
	}

	return (
		<div className="w-full min-w-0 space-y-6 overflow-hidden">
			<div>
				<h1 className="text-2xl font-bold text-blue-900">
					Historical Stats
				</h1>

				<p className="text-gray-600">
					Edit Pre 25/26 player appearances and goals. These values are used
					as the baseline for career totals.
				</p>
			</div>

			<section className="rounded-xl bg-white p-5 shadow">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
							Pre 25/26 baseline
						</p>

						<h2 className="mt-1 text-lg font-bold text-slate-900">
							Historical apps and goals
						</h2>

						<p className="mt-1 text-sm text-slate-500">
							These numbers do not belong to a season. Career totals are these
							values plus completed tracked matches from 2025/26 onwards.
						</p>
					</div>

					<div className="flex flex-wrap gap-2">
						<SummaryBadge label="Players" value={rows.length} />
						<SummaryBadge label="Apps" value={totalAppearances} />
						<SummaryBadge label="Goals" value={totalGoals} />
					</div>
				</div>
			</section>

			<div className="flex min-w-0 flex-wrap items-center gap-4 rounded-xl bg-white p-4 shadow">
				<input
					value={searchTerm}
					onChange={(event) => setSearchTerm(event.target.value)}
					placeholder="Search players..."
					className="w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm sm:w-72"
				/>

				<label className="flex items-center gap-2 text-sm font-medium text-slate-700">
					<input
						type="checkbox"
						checked={includeInactive}
						onChange={(event) => setIncludeInactive(event.target.checked)}
					/>
					Include inactive players
				</label>
			</div>

			<div className="min-w-0 overflow-hidden rounded-xl bg-white shadow">
				<div className="max-w-full overflow-x-auto">
					<table className="min-w-[760px] text-sm">
						<thead className="border-b bg-gray-50">
							<tr className="text-left">
								<th className="p-3 font-semibold text-slate-700">
									Player
								</th>
								<th className="p-3 text-center font-semibold text-slate-700">
									Pre 25/26 Apps
								</th>
								<th className="p-3 text-center font-semibold text-slate-700">
									Pre 25/26 Goals
								</th>
								<th className="p-3 text-center font-semibold text-slate-700">
									Status
								</th>
							</tr>
						</thead>

						<tbody>
							{rows.map((row) => (
								<tr key={row.player.id} className="border-b hover:bg-gray-50">
									<td className="p-3">
										<p className="font-semibold text-blue-900">
											{row.player.name}
										</p>

										<p className="text-xs text-slate-500">
											#{row.player.number} ·{" "}
											{row.player.isActive ? "Active" : "Inactive"}
										</p>
									</td>

									<td className="p-3 text-center">
										<input
											type="number"
											min={0}
											step={1}
											value={row.appearances}
											onChange={(event) =>
												handleUpdateAppearances(
													row.player.id,
													event.target.value
												)
											}
											className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm shadow-sm"
										/>
									</td>

									<td className="p-3 text-center">
										<input
											type="number"
											min={0}
											step={1}
											value={row.goals}
											onChange={(event) =>
												handleUpdateGoals(
													row.player.id,
													event.target.value
												)
											}
											className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm shadow-sm"
										/>
									</td>

									<td className="p-3 text-center">
										<span
											className={`rounded-full px-2 py-1 text-xs font-semibold ${
												row.player.isActive
													? "bg-green-100 text-green-800"
													: "bg-slate-100 text-slate-600"
											}`}
										>
											{row.player.isActive ? "Active" : "Inactive"}
										</span>
									</td>
								</tr>
							))}

							{rows.length === 0 && (
								<tr>
									<td
										colSpan={4}
										className="p-6 text-center text-sm text-slate-500"
									>
										No players found.
									</td>
								</tr>
							)}
						</tbody>

						<tfoot className="bg-slate-50">
							<tr>
								<td className="p-3 font-bold text-slate-800">Totals</td>
								<td className="p-3 text-center font-bold text-slate-800">
									{totalAppearances}
								</td>
								<td className="p-3 text-center font-bold text-slate-800">
									{totalGoals}
								</td>
								<td className="p-3" />
							</tr>
						</tfoot>
					</table>
				</div>
			</div>
		</div>
	);
}

function SummaryBadge({
	label,
	value,
}: {
	label: string;
	value: string | number;
}) {
	return (
		<span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
			{label}: {value}
		</span>
	);
}