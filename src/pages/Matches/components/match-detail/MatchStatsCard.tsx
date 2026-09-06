import { useState } from "react";
import type { MatchPlayerStat, SelectedPlayer } from "../../../../stores/match";
import { updateMotmDraft } from "./matchStatsDraft";

interface MatchStatsCardProps {
	selectedPlayers: SelectedPlayer[];
	playerStats: MatchPlayerStat[];
	getPlayerName: (playerId: string) => string;
	onEditEvents: () => void;
	onSavePlayerStats: (playerStats: MatchPlayerStat[]) => Promise<void>;
}

export function MatchStatsCard({
	selectedPlayers,
	playerStats,
	getPlayerName,
	onEditEvents,
	onSavePlayerStats,
}: MatchStatsCardProps) {
	const [draftStats, setDraftStats] = useState(() => buildDraft(selectedPlayers, playerStats));
	const [source, setSource] = useState({ selectedPlayers, playerStats });
	const [isSaving, setIsSaving] = useState(false);
	const [message, setMessage] = useState("");

	if (source.selectedPlayers !== selectedPlayers || source.playerStats !== playerStats) {
		setSource({ selectedPlayers, playerStats });
		setDraftStats(buildDraft(selectedPlayers, playerStats));
		setMessage("");
	}

	function updateNote(playerId: string, note: string) {
		setMessage("");
		setDraftStats((stats) => stats.map((stat) =>
			stat.playerId === playerId ? { ...stat, note } : stat
		));
	}

	async function saveDetails() {
		setIsSaving(true);
		setMessage("");
		try {
			await onSavePlayerStats(draftStats);
			setMessage("Player details saved.");
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Could not save player details.");
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<section className="rounded-2xl bg-white p-4 shadow sm:p-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Calculated report</p>
					<h2 className="mt-1 text-xl font-bold text-slate-950">Player stats</h2>
					<p className="mt-1 text-sm text-slate-500">Goals, cards, appearances and minutes come from the match timeline.</p>
				</div>
				<button type="button" onClick={onEditEvents} className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800">
					Edit match events
				</button>
			</div>

			<div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
				<Metric label="Appearances" value={draftStats.filter((stat) => stat.appearanceType !== "unusedSubstitute").length} />
				<Metric label="Goals" value={sum(draftStats, "goals")} />
				<Metric label="Assists" value={sum(draftStats, "assists")} />
				<Metric label="Yellow" value={sum(draftStats, "yellowCards")} />
				<Metric label="Red" value={sum(draftStats, "redCards")} />
				<Metric label="Minutes" value={sum(draftStats, "minutes")} />
			</div>

			<div className="mt-5 space-y-2">
				{draftStats.map((stat) => (
					<article key={stat.playerId} className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<h3 className="font-bold text-slate-950">{getPlayerName(stat.playerId)}</h3>
								<p className="mt-1 text-xs font-medium text-slate-500">
									{formatAppearance(stat)} · {stat.minutes} min · {stat.goals}G · {stat.assists}A · {stat.yellowCards}YC · {stat.redCards}RC
								</p>
							</div>
							<button
								type="button"
								disabled={stat.appearanceType === "unusedSubstitute"}
								onClick={() => {
									setMessage("");
									setDraftStats((stats) => updateMotmDraft(stats, stat.playerId, !stat.isMOTM));
								}}
								className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${stat.isMOTM ? "bg-yellow-300 text-blue-950" : "border border-slate-200 bg-white text-slate-600"}`}
							>
								★ MOTM
							</button>
						</div>
						<details className="group mt-3">
							<summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-blue-700 [&::-webkit-details-marker]:hidden">
								<span>{stat.note ? "Player note added" : "Add player note"}</span>
								<span className="text-base transition group-open:rotate-45">+</span>
							</summary>
							<textarea value={stat.note} onChange={(event) => updateNote(stat.playerId, event.target.value)} className="mt-2 min-h-20 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Optional performance note..." />
						</details>
					</article>
				))}
			</div>

			<div className="sticky bottom-20 mt-5 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur sm:flex sm:items-center sm:justify-between lg:bottom-4">
				<p className={`mb-2 text-xs sm:mb-0 ${message.includes("saved") ? "text-emerald-700" : "text-red-700"}`}>{message}</p>
				<button type="button" disabled={isSaving} onClick={() => void saveDetails()} className="w-full rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50 sm:w-auto">
					{isSaving ? "Saving..." : "Save MOTM & notes"}
				</button>
			</div>
		</section>
	);
}

function buildDraft(selectedPlayers: SelectedPlayer[], playerStats: MatchPlayerStat[]) {
	return selectedPlayers.map((player) => playerStats.find((stat) => stat.playerId === player.playerId) ?? {
		playerId: player.playerId,
		appearanceType: player.area === "pitch" ? "started" as const : "unusedSubstitute" as const,
		goals: 0,
		assists: 0,
		yellowCards: 0,
		redCards: 0,
		minutes: player.area === "pitch" ? 90 : 0,
		isMOTM: false,
		note: "",
	});
}

function Metric({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
			<p className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-500">{label}</p>
			<p className="mt-0.5 text-lg font-bold text-blue-950">{value}</p>
		</div>
	);
}

function sum(stats: MatchPlayerStat[], field: "goals" | "assists" | "yellowCards" | "redCards" | "minutes") {
	return stats.reduce((total, stat) => total + stat[field], 0);
}

function formatAppearance(stat: MatchPlayerStat) {
	return stat.appearanceType === "started"
		? "Started"
		: stat.appearanceType === "substituteUsed"
			? "Substitute"
			: "Did not play";
}
