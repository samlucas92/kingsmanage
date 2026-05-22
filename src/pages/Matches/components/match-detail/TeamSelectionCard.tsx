import TeamPicker from "../TeamPicker";

interface TeamSelectionCardProps {
	matchId: string;
	starterCount: number;
	benchCount: number;
	totalSelectedCount: number;
	isLineupLocked: boolean;
	onSaveTeamClick: () => void;
}

export function TeamSelectionCard({
	matchId,
	starterCount,
	benchCount,
	totalSelectedCount,
	isLineupLocked,
	onSaveTeamClick,
}: TeamSelectionCardProps) {
	return (
		<section className="min-h-[520px] rounded-xl bg-white p-6 shadow xl:col-span-2">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h2 className="text-lg font-bold text-blue-900">
						Team Selection
					</h2>

					<div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
						<span className="rounded-full bg-slate-100 px-3 py-1">
							Starters: {starterCount}/11
						</span>

						<span className="rounded-full bg-slate-100 px-3 py-1">
							Bench: {benchCount}
						</span>

						<span className="rounded-full bg-slate-100 px-3 py-1">
							Total: {totalSelectedCount}
						</span>

						{isLineupLocked && (
							<span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800">
								Lineup locked
							</span>
						)}
					</div>
				</div>

				<button
					type="button"
					onClick={onSaveTeamClick}
					disabled={!isLineupLocked && totalSelectedCount === 0}
					className={`rounded-xl px-5 py-3 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${
						isLineupLocked
							? "bg-slate-900 text-white hover:bg-slate-800"
							: "bg-blue-700 text-white hover:bg-blue-800"
					}`}
				>
					{isLineupLocked ? "Edit Team" : "Save Team"}
				</button>
			</div>

			{!isLineupLocked && starterCount > 0 && starterCount < 11 && (
				<p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
					You currently have {starterCount} starters selected. You can still
					save, but you’ll be asked to confirm first.
				</p>
			)}

			<div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-green-50 p-4 text-gray-500">
				<TeamPicker matchId={matchId} />
			</div>
		</section>
	);
}