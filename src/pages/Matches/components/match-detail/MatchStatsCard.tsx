import { useMemo, useState } from "react";
import type {
	MatchAppearanceType,
	MatchPlayerStat,
	SelectedPlayer,
} from "../../../../stores/match";
import EmptyState from "../../../../components/compositions/EmptyState";
import FilterButton from "../../../../components/compositions/FilterButton";
import StatusBadge from "../../../../components/compositions/StatusBadge";
import {
	buildMatchStatsDraft,
	calculateMinutesPlayed,
	DEFAULT_MATCH_DURATION,
	getParticipationMinute,
	updateMotmDraft,
	updateStatsForMatchDuration,
} from "./matchStatsDraft";

type PlayerAreaFilter = "all" | "pitch" | "bench";
type CountStatField = "goals" | "assists" | "yellowCards" | "redCards";

interface MatchStatsCardProps {
	selectedPlayers: SelectedPlayer[];
	playerStats: MatchPlayerStat[];
	isCompleted: boolean;
	getPlayerName: (playerId: string) => string;
	onSavePlayerStats: (playerStats: MatchPlayerStat[]) => Promise<void>;
}

const appearanceOptions: Array<{
	value: Exclude<MatchAppearanceType, "unspecified">;
	label: string;
}> = [
	{ value: "started", label: "Started" },
	{ value: "substituteUsed", label: "Came on" },
	{ value: "unusedSubstitute", label: "Did not play" },
];

const countStatLabels: Record<CountStatField, string> = {
	goals: "Goals",
	assists: "Assists",
	yellowCards: "Yellow",
	redCards: "Red",
};

