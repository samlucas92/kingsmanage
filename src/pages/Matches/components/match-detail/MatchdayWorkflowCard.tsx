import PanelCard from "../../../../components/compositions/PanelCard";
import StatusBadge from "../../../../components/compositions/StatusBadge";
import type {
	MatchdayActionId,
	MatchdayStageId,
	MatchdayWorkflow,
} from "../../../../utils/fixtureWorkflow";

type MatchdayWorkflowCardProps = {
	workflow: MatchdayWorkflow;
	isActionBusy?: boolean;
	actionError?: string;
	onStageSelect: (stageId: MatchdayStageId) => void;
	onNextAction: (actionId: MatchdayActionId) => void;
};

export function MatchdayWorkflowCard({
	workflow,
	isActionBusy = false,
	actionError = "",
	onStageSelect,
	onNextAction,
}: MatchdayWorkflowCardProps) {
	return (
		<PanelCard
			title="Matchday progress"
			description="One guided flow using the match tools already on this page."
			action={
				<StatusBadge
					label={`${workflow.completedStageCount}/${workflow.trackedStageCount} tracked complete`}
					tone={workflow.completedStageCount === workflow.trackedStageCount ? "success" : "info"}
				/>
			}
		>
			<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
				{workflow.stages.map((stage, index) => (
					<button
						key={stage.id}
						type="button"
						onClick={() => onStageSelect(stage.id)}
						className="group min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-yepset-300 hover:bg-yepset-50 focus:outline-none focus:ring-2 focus:ring-yepset-500 focus:ring-offset-2"
					>
						<div className="flex items-center justify-between gap-2">
							<span className="text-xs font-black text-slate-400">{index + 1}</span>
							<StatusBadge label={stage.status} tone={stage.tone} />
						</div>
						<p className="mt-3 text-sm font-black text-slate-950 group-hover:text-yepset-900">
							{stage.label}
						</p>
						<p className="mt-1 text-xs font-medium leading-5 text-slate-600">
							{stage.detail}
						</p>
					</button>
				))}
			</div>

			<div className="mt-4 flex flex-col gap-3 rounded-xl border border-yepset-100 bg-yepset-50 p-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0">
					<p className="text-xs font-black uppercase tracking-wide text-yepset-700">
						Next action
					</p>
					<p className="mt-1 font-black text-slate-950">{workflow.nextAction.label}</p>
					<p className="mt-1 text-sm text-slate-600">{workflow.nextAction.detail}</p>
				</div>
				<button
					type="button"
					disabled={isActionBusy}
					onClick={() => onNextAction(workflow.nextAction.id)}
					className="w-full shrink-0 rounded-xl bg-yepset-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-yepset-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
				>
					{isActionBusy ? "Working…" : workflow.nextAction.label}
				</button>
			</div>

			{actionError && (
				<p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
					{actionError}
				</p>
			)}
		</PanelCard>
	);
}
