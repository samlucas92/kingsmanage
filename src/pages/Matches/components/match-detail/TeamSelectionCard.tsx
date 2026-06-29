import PanelCard from "../../../../components/compositions/PanelCard";
import StatusBadge from "../../../../components/compositions/StatusBadge";
import TeamPicker from "../TeamPicker";

interface TeamSelectionCardProps {
	matchId: string;
	starterCount: number;
	benchCount: number;
	totalSelectedCount: number;
	isLineupLocked: boolean;
	onSaveTeamClick: () => void;
	onGeneratePostClick: () => void;
}

export function TeamSelectionCard({
	matchId,
	starterCount,
	benchCount,
	totalSelectedCount,
	isLineupLocked,
	onSaveTeamClick,
	onGeneratePostClick,
}: TeamSelectionCardProps) {
	return (
		<PanelCard>
			<div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="min-w-0">
					<h2 className="text-lg font-bold text-blue-900">Team Selection</h2>

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
						<button type="button" onClick={onGeneratePostClick} className="rounded-xl border border-blue-200 px-5 py-3 text-sm font-bold text-blue-800 hover:bg-blue-50">
							Generate post
						</button>
					)}
					<button
						type="button"
						onClick={onSaveTeamClick}
						disabled={!isLineupLocked && totalSelectedCount === 0}
						className={`w-full rounded-xl px-5 py-3 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${
						isLineupLocked
							? "bg-slate-900 text-white hover:bg-slate-800"
							: "bg-blue-700 text-white hover:bg-blue-800"
						}`}
					>
						{isLineupLocked ? "Edit Team" : "Save Team"}
					</button>
				</div>
			</div>

			{!isLineupLocked && starterCount > 0 && starterCount < 11 && (
				<p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
					You currently have {starterCount} starters selected. You can still
					save, but you’ll be asked to confirm first.
				</p>
			)}

			<div className="mt-6 min-w-0 rounded-xl border border-dashed border-gray-300 bg-green-50 p-3 text-gray-500 sm:p-4">
				<TeamPicker matchId={matchId} />
			</div>
		</PanelCard>
	);
}
