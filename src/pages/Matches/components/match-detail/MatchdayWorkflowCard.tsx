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
	const activeStageId = getActiveStageId(workflow.nextAction.id);

	return (
		<PanelCard contentClassName="mt-0">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<h2 className="text-base font-black text-slate-950">Matchday progress</h2>
						<span className="text-sm font-semibold text-slate-400">·</span>
						<span className="text-sm font-bold text-slate-600">
							{workflow.completedStageCount} of {workflow.trackedStageCount} tracked ready
						</span>
					</div>
					<p className="mt-1 text-sm text-slate-500">
						Next: <span className="font-bold text-slate-800">{workflow.nextAction.label}</span>
					</p>
				</div>

				<button
					type="button"
					disabled={isActionBusy}
					onClick={() => onNextAction(workflow.nextAction.id)}
					className="btn-primary w-full shrink-0 sm:w-auto"
				>
					{isActionBusy ? "Working…" : workflow.nextAction.label}
				</button>
			</div>

			<div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6" role="list" aria-label="Matchday workflow">
				{workflow.stages.map((stage, index) => (
					<button
						key={stage.id}
						type="button"
						onClick={() => onStageSelect(stage.id)}
						className={`group relative min-w-0 overflow-hidden rounded-xl border px-3 py-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-yepset-500 focus:ring-offset-2 ${
							stage.id === activeStageId
								? "border-yepset-600 bg-yepset-50 shadow-[inset_0_0_0_1px_var(--color-yepset-600)]"
								: stage.tone === "success"
									? "border-green-200 bg-green-50/60 hover:border-green-300"
									: "border-slate-200 bg-slate-50/80 hover:border-yepset-300 hover:bg-yepset-50"
						}`}
						aria-current={stage.id === activeStageId ? "step" : undefined}
					>
						{stage.id === activeStageId && (
							<span className="absolute inset-x-0 top-0 h-1 bg-kick-500" />
						)}
						<div className="flex items-center gap-2">
							<span className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-black ${
								stage.tone === "success"
									? "bg-green-600 text-white"
									: stage.id === activeStageId
										? "bg-yepset-700 text-white"
										: "bg-slate-200 text-slate-600"
							}`}>
								{stage.tone === "success" ? "✓" : index + 1}
							</span>
							<p className="truncate text-sm font-black text-slate-950 group-hover:text-yepset-900">
								{stage.label}
							</p>
						</div>
						<div className="mt-2 flex min-w-0 items-center gap-2">
							<StatusBadge label={stage.status} tone={stage.tone} className="shrink-0" />
							<span className="truncate text-xs font-medium text-slate-500" title={stage.detail}>
								{stage.detail}
							</span>
						</div>
					</button>
				))}
			</div>

			{actionError && (
				<p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
					{actionError}
				</p>
			)}
		</PanelCard>
	);
}

function getActiveStageId(actionId: MatchdayActionId): MatchdayStageId {
	if (actionId === "link-event") {
		return "fixture";
	}

	if (actionId === "stats") {
		return "result";
	}

	return actionId;
}
