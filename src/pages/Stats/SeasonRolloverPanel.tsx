import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
	statsApi,
	type SeasonRolloverPreview,
} from "../../services/statsApi";

type SeasonRolloverPanelProps = {
	seasonId: string;
	canManage: boolean;
	onCompleted: () => Promise<void> | void;
};

export default function SeasonRolloverPanel({
	seasonId,
	canManage,
	onCompleted,
}: SeasonRolloverPanelProps) {
	const [preview, setPreview] = useState<SeasonRolloverPreview | null>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isConfirmed, setIsConfirmed] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!seasonId) return;

		void statsApi.getSeasonRolloverPreview(seasonId)
			.then((loadedPreview) => {
				setPreview(loadedPreview);
				setError("");
			})
			.catch((loadError) => {
				setError(loadError instanceof Error
					? loadError.message
					: "Could not load the season rollover status.");
			});
	}, [seasonId]);

	async function handleRollover() {
		if (!preview?.canRollOver || !isConfirmed) return;

		setIsSubmitting(true);
		setError("");
		try {
			const completed = await statsApi.rollOverSeason(seasonId);
			setPreview(completed);
			setIsOpen(false);
			setIsConfirmed(false);
			await onCompleted();
		} catch (rolloverError) {
			setError(rolloverError instanceof Error
				? rolloverError.message
				: "Could not close the season.");
		} finally {
			setIsSubmitting(false);
		}
	}

	if (!seasonId || (preview?.seasonId !== seasonId && !error)) {
		return (
			<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<p className="text-sm font-semibold text-slate-500">Checking season status…</p>
			</section>
		);
	}

	if (!preview || preview.seasonId !== seasonId) {
		return error ? (
			<section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-800">
				{error}
			</section>
		) : null;
	}

	const status = preview.isAlreadyRolledOver
		? "Closed"
		: preview.canRollOver
			? "Ready to close"
			: preview.isSeasonActive
				? "Current season"
				: "Needs attention";
	const statusClassName = preview.isAlreadyRolledOver
		? "bg-emerald-100 text-emerald-800"
		: preview.canRollOver
			? "bg-blue-100 text-blue-800"
			: "bg-amber-100 text-amber-800";

	return (
		<>
			<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<p className="text-xs font-black uppercase tracking-wide text-slate-500">
								Season rollover
							</p>
							<span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClassName}`}>
								{status}
							</span>
						</div>
						<h2 className="mt-1 text-lg font-black text-slate-950">
							{preview.isAlreadyRolledOver
								? `${preview.seasonName} totals are preserved`
								: `Close ${preview.seasonName} when it is finished`}
						</h2>
						<p className="mt-1 max-w-3xl text-sm text-slate-600">
							{preview.isAlreadyRolledOver
								? `The frozen snapshot was added to historical totals on ${formatDateTime(preview.rolledOverAt)}.`
								: "Review the competitive totals, then add them to each player’s historical baseline exactly once."}
						</p>
					</div>

					<div className="flex shrink-0 flex-wrap items-center gap-2">
						<span className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
							{preview.completedCompetitiveMatches} matches
						</span>
						<span className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
							{preview.affectedPlayers} players
						</span>
						{canManage && (
							<button
								type="button"
								onClick={() => setIsOpen(true)}
								className="btn-primary"
							>
								{preview.isAlreadyRolledOver ? "View snapshot" : "Review rollover"}
							</button>
						)}
					</div>
				</div>
			</section>

			{isOpen && (
				<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6">
					<div
						role="dialog"
						aria-modal="true"
						aria-labelledby="season-rollover-title"
						className="mx-auto my-4 w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl"
					>
						<div className="border-b border-slate-200 p-5 sm:p-6">
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="text-xs font-black uppercase tracking-wide text-blue-700">Season rollover</p>
									<h2 id="season-rollover-title" className="mt-1 text-2xl font-black text-slate-950">
										{preview.seasonName}
									</h2>
									<p className="mt-1 text-sm text-slate-600">
										Historical + season = new career baseline
									</p>
								</div>
								<button type="button" onClick={() => setIsOpen(false)} className="btn-secondary px-3" aria-label="Close">
									✕
								</button>
							</div>

							<div className="mt-5 grid gap-3 sm:grid-cols-3">
								<Summary label="Competitive matches" value={preview.completedCompetitiveMatches} />
								<Summary label="Appearances to add" value={preview.appearancesToAdd} />
								<Summary label="Goals to add" value={preview.goalsToAdd} />
							</div>
						</div>

						{preview.blockingReasons.length > 0 && (
							<div className="border-b border-amber-200 bg-amber-50 px-5 py-4 sm:px-6">
								<p className="text-sm font-black text-amber-900">Before this season can be closed:</p>
								<ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
									{preview.blockingReasons.map((reason) => <li key={reason}>{reason}</li>)}
								</ul>
								{preview.isSeasonActive && (
									<Link to="/seasons" className="mt-3 inline-flex text-sm font-black text-amber-900 underline">
										Create or activate the next season
									</Link>
								)}
							</div>
						)}

						<div className="max-h-[52vh] overflow-auto">
							<table className="min-w-full text-sm">
								<thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
									<tr>
										<th className="px-5 py-3 text-left">Player</th>
										<th className="px-3 py-3 text-center">Historical</th>
										<th className="px-3 py-3 text-center">{preview.seasonName}</th>
										<th className="px-5 py-3 text-center">New career</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{preview.players.map((player) => (
										<tr key={player.playerId}>
											<td className="px-5 py-3 font-bold text-slate-900">{player.playerName}</td>
											<td className="px-3 py-3 text-center text-slate-600">{player.historicalAppsBefore} apps · {player.historicalGoalsBefore} goals</td>
											<td className="px-3 py-3 text-center font-bold text-blue-800">+{player.seasonApps} apps · +{player.seasonGoals} goals</td>
											<td className="px-5 py-3 text-center font-black text-slate-950">{player.careerAppsAfter} apps · {player.careerGoalsAfter} goals</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div className="border-t border-slate-200 p-5 sm:p-6">
							{!preview.isAlreadyRolledOver && preview.canRollOver && (
								<label className="mb-4 flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-sm font-semibold text-blue-950">
									<input type="checkbox" checked={isConfirmed} onChange={(event) => setIsConfirmed(event.target.checked)} className="mt-0.5" />
									<span>I have reviewed these totals. Close the season and make this its permanent snapshot.</span>
								</label>
							)}

							{error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}

							<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
								<button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">
									{preview.isAlreadyRolledOver ? "Close" : "Cancel"}
								</button>
								{!preview.isAlreadyRolledOver && (
									<button
										type="button"
										disabled={!preview.canRollOver || !isConfirmed || isSubmitting}
										onClick={() => void handleRollover()}
										className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
									>
										{isSubmitting ? "Closing season…" : "Close season"}
									</button>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

function Summary({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-2xl bg-slate-50 p-4">
			<p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
			<p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
		</div>
	);
}

function formatDateTime(value: string | null) {
	if (!value) return "an earlier date";
	return new Intl.DateTimeFormat("en-GB", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}
