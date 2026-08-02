import PanelCard from "../../../../components/compositions/PanelCard";
import StatusBadge from "../../../../components/compositions/StatusBadge";
import type { ClubEventAvailabilityStatus } from "../../../../types/events";
import type { TrainingAvailabilitySummary } from "../../../../utils/trainingAvailability";
import TeamPicker from "../TeamPicker";

interface TeamSelectionCardProps {
	matchId: string;
	starterCount: number;
	benchCount: number;
	totalSelectedCount: number;
	isLineupLocked: boolean;
	getPlayerAvailabilityStatus: (
		playerId: string
	) => ClubEventAvailabilityStatus | undefined;
	getPlayerTrainingAvailability: (
		playerId: string
	) => TrainingAvailabilitySummary;
	onSaveTeamClick: () => void;
	onGeneratePostClick: () => void;
	onCreateAwardsFormClick: () => void;
	isCreatingAwardsForm?: boolean;
}

export function TeamSelectionCard({
	matchId,
	starterCount,
	benchCount,
	totalSelectedCount,
	isLineupLocked,
	getPlayerAvailabilityStatus,
	getPlayerTrainingAvailability,
	onSaveTeamClick,
	onGeneratePostClick,
	onCreateAwardsFormClick,
	isCreatingAwardsForm = false,
}: TeamSelectionCardProps) {
	return (
		<PanelCard>
			<div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="min-w-0">
					<h2 className="text-lg font-bold text-slate-950">Team Selection</h2>

					<div className="mt-2 flex flex-wrap gap-2">
						<StatusBadge label={`Starters: ${starterCount}/11`} tone="neutral" />
						<StatusBadge label={`Bench: ${benchCount}`} tone="neutral" />
						<StatusBadge label={`Total: ${totalSelectedCount}`} tone="neutral" />

						{isLineupLocked && (
							<StatusBadge label="Lineup locked" tone="info" />
						)}
					</div>
				</div>

				<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
					{isLineupLocked && totalSelectedCount > 0 && (
						<>
							<button type="button" onClick={onCreateAwardsFormClick} disabled={isCreatingAwardsForm} className="rounded-xl border border-yepset-200 px-5 py-3 text-sm font-bold text-yepset-800 hover:bg-yepset-50 disabled:cursor-not-allowed disabled:opacity-60">
								{isCreatingAwardsForm ? "Creating..." : "Create awards form"}
							</button>
							<button type="button" onClick={onGeneratePostClick} className="rounded-xl border border-yepset-200 px-5 py-3 text-sm font-bold text-yepset-800 hover:bg-yepset-50">
								Generate post
							</button>
						</>
					)}
					<button
						type="button"
						onClick={onSaveTeamClick}
						disabled={!isLineupLocked && totalSelectedCount === 0}
						className={`w-full rounded-xl px-5 py-3 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${
						isLineupLocked
							? "bg-slate-900 text-white hover:bg-slate-800"
							: "bg-yepset-700 text-white hover:bg-yepset-800"
						}`}
					>
						{isLineupLocked ? "Edit Team" : "Confirm Squad"}
					</button>
				</div>
			</div>

			{!isLineupLocked && starterCount > 0 && starterCount < 11 && (
				<p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
					You currently have {starterCount} starters selected. You can still
					save, but you’ll be asked to confirm first.
				</p>
			)}

			<div className="mt-4 min-w-0 rounded-xl border border-dashed border-yepset-200 bg-yepset-50 p-2 text-slate-500 sm:mt-6 sm:p-4">
				<TeamPicker
					matchId={matchId}
					getPlayerAvailabilityStatus={getPlayerAvailabilityStatus}
					getPlayerTrainingAvailability={getPlayerTrainingAvailability}
				/>
			</div>
		</PanelCard>
	);
}
