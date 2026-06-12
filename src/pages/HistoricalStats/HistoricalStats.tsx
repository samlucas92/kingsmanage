import { useEffect, useMemo, useState } from "react";
import { usePlayerStore } from "../../stores/players";
import { useHistoricalStatsStore } from "../../stores/historicalStats";
import PanelCard from "../../components/compositions/PanelCard";
import MetricCard from "../../components/compositions/MetricCard";
import DataTable from "../../components/compositions/DataTable";
import StatusBadge from "../../components/compositions/StatusBadge";

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
	const initialiseHistoricalStats = useHistoricalStatsStore(
		(state) => state.initialiseHistoricalStats
	);
	const setHistoricalPlayerStats = useHistoricalStatsStore(
		(state) => state.setHistoricalPlayerStats
	);
	const syncHistoricalStatsToApi = useHistoricalStatsStore(
		(state) => state.syncHistoricalStatsToApi
	);
	const [includeInactive, setIncludeInactive] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");

	useEffect(() => {
		void loadPlayers(true);
		void loadHistoricalStats(true);
	}, [loadHistoricalStats, loadPlayers]);

	useEffect(() => {
		if (players.length === 0) {
			return;
		}

		initialiseHistoricalStats(players);
	}, [players, initialiseHistoricalStats]);

	useEffect(() => {
		if (players.length === 0 || historicalPlayerStats.length === 0) {
			return;
		}

		void syncHistoricalStatsToApi();
	}, [historicalPlayerStats, players.length, syncHistoricalStatsToApi]);

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

	const isLoading = isLoadingPlayers || isLoadingHistoricalStats;
	const errorMessage = playerLoadError || historicalStatsLoadError;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-slate-900">Historical Stats</h1>
				<p className="mt-1 text-sm text-slate-600">
					Edit Pre 25/26 player appearances and goals. These values are used as
					the baseline for career totals.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<MetricCard
					label="Pre 25/26 Apps"
					value={totalAppearances}
				/>
				<MetricCard
					label="Pre 25/26 Goals"
					value={totalGoals}
				/>
			</div>

			<PanelCard
				title="Pre 25/26 baseline"
				description="These numbers do not belong to a season. Career totals are these values plus completed tracked matches from 2025/26 onwards."
			>
				<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<input
						value={searchTerm}
						onChange={(event) => setSearchTerm(event.target.value)}
						placeholder="Search players..."
						className="w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm sm:w-72"
					/>
					<label className="flex items-center gap-2 text-sm text-slate-600">
						<input
							type="checkbox"
							checked={includeInactive}
							onChange={(event) => setIncludeInactive(event.target.checked)}
						/>
						Include inactive players
					</label>
				</div>

				{isLoading && (
					<p className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
						Loading historical stats...
					</p>
				)}

				{errorMessage && (
					<p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						{errorMessage}
					</p>
				)}

				<DataTable>
					<thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
						<tr>
							<th className="px-4 py-3">Player</th>
							<th className="px-4 py-3">Pre 25/26 Apps</th>
							<th className="px-4 py-3">Pre 25/26 Goals</th>
							<th className="px-4 py-3">Status</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100 text-sm">
						{rows.map((row) => (
							<tr key={row.player.id}>
								<td className="px-4 py-3 font-medium text-slate-900">
									{row.player.name}
									<div className="text-xs font-normal text-slate-500">
										#{row.player.number} · {" "}
										{row.player.isActive ? "Active" : "Inactive"}
									</div>
								</td>
								<td className="px-4 py-3">
									<input
										type="number"
										min="0"
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
								<td className="px-4 py-3">
									<input
										type="number"
										min="0"
										value={row.goals}
										onChange={(event) =>
											handleUpdateGoals(row.player.id, event.target.value)
										}
										className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm shadow-sm"
									/>
								</td>
								<td className="px-4 py-3">
									<StatusBadge
										label={row.player.isActive ? "Active" : "Inactive"}
										tone={row.player.isActive ? "green" : "slate"}
									/>
								</td>
							</tr>
						))}
					</tbody>
					<tfoot className="bg-slate-50 text-sm font-semibold text-slate-900">
						<tr>
							<td className="px-4 py-3">Totals</td>
							<td className="px-4 py-3">{totalAppearances}</td>
							<td className="px-4 py-3">{totalGoals}</td>
							<td className="px-4 py-3" />
						</tr>
					</tfoot>
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