export function MatchStatsCard({
	selectedPlayers,
	playerStats,
	isCompleted,
	getPlayerName,
	onSavePlayerStats,
}: MatchStatsCardProps) {
	const [matchDuration, setMatchDuration] = useState(DEFAULT_MATCH_DURATION);
	const [draftStats, setDraftStats] = useState(() =>
		buildMatchStatsDraft(selectedPlayers, playerStats)
	);
	const [savedStats, setSavedStats] = useState(() =>
		buildMatchStatsDraft(selectedPlayers, playerStats)
	);
	const [searchTerm, setSearchTerm] = useState("");
	const [areaFilter, setAreaFilter] = useState<PlayerAreaFilter>("all");
	const [isSaving, setIsSaving] = useState(false);
	const [saveMessage, setSaveMessage] = useState("");
	const [draftSource, setDraftSource] = useState({ selectedPlayers, playerStats });

	if (
		draftSource.selectedPlayers !== selectedPlayers ||
		draftSource.playerStats !== playerStats
	) {
		const nextDraft = buildMatchStatsDraft(selectedPlayers, playerStats, matchDuration);
		setDraftSource({ selectedPlayers, playerStats });
		setDraftStats(nextDraft);
		setSavedStats(nextDraft);
		setSaveMessage("");
	}

	const orderedPlayers = useMemo(() => {
		return [...selectedPlayers].sort((firstPlayer, secondPlayer) => {
			if (firstPlayer.area === secondPlayer.area) {
				return getPlayerName(firstPlayer.playerId).localeCompare(
					getPlayerName(secondPlayer.playerId)
				);
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

	const activeStats = draftStats.filter(
		(stat) => stat.appearanceType !== "unusedSubstitute"
	);
	const sum = (field: CountStatField | "minutes") =>
		activeStats.reduce((total, stat) => total + stat[field], 0);
	const starterCount = selectedPlayers.filter((player) => player.area === "pitch").length;
	const benchCount = selectedPlayers.length - starterCount;
	const hasChanges = JSON.stringify(draftStats) !== JSON.stringify(savedStats);

	function updateStat(playerId: string, update: Partial<MatchPlayerStat>) {
		setSaveMessage("");
		setDraftStats((currentStats) => {
			if (!currentStats.some((stat) => stat.playerId === playerId)) {
				const selectedPlayer = selectedPlayers.find((player) => player.playerId === playerId);
				if (!selectedPlayer) return currentStats;
				return [
					...currentStats,
					{
						...buildMatchStatsDraft(
							[selectedPlayer],
							playerStats,
							matchDuration
						)[0],
						...update,
					},
				];
			}

			return currentStats.map((stat) =>
				stat.playerId === playerId ? { ...stat, ...update } : stat
			);
		});
	}

	function updateAppearance(
		playerId: string,
		appearanceType: Exclude<MatchAppearanceType, "unspecified">
	) {
		const currentStat = draftStats.find((stat) => stat.playerId === playerId);

		if (appearanceType === "unusedSubstitute") {
			updateStat(playerId, {
				appearanceType,
				goals: 0,
				assists: 0,
				yellowCards: 0,
				redCards: 0,
				minutes: 0,
				isMOTM: false,
			});
			return;
		}

		updateStat(playerId, {
			appearanceType,
			minutes:
				appearanceType === "started" &&
				currentStat?.appearanceType === "unusedSubstitute"
					? matchDuration
					: currentStat?.minutes ?? (appearanceType === "started" ? matchDuration : 0),
		});
	}

	function updateParticipationMinute(playerId: string, eventMinute: number) {
		const stat = draftStats.find((item) => item.playerId === playerId);
		if (!stat) return;
		updateStat(playerId, {
			minutes: calculateMinutesPlayed(stat.appearanceType, eventMinute, matchDuration),
		});
	}

	function updateMatchDuration(nextDuration: number) {
		const safeDuration = Math.min(Math.max(Math.round(nextDuration), 1), 180);
		if (safeDuration === matchDuration) return;
		setSaveMessage("");
		setDraftStats((currentStats) =>
			updateStatsForMatchDuration(currentStats, matchDuration, safeDuration)
		);
		setMatchDuration(safeDuration);
	}

	function updateMotm(playerId: string, isMOTM: boolean) {
		setSaveMessage("");
		setDraftStats((currentStats) => updateMotmDraft(currentStats, playerId, isMOTM));
	}

	async function saveReport() {
		setIsSaving(true);
		setSaveMessage("");
		try {
			await onSavePlayerStats(draftStats);
			setSavedStats(draftStats);
			setSaveMessage("Match report saved.");
		} catch (error) {
			setSaveMessage(
				error instanceof Error
					? error.message
					: "Could not save the match report."
			);
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<section className="rounded-2xl bg-white p-4 shadow sm:p-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
						Post-match
					</p>
					<h2 className="mt-1 text-xl font-bold text-slate-950">Match report</h2>
					<p className="mt-1 max-w-2xl text-sm text-slate-500">
						Record who played and add their match events. Substitution times calculate minutes automatically.
					</p>
				</div>
				<StatusBadge
					label={isCompleted ? "Ready to report" : "Complete result first"}
					tone={isCompleted ? "success" : "warning"}
				/>
			</div>

			<div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
				<SummaryItem label="Played" value={`${activeStats.length}/${selectedPlayers.length}`} />
				<SummaryItem label="Goals" value={sum("goals")} />
				<SummaryItem label="Assists" value={sum("assists")} />
				<SummaryItem label="Cards" value={sum("yellowCards") + sum("redCards")} />
				<SummaryItem label="Minutes" value={sum("minutes")} />
				<SummaryItem
					label="MOTM"
					value={activeStats.filter((stat) => stat.isMOTM).length}
				/>
			</div>

			{!isCompleted && (
				<p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
					Enter the final score first, then this match report will become editable.
				</p>
			)}

			{orderedPlayers.length > 0 && (
				<div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
					<div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
						<label>
							<span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
								Find a player
							</span>
							<input
								value={searchTerm}
								onChange={(event) => setSearchTerm(event.target.value)}
								placeholder="Search selected players..."
								className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
							/>
						</label>
						<label className="block lg:w-44">
							<span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
								Match length
							</span>
							<span className="flex h-11 items-center rounded-xl border border-slate-300 bg-white px-3 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
								<input
									type="number"
									min="1"
									max="180"
									value={matchDuration}
									disabled={!isCompleted}
									onChange={(event) => {
										const value = Number(event.target.value);
										if (Number.isFinite(value) && value > 0) updateMatchDuration(value);
									}}
									className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none disabled:text-slate-400"
								/>
								<span className="text-xs font-semibold text-slate-500">minutes</span>
							</span>
						</label>
					</div>
					<div className="mt-3 flex flex-wrap gap-2">
						<FilterButton label="All" value="all" activeValue={areaFilter} count={selectedPlayers.length} onChange={setAreaFilter} />
						<FilterButton label="Starters" value="pitch" activeValue={areaFilter} count={starterCount} onChange={setAreaFilter} />
						<FilterButton label="Bench" value="bench" activeValue={areaFilter} count={benchCount} onChange={setAreaFilter} />
					</div>
				</div>
			)}

			{orderedPlayers.length === 0 ? (
				<div className="mt-5">
					<EmptyState title="No players selected" message="Select players in the squad before completing the match report." />
				</div>
			) : filteredPlayers.length === 0 ? (
				<div className="mt-5">
					<EmptyState title="No matching players" message="No selected players match this search or filter." />
				</div>
			) : (
				<div className="mt-5 space-y-3">
					{filteredPlayers.map((selectedPlayer) => {
						const stat = draftStats.find((item) => item.playerId === selectedPlayer.playerId)
							?? buildMatchStatsDraft([selectedPlayer], playerStats, matchDuration)[0];
						const isUnused = stat.appearanceType === "unusedSubstitute";
						const eventMinute = getParticipationMinute(stat, matchDuration);

						return (
							<article
								key={selectedPlayer.playerId}
								className={`overflow-hidden rounded-2xl border ${isUnused ? "border-slate-200 bg-slate-50/80" : "border-blue-100 bg-white shadow-sm"}`}
							>
								<div className="p-3 sm:p-4">
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<h3 className="text-base font-bold leading-tight text-slate-950">
												{getPlayerName(selectedPlayer.playerId)}
											</h3>
											<p className="mt-1 text-xs font-medium text-slate-500">
												Selected as {selectedPlayer.area === "pitch" ? "a starter" : "a substitute"}
											</p>
										</div>
										<button
											type="button"
											disabled={!isCompleted || isUnused}
											onClick={() => updateMotm(stat.playerId, !stat.isMOTM)}
											aria-pressed={stat.isMOTM}
											className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${stat.isMOTM ? "bg-amber-300 text-amber-950" : "border border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50"}`}
										>
											★ MOTM
										</button>
									</div>

									<div className="mt-4 grid grid-cols-3 rounded-xl bg-slate-100 p-1">
										{appearanceOptions.map((option) => {
											const isActive = stat.appearanceType === option.value;
											return (
												<button
													key={option.value}
													type="button"
													disabled={!isCompleted}
													onClick={() => updateAppearance(stat.playerId, option.value)}
													className={`min-h-10 rounded-lg px-2 py-2 text-xs font-bold transition disabled:cursor-not-allowed ${isActive ? "bg-blue-700 text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}
												>
													{option.label}
												</button>
											);
										})}
									</div>

									{isUnused ? (
										<div className="mt-3 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-center text-xs font-medium text-slate-500">
											No appearance or player events will be recorded.
										</div>
									) : (
										<>
											<div className="mt-3 flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
												<div>
													<p className="text-xs font-bold uppercase tracking-wide text-blue-700">
														{stat.appearanceType === "substituteUsed" ? "Substitution" : "Time played"}
													</p>
													<p className="mt-0.5 text-sm font-semibold text-slate-900">
														{stat.minutes === matchDuration ? "Played the full match" : `${stat.minutes} minutes played`}
													</p>
												</div>
												<div className="flex items-center gap-2 sm:justify-end">
													<label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 sm:flex-none">
														<span className="whitespace-nowrap text-xs font-semibold text-slate-600">
															{stat.appearanceType === "substituteUsed" ? "Came on" : "Came off"}
														</span>
														<input
															type="number"
															min="0"
															max={matchDuration}
															value={eventMinute}
															disabled={!isCompleted}
															onChange={(event) => updateParticipationMinute(stat.playerId, Number(event.target.value))}
															className="w-14 bg-transparent text-right text-sm font-bold text-slate-950 outline-none disabled:text-slate-400"
														/>
														<span className="text-xs font-bold text-slate-400">′</span>
													</label>
													{stat.appearanceType === "started" && (
														<button
															type="button"
															disabled={!isCompleted || stat.minutes === matchDuration}
															onClick={() => updateParticipationMinute(stat.playerId, matchDuration)}
															className="h-10 shrink-0 rounded-lg border border-blue-200 bg-white px-3 text-xs font-bold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
														>
															Full match
														</button>
													)}
												</div>
											</div>

											<div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
												{(["goals", "assists", "yellowCards", "redCards"] as CountStatField[]).map((field) => (
													<StatStepper
														key={field}
														label={countStatLabels[field]}
														value={stat[field]}
														disabled={!isCompleted}
														onChange={(value) => updateStat(stat.playerId, { [field]: value })}
													/>
												))}
											</div>
										</>
									)}
								</div>

								<details className="group border-t border-slate-200 bg-white/70">
									<summary className="flex cursor-pointer list-none items-center justify-between px-3 py-3 text-xs font-bold text-slate-600 sm:px-4 [&::-webkit-details-marker]:hidden">
										<span>{stat.note ? "Player note added" : "Add player note"}</span>
										<span className="text-base text-slate-400 transition group-open:rotate-45">+</span>
									</summary>
									<div className="px-3 pb-3 sm:px-4 sm:pb-4">
										<textarea
											value={stat.note}
											disabled={!isCompleted}
											onChange={(event) => updateStat(stat.playerId, { note: event.target.value })}
											className="min-h-20 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
											placeholder="Optional note about this player's performance..."
										/>
									</div>
								</details>
							</article>
						);
					})}
				</div>
			)}

			{orderedPlayers.length > 0 && isCompleted && (
				<div className="sticky bottom-20 z-10 -mx-2 mt-5 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur sm:mx-0 sm:flex sm:items-center sm:justify-between lg:bottom-4">
					<div className="mb-2 min-w-0 sm:mb-0">
						<p className="text-sm font-bold text-slate-900">
							{hasChanges ? "Unsaved report changes" : "Match report up to date"}
						</p>
						{saveMessage && (
							<p className={`mt-0.5 text-xs ${saveMessage.includes("saved") ? "text-emerald-700" : "text-red-700"}`}>
								{saveMessage}
							</p>
						)}
					</div>
					<button
						type="button"
						disabled={isSaving}
						onClick={() => void saveReport()}
						className="w-full rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-800 disabled:opacity-60 sm:w-auto"
					>
						{isSaving ? "Saving..." : "Save match report"}
					</button>
				</div>
			)}
		</section>
	);
}

function SummaryItem({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
			<p className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-500">{label}</p>
			<p className="mt-0.5 text-lg font-bold text-blue-950">{value}</p>
		</div>
	);
}

function StatStepper({
	label,
	value,
	disabled,
	onChange,
}: {
	label: string;
	value: number;
	disabled: boolean;
	onChange: (value: number) => void;
}) {
	return (
		<div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
			<p className="mb-1.5 text-center text-[0.65rem] font-bold uppercase tracking-wide text-slate-500">{label}</p>
			<div className="grid grid-cols-[2.25rem_1fr_2.25rem] items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
				<button
					type="button"
					disabled={disabled || value === 0}
					onClick={() => onChange(Math.max(0, value - 1))}
					aria-label={`Decrease ${label.toLowerCase()}`}
					className="h-9 text-lg font-medium text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
				>
					−
				</button>
				<span className="text-center text-sm font-bold text-slate-950">{value}</span>
				<button
					type="button"
					disabled={disabled}
					onClick={() => onChange(value + 1)}
					aria-label={`Increase ${label.toLowerCase()}`}
					className="h-9 text-lg font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-30"
				>
					+
				</button>
			</div>
		</div>
	);
}
