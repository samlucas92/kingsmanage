import { useEffect, useMemo, useState } from "react";
import type {
	MatchAppearanceType,
	MatchPlayerStat,
	SelectedPlayer,
} from "../../../../stores/match";
import EmptyState from "../../../../components/compositions/EmptyState";
import StatusBadge from "../../../../components/compositions/StatusBadge";
import FilterButton from "../../../../components/compositions/FilterButton";
import MetricCard from "../../../../components/compositions/MetricCard";

type PlayerAreaFilter = "all" | "pitch" | "bench";
type NumericStatField = "goals" | "assists" | "yellowCards" | "redCards" | "minutes";

interface MatchStatsCardProps {
	selectedPlayers: SelectedPlayer[];
	playerStats: MatchPlayerStat[];
	isCompleted: boolean;
	getPlayerName: (playerId: string) => string;
	onSavePlayerStats: (playerStats: MatchPlayerStat[]) => Promise<void>;
}

function buildDraft(
	selectedPlayers: SelectedPlayer[],
	playerStats: MatchPlayerStat[]
): MatchPlayerStat[] {
	return selectedPlayers.map((selectedPlayer) => {
		const savedStat = playerStats.find((stat) => stat.playerId === selectedPlayer.playerId);
		const fallbackAppearance = selectedPlayer.area === "pitch" ? "started" : "substituteUsed";

		return {
			playerId: selectedPlayer.playerId,
			appearanceType:
				savedStat?.appearanceType && savedStat.appearanceType !== "unspecified"
					? savedStat.appearanceType
					: fallbackAppearance,
			goals: savedStat?.goals ?? 0,
			assists: savedStat?.assists ?? 0,
			yellowCards: savedStat?.yellowCards ?? 0,
			redCards: savedStat?.redCards ?? 0,
			minutes: savedStat?.minutes ?? 0,
			isMOTM: savedStat?.isMOTM ?? false,
			note: savedStat?.note ?? "",
		} satisfies MatchPlayerStat;
	});
}

