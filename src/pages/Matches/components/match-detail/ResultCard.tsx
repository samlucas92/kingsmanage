import type { MatchState } from "../../../../stores/match";
import PanelCard from "../../../../components/compositions/PanelCard";
import StatusBadge from "../../../../components/compositions/StatusBadge";

type MatchResult = {
	homeGoals: number;
	awayGoals: number;
};

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
	const hasResult = Boolean(result);

	return (
		<PanelCard>
			<div className="flex flex-col gap-4">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
							Result
						</p>

						<p className="mt-1 text-sm text-slate-500">
							{hasResult
								? "Match result has been entered."
								: "Enter the match score to complete the result."}
						</p>
					</div>

					<StatusBadge
						label={getResultStatusLabel(state, isCompleted)}
						tone={getResultStatusTone(state, isCompleted)}
					/>
				</div>

				<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
					<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
						<ResultTeam
							name={homeTeamName}
							score={result?.homeGoals}
							align="left"
						/>

						<div className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-400 shadow-sm">
							vs
						</div>

						<ResultTeam
							name={awayTeamName}
							score={result?.awayGoals}
							align="right"
						/>
					</div>

					{hasResult && (
						<div className="mt-3 flex justify-center">
							<ResultOutcome state={state} />
						</div>
					)}
				</div>

				<button
					type="button"
					onClick={onOpenResultModal}
					className={`w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-sm ${
						hasResult
							? "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
							: "bg-blue-700 text-white hover:bg-blue-800"
					}`}
				>
					{hasResult ? "Edit Result" : "Enter Result"}
				</button>

				{!hasResult && (
					<p className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800">
						Player stats stay locked until the result is entered.
					</p>
				)}
			</div>
		</PanelCard>
	);
}

function ResultTeam({
	name,
	score,
	align,
}: {
	name: string;
	score?: number;
	align: "left" | "right";
}) {
	return (
		<div className={align === "right" ? "text-right" : "text-left"}>
			<p className="truncate text-sm font-semibold text-slate-700">{name}</p>

			<p className="mt-1 text-4xl font-black text-blue-900">
				{typeof score === "number" ? score : "-"}
			</p>
		</div>
	);
}

function ResultOutcome({ state }: { state: MatchState }) {
	if (state === "won") {
		return <StatusBadge label="Win" tone="success" />;
	}

	if (state === "lost") {
		return <StatusBadge label="Loss" tone="danger" />;
	}

	if (state === "draw") {
		return <StatusBadge label="Draw" tone="neutral" />;
	}

	return <StatusBadge label={getResultStatusLabel(state, false)} tone="info" />;
}

function getResultStatusLabel(state: MatchState, isCompleted: boolean) {
	if (state === "upcoming") {
		return "Not played";
	}

	if (state === "postponed") {
		return "Postponed";
	}

	if (!isCompleted) {
		return "Pending";
	}

	if (state === "won") {
		return "Completed";
	}

	if (state === "lost") {
		return "Completed";
	}

	if (state === "draw") {
		return "Completed";
	}

	return "Completed";
}

function getResultStatusTone(
	state: MatchState,
	isCompleted: boolean
): "success" | "warning" | "danger" | "info" | "neutral" {
	if (state === "postponed") {
		return "warning";
	}

	if (!isCompleted || state === "upcoming") {
		return "info";
	}

	if (state === "lost") {
		return "danger";
	}

	if (state === "won") {
		return "success";
	}

	return "neutral";
}