import { useEffect, useMemo } from "react";
import { usePlayerStore } from "../../stores/players";
import { useHistoricalStatsStore } from "../../stores/historicalStats";
import PanelCard from "../../components/compositions/PanelCard";
import MetricCard from "../../components/compositions/MetricCard";
import DataTable from "../../components/compositions/DataTable";
import StatusBadge from "../../components/compositions/StatusBadge";
import { useState } from "react";

export default function HistoricalStats() {
	const players = usePlayerStore((state) => state.players);
	const loadPlayers = usePlayerStore((state) => state.loadPlayers);
	const isLoadingPlayers = usePlayerStore((state) => state.isLoadingPlayers);
	const playerLoadError = usePlayerStore((state) => state.playerLoadError);

	const historicalPlayerStats = useHistoricalStatsStore(
		(state) => state.historicalPlayerStats
	);
	const isLoadingHistoricalStats = useHistoricalStatsStore(
		(state) => state.isLoadingHistoricalStats
	);
	const historicalStatsLoadError = useHistoricalStatsStore(
		(state) => state.historicalStatsLoadError
	);
	const loadHistoricalStats = useHistoricalStatsStore(
		(state) => state.loadHistoricalStats
	);
	const setHistoricalPlayerStats = useHistoricalStatsStore(
		(state) => state.setHistoricalPlayerStats
	);
	const saveHistoricalPlayerStats = useHistoricalStatsStore(
		(state) => state.saveHistoricalPlayerStats
	);

	const [includeInactive, setIncludeInactive] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");

	useEffect(() => {
		void loadPlayers(true);
		void loadHistoricalStats(true);
	}, [loadHistoricalStats, loadPlayers]);

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
	const isLoading = isLoadingPlayers || isLoadingHistoricalStats;
	const errorMessage = playerLoadError || historicalStatsLoadError;

	function handleUpdateAppearances(playerId: string, value: string) {
		const currentRecord = historicalPlayerStats.find(
			(record) => record.playerId === playerId
		);

		void setHistoricalPlayerStats(playerId, {
			appearances: getSafeNumberValue(value),
			goals: currentRecord?.goals ?? 0,
		});
	}

	function handleUpdateGoals(playerId: string, value: string) {
		const currentRecord = historicalPlayerStats.find(
			(record) => record.playerId === playerId
		);

		void setHistoricalPlayerStats(playerId, {
			appearances: currentRecord?.appearances ?? 0,
			goals: getSafeNumberValue(value),
		});
	}

	function handleSave(playerId: string) {
		const currentRecord = historicalPlayerStats.find(
			(record) => record.playerId === playerId
		);

		void saveHistoricalPlayerStats(playerId, {
			appearances: currentRecord?.appearances ?? 0,
			goals: currentRecord?.goals ?? 0,
		});
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-slate-900">Historical Stats</h1>
				<p className="mt-1 text-sm text-slate-600">
					Edit pre 25/26 player appearances and goals. These values are used as the baseline for career totals.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<MetricCard label="Players shown" value={rows.length} />
				<MetricCard label="Historical apps" value={totalAppearances} />
				<MetricCard label="Historical goals" value={totalGoals} />
				<MetricCard
					label="Status"
					value={isLoading ? "Loading" : "Ready"}
					helper="Opening this page does not save changes."
				/>
			</div>

			<PanelCard
				title="Pre-app historical totals"
				description="Changes save when you leave a field or press Enter."
				action={
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
						<input
							type="search"
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
								className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
							/>
							Include inactive players
						</label>
					</div>
				}
			>
				{isLoading && (
					<div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
						Loading historical stats...
					</div>
				)}

				{errorMessage && (
					<div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
						{errorMessage}
					</div>
				)}

				<DataTable
					empty={!isLoading && rows.length === 0}
					emptyTitle="No players found"
					emptyMessage="Try changing the search or inactive player filter."
					minWidthClassName="min-w-[720px]"
				>
					<thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
						<tr>
							<th className="px-4 py-3 text-left font-semibold">Player</th>
							<th className="px-4 py-3 text-center font-semibold">Pre 25/26 Apps</th>
							<th className="px-4 py-3 text-center font-semibold">Pre 25/26 Goals</th>
							<th className="px-4 py-3 text-left font-semibold">Status</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100 text-sm">
						{rows.map((row) => (
							<tr key={row.player.id} className="bg-white">
								<td className="px-4 py-3">
									<div className="font-semibold text-slate-900">{row.player.name}</div>
									<div className="text-xs text-slate-500">
										#{row.player.number} · {row.player.isActive ? "Active" : "Inactive"}
									</div>
								</td>
								<td className="px-4 py-3 text-center">
									<input
										type="number"
										min="0"
										value={row.appearances}
										onChange={(event) =>
											handleUpdateAppearances(row.player.id, event.target.value)
										}
										onBlur={() => handleSave(row.player.id)}
										onKeyDown={(event) => {
											if (event.key === "Enter") {
												event.currentTarget.blur();
											}
										}}
										className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm shadow-sm"
									/>
								</td>
								<td className="px-4 py-3 text-center">
									<input
										type="number"
										min="0"
										value={row.goals}
										onChange={(event) =>
											handleUpdateGoals(row.player.id, event.target.value)
										}
										onBlur={() => handleSave(row.player.id)}
										onKeyDown={(event) => {
											if (event.key === "Enter") {
												event.currentTarget.blur();
											}
										}}
										className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm shadow-sm"
									/>
								</td>
								<td className="px-4 py-3">
									<StatusBadge
										label={row.updatedAt ? "Saved" : "No record"}
										tone={row.updatedAt ? "success" : "neutral"}
									/>
								</td>
							</tr>
						))}
						{rows.length > 0 && (
							<tr className="bg-slate-50 font-semibold text-slate-900">
								<td className="px-4 py-3">Totals</td>
								<td className="px-4 py-3 text-center">{totalAppearances}</td>
								<td className="px-4 py-3 text-center">{totalGoals}</td>
								<td className="px-4 py-3" />
							</tr>
						)}
					</tbody>
				</DataTable>
			</PanelCard>
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