export function MatchStatsCard({
	selectedPlayers,
	playerStats,
	isCompleted,
	getPlayerName,
	onSavePlayerStats,
}: MatchStatsCardProps) {
	const [draftStats, setDraftStats] = useState(() => buildDraft(selectedPlayers, playerStats));
	const [searchTerm, setSearchTerm] = useState("");
	const [areaFilter, setAreaFilter] = useState<PlayerAreaFilter>("all");
	const [isSaving, setIsSaving] = useState(false);
	const [saveMessage, setSaveMessage] = useState("");

	useEffect(() => {
		setDraftStats(buildDraft(selectedPlayers, playerStats));
		setSaveMessage("");
	}, [selectedPlayers, playerStats]);

	const orderedPlayers = useMemo(() => {
		return [...selectedPlayers].sort((firstPlayer, secondPlayer) => {
			if (firstPlayer.area === secondPlayer.area) {
				return getPlayerName(firstPlayer.playerId).localeCompare(getPlayerName(secondPlayer.playerId));
			}
			return firstPlayer.area === "pitch" ? -1 : 1;
		});
	}, [selectedPlayers, getPlayerName]);

	const filteredPlayers = orderedPlayers.filter((selectedPlayer) => {
		const matchesSearch = getPlayerName(selectedPlayer.playerId)
			.toLowerCase()
			.includes(searchTerm.toLowerCase());
		return matchesSearch && (areaFilter === "all" || selectedPlayer.area === areaFilter);
	});

	const activeStats = draftStats.filter((stat) => stat.appearanceType !== "unusedSubstitute");
	const sum = (field: NumericStatField) => activeStats.reduce((total, stat) => total + stat[field], 0);
	const starterCount = selectedPlayers.filter((player) => player.area === "pitch").length;
	const benchCount = selectedPlayers.length - starterCount;

	function updateStat(playerId: string, update: Partial<MatchPlayerStat>) {
		setSaveMessage("");
		setDraftStats((currentStats) => {
			if (!currentStats.some((stat) => stat.playerId === playerId)) {
				const selectedPlayer = selectedPlayers.find((player) => player.playerId === playerId);
				if (!selectedPlayer) return currentStats;
				return [...currentStats, { ...buildDraft([selectedPlayer], playerStats)[0], ...update }];
			}

			return currentStats.map((stat) =>
				stat.playerId === playerId ? { ...stat, ...update } : stat
			);
		});
	}

	function updateAppearance(playerId: string, appearanceType: MatchAppearanceType) {
		updateStat(playerId, appearanceType === "unusedSubstitute"
			? {
				appearanceType,
				goals: 0,
				assists: 0,
				yellowCards: 0,
				redCards: 0,
				minutes: 0,
				isMOTM: false,
			}
			: { appearanceType }
		);
	}

	function updateMotm(playerId: string, isMOTM: boolean) {
		setSaveMessage("");
		setDraftStats((currentStats) => currentStats.map((stat) => ({
			...stat,
			isMOTM: stat.playerId === playerId ? isMOTM : isMOTM ? false : stat.isMOTM,
		})));
	}

	async function saveReport() {
		setIsSaving(true);
		setSaveMessage("");
		try {
			await onSavePlayerStats(draftStats);
			setSaveMessage("Match report saved.");
		}
		catch (error) {
			setSaveMessage(error instanceof Error ? error.message : "Could not save the match report.");
		}
		finally {
			setIsSaving(false);
		}
	}

	return (
		<section className="flex max-h-[820px] min-h-0 flex-col overflow-hidden rounded-xl bg-white p-4 shadow sm:p-6">
			<div className="shrink-0">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<h2 className="text-lg font-bold text-blue-900">Player Stats</h2>
						<p className="mt-1 text-xs text-slate-500">Complete the report, then save all player stats together.</p>
					</div>
					<StatusBadge label={isCompleted ? "Report editable" : "Complete result first"} tone={isCompleted ? "success" : "warning"} />
				</div>

				<div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-3">
					<MetricCard label="Goals" value={sum("goals")} size="compact" />
					<MetricCard label="Assists" value={sum("assists")} size="compact" />
					<MetricCard label="Yellow Cards" value={sum("yellowCards")} size="compact" />
					<MetricCard label="Red Cards" value={sum("redCards")} size="compact" />
					<MetricCard label="Minutes" value={sum("minutes")} size="compact" />
					<MetricCard label="MOTM" value={activeStats.filter((stat) => stat.isMOTM).length} size="compact" />
				</div>

				{!isCompleted && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">Enter the match result first, then complete the player report.</p>}

				{orderedPlayers.length > 0 && (
					<div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
						<input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search selected players..." className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm" />
						<div className="flex flex-wrap gap-2">
							<FilterButton label="All" value="all" activeValue={areaFilter} count={selectedPlayers.length} onChange={setAreaFilter} />
							<FilterButton label="Starters" value="pitch" activeValue={areaFilter} count={starterCount} onChange={setAreaFilter} />
							<FilterButton label="Bench" value="bench" activeValue={areaFilter} count={benchCount} onChange={setAreaFilter} />
						</div>
					</div>
				)}
			</div>

			{orderedPlayers.length === 0 ? (
				<div className="mt-4"><EmptyState title="No players selected" message="Select players in the team picker before adding player stats." /></div>
			) : filteredPlayers.length === 0 ? (
				<div className="mt-4"><EmptyState title="No matching players" message="No selected players match this search or filter." /></div>
			) : (
				<div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 sm:pr-2">
					<div className="space-y-3 pb-1">
						{filteredPlayers.map((selectedPlayer) => {
							const stat = draftStats.find((item) => item.playerId === selectedPlayer.playerId)
								?? buildDraft([selectedPlayer], playerStats)[0];
							const isUnused = stat.appearanceType === "unusedSubstitute";
							return (
								<div key={selectedPlayer.playerId} className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
									<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
										<div className="min-w-0">
											<p className="truncate text-sm font-semibold text-slate-900">{getPlayerName(selectedPlayer.playerId)}</p>
											<p className="mt-1 text-xs text-slate-500">Lineup: {selectedPlayer.area === "pitch" ? "starter" : "bench"}</p>
										</div>
										<div className="flex flex-wrap gap-2">
											<select value={stat.appearanceType} disabled={!isCompleted} onChange={(event) => updateAppearance(stat.playerId, event.target.value as MatchAppearanceType)} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 disabled:bg-slate-100">
												<option value="started">Started</option>
												<option value="substituteUsed">Came on</option>
												<option value="unusedSubstitute">Unused substitute</option>
											</select>
											<label className="flex h-10 items-center gap-2 rounded-lg bg-white px-3 text-xs font-semibold text-slate-700">
												<input type="checkbox" checked={stat.isMOTM} disabled={!isCompleted || isUnused} onChange={(event) => updateMotm(stat.playerId, event.target.checked)} /> MOTM
											</label>
										</div>
									</div>
									<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
										{(["goals", "assists", "yellowCards", "redCards", "minutes"] as NumericStatField[]).map((field) => (
											<StatInput key={field} label={{ goals: "G", assists: "A", yellowCards: "YC", redCards: "RC", minutes: "Min" }[field]} value={stat[field]} disabled={!isCompleted || isUnused} onChange={(value) => updateStat(stat.playerId, { [field]: value })} />
										))}
									</div>
									<label className="mt-4 block">
										<span className="mb-1 block text-xs font-semibold text-slate-500">Player note</span>
										<textarea value={stat.note} disabled={!isCompleted} onChange={(event) => updateStat(stat.playerId, { note: event.target.value })} className="min-h-20 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-900 disabled:bg-slate-100" placeholder="Optional note about this player's performance..." />
									</label>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{orderedPlayers.length > 0 && isCompleted && (
				<div className="mt-4 flex shrink-0 flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
					<p className={`text-sm ${saveMessage.includes("saved") ? "text-emerald-700" : "text-red-700"}`}>{saveMessage}</p>
					<button type="button" disabled={isSaving} onClick={() => void saveReport()} className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:opacity-60">{isSaving ? "Saving..." : "Save match report"}</button>
				</div>
			)}
		</section>
	);
}

function StatInput({ label, value, disabled, onChange }: { label: string; value: number; disabled: boolean; onChange: (value: number) => void }) {
	return (
		<label className="block">
			<span className="mb-1 block text-center text-xs font-semibold text-slate-500">{label}</span>
			<input type="text" inputMode="numeric" pattern="[0-9]*" value={String(value)} disabled={disabled} onChange={(event) => {
				const numericValue = event.target.value.replace(/\D/g, "");
				onChange(numericValue === "" ? 0 : Number(numericValue));
			}} className="block h-11 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-center text-base font-semibold text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400" />
		</label>
	);
}
