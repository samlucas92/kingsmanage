import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
	statsApi,
	type PlayerStatsBreakdown,
} from "../../services/statsApi";

type PlayerStatsBreakdownModalProps = {
	seasonId: string;
	playerId: string;
	onClose: () => void;
};

export default function PlayerStatsBreakdownModal({
	seasonId,
	playerId,
	onClose,
}: PlayerStatsBreakdownModalProps) {
	const [breakdown, setBreakdown] = useState<PlayerStatsBreakdown | null>(null);
	const [error, setError] = useState("");

	useEffect(() => {
		void statsApi.getPlayerStatsBreakdown(seasonId, playerId)
			.then((loadedBreakdown) => {
				setBreakdown(loadedBreakdown);
				setError("");
			})
			.catch((loadError) => setError(loadError instanceof Error
				? loadError.message
				: "Could not load the stats breakdown."));
	}, [playerId, seasonId]);

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6">
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="stats-breakdown-title"
				className="mx-auto my-4 w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl"
			>
				<div className="border-b border-slate-200 p-5 sm:p-6">
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="text-xs font-black uppercase tracking-wide text-blue-700">Stats breakdown</p>
							<h2 id="stats-breakdown-title" className="mt-1 text-2xl font-black text-slate-950">
								{breakdown?.playerName ?? "Loading player…"}
							</h2>
							{breakdown && <p className="mt-1 text-sm text-slate-600">{breakdown.seasonName} competitive matches only</p>}
						</div>
						<button type="button" onClick={onClose} className="btn-secondary px-3" aria-label="Close">✕</button>
					</div>
				</div>

				{error && <p className="m-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-800 sm:m-6">{error}</p>}

				{breakdown && (
					<>
						<div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
							<StatCard label="Historical baseline" apps={breakdown.historicalApps} goals={breakdown.historicalGoals} />
							<StatCard label={breakdown.seasonName} apps={breakdown.seasonApps} goals={breakdown.seasonGoals} accent />
							<StatCard label="Career total" apps={breakdown.careerApps} goals={breakdown.careerGoals} />
							<div className="rounded-2xl bg-slate-950 p-4 text-white">
								<p className="text-xs font-bold uppercase tracking-wide text-slate-300">Calculation</p>
								<p className="mt-2 text-sm font-bold">{breakdown.historicalApps} + {breakdown.seasonApps} = {breakdown.careerApps} apps</p>
								<p className="mt-1 text-sm font-bold">{breakdown.historicalGoals} + {breakdown.seasonGoals} = {breakdown.careerGoals} goals</p>
							</div>
						</div>

						<div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
							<p className="text-sm font-black text-slate-900">Match contributions</p>
							{breakdown.isSeasonRolledOver && (
								<span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
									Frozen snapshot · {formatDate(breakdown.rolledOverAt)}
								</span>
							)}
						</div>

						<div className="max-h-[52vh] overflow-auto">
							<table className="min-w-[920px] w-full text-sm">
								<thead className="sticky top-0 bg-white text-xs uppercase text-slate-500 shadow-sm">
									<tr>
										<th className="px-5 py-3 text-left">Match</th>
										<th className="px-3 py-3 text-left">Competition</th>
										<th className="px-3 py-3 text-center">Role</th>
										<th className="px-3 py-3 text-center">App</th>
										<th className="px-3 py-3 text-center">G</th>
										<th className="px-3 py-3 text-center">A</th>
										<th className="px-3 py-3 text-center">Min</th>
										<th className="px-3 py-3 text-center">Cards</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{breakdown.matches.map((match) => (
										<tr key={match.matchId} className="hover:bg-slate-50">
											<td className="px-5 py-3">
												<Link to={`/matches/${match.matchId}`} className="font-bold text-blue-900 hover:underline">
													{match.venue === "Home" ? "vs" : "at"} {match.opponent}
												</Link>
												<p className="mt-0.5 text-xs text-slate-500">{formatDate(match.date)} · {match.homeGoals}–{match.awayGoals}</p>
											</td>
											<td className="px-3 py-3 text-slate-600">{match.competition}</td>
											<td className="px-3 py-3 text-center">{formatAppearance(match.appearanceType)}</td>
											<td className="px-3 py-3 text-center font-bold">{match.appearances}</td>
											<td className="px-3 py-3 text-center">{match.goals}</td>
											<td className="px-3 py-3 text-center">{match.assists}</td>
											<td className="px-3 py-3 text-center">{match.minutes}</td>
											<td className="px-3 py-3 text-center">
												{match.yellowCards > 0 && <span className="mr-1 inline-block h-4 w-3 rounded-sm bg-yellow-400 align-middle" title={`${match.yellowCards} yellow`} />}
												{match.redCards > 0 && <span className="inline-block h-4 w-3 rounded-sm bg-red-600 align-middle" title={`${match.redCards} red`} />}
												{match.yellowCards === 0 && match.redCards === 0 ? "—" : ""}
											</td>
										</tr>
									))}
									{breakdown.matches.length === 0 && (
										<tr><td colSpan={8} className="px-5 py-10 text-center text-slate-500">No competitive match contributions for this player.</td></tr>
									)}
								</tbody>
							</table>
						</div>

						<div className="flex justify-end border-t border-slate-200 p-5 sm:p-6">
							<button type="button" onClick={onClose} className="btn-primary">Done</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

function StatCard({ label, apps, goals, accent = false }: { label: string; apps: number; goals: number; accent?: boolean }) {
	return (
		<div className={`rounded-2xl p-4 ${accent ? "bg-blue-50" : "bg-slate-50"}`}>
			<p className={`text-xs font-bold uppercase tracking-wide ${accent ? "text-blue-700" : "text-slate-500"}`}>{label}</p>
			<p className="mt-2 text-xl font-black text-slate-950">{apps} <span className="text-sm text-slate-500">apps</span></p>
			<p className="mt-1 text-xl font-black text-slate-950">{goals} <span className="text-sm text-slate-500">goals</span></p>
		</div>
	);
}

function formatDate(value: string | null) {
	if (!value) return "Unknown date";
	return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}

function formatAppearance(value: string) {
	return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}
