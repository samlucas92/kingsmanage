import { useEffect, useMemo, useState } from "react";
import { usePlayerStore } from "../../stores/players";
import { useHistoricalStatsStore } from "../../stores/historicalStats";
import PanelCard from "../../components/compositions/PanelCard";
import MetricCard from "../../components/compositions/MetricCard";
import DataTable from "../../components/compositions/DataTable";
import StatusBadge from "../../components/compositions/StatusBadge";

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
			appearances: getSafeNumberValue(value),
			goals: currentRecord?.goals ?? 0,
		});
	}

	function handleUpdateGoals(playerId: string, value: string) {
		const currentRecord = historicalPlayerStats.find(
			(record) => record.playerId === playerId
		);

		setHistoricalPlayerStats(playerId, {
			appearances: currentRecord?.appearances ?? 0,
			goals: getSafeNumberValue(value),
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

			<PanelCard>
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="min-w-0">
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

					<StatusBadge label="Career baseline" tone="info" />
				</div>
			</PanelCard>

			<div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
				<MetricCard label="Players" value={rows.length} />
				<MetricCard label="Pre 25/26 Apps" value={totalAppearances} />
				<MetricCard label="Pre 25/26 Goals" value={totalGoals} />
			</div>

			<PanelCard contentClassName="flex min-w-0 flex-wrap items-center gap-4">
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
			</PanelCard>

			<div className="min-w-0 overflow-hidden rounded-xl bg-white shadow">
				<DataTable
					empty={rows.length === 0}
					emptyTitle="No players found"
					emptyMessage="No players match your current search or filters."
					minWidthClassName="min-w-[760px]"
				>
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
											handleUpdateGoals(row.player.id, event.target.value)
										}
										className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm shadow-sm"
									/>
								</td>

								<td className="p-3 text-center">
									<StatusBadge
										label={row.player.isActive ? "Active" : "Inactive"}
										tone={row.player.isActive ? "success" : "neutral"}
									/>
								</td>
							</tr>
						))}
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
				</DataTable>
			</div>
		</div>
	);
}

function getSafeNumberValue(value: string) {
	const numberValue = Number(value);

	if (!Number.isFinite(numberValue) || numberValue < 0) {
		return 0;
	}

	return numberValue;
}