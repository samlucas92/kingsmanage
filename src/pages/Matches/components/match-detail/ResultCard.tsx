import type { MatchState } from "../../../../stores/match";

interface MatchResult {
	homeGoals: number;
	awayGoals: number;
}

interface ResultCardProps {
	homeTeamName: string;
	awayTeamName: string;
	result?: MatchResult;
	state: MatchState;
	isCompleted: boolean;
	onOpenResultModal: () => void;
}

export function ResultCard({
	homeTeamName,
	awayTeamName,
	result,
	state,
	isCompleted,
	onOpenResultModal,
}: ResultCardProps) {
	return (
		<section className="rounded-xl bg-white p-6 shadow">
			<div className="flex items-start justify-between gap-3">
				<div>
					<h2 className="text-lg font-bold text-blue-900">Result</h2>

					<p className="mt-1 text-xs text-slate-500">
						{homeTeamName} vs {awayTeamName}
					</p>
				</div>

				{isCompleted && (
					<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
						Completed
					</span>
				)}
			</div>

			{result ? (
				<div className="mt-4 space-y-3">
					<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
						<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
							<p className="text-sm font-semibold text-slate-800">
								{homeTeamName}
							</p>

							<p className="text-2xl font-bold text-slate-900">
								{result.homeGoals} - {result.awayGoals}
							</p>

							<p className="text-right text-sm font-semibold text-slate-800">
								{awayTeamName}
							</p>
						</div>
					</div>

					<p
						className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
							state === "won"
								? "bg-green-100 text-green-800"
								: state === "lost"
									? "bg-red-100 text-red-800"
									: "bg-slate-100 text-slate-700"
						}`}
					>
						{state.toUpperCase()}
					</p>
				</div>
			) : (
				<button
					type="button"
					onClick={onOpenResultModal}
					className="mt-4 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
				>
					Set Result
				</button>
			)}
		</section>
	);
}