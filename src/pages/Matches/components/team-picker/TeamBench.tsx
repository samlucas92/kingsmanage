import type { MouseEvent, RefObject } from "react";
import type { SelectedPlayer } from "../../../../stores/match";
import StatusBadge from "../../../../components/compositions/StatusBadge";
import { BenchPlayer } from "./PlayerCards";

interface TeamBenchProps {
	benchRef: RefObject<HTMLDivElement | null>;
	isOverBench: boolean;
	hoveredSwapTargetPlayerId: string | null;
	benchPlayers: SelectedPlayer[];
	isLineupLocked: boolean;
	openMenuPlayerId?: string;
	getPlayerName: (playerId: string) => string;
	getPlayerOtherSelectionLabels?: (playerId: string) => string[];
	onOpenPlayerMenu: (
		playerId: string,
		event: MouseEvent<HTMLButtonElement>
	) => void;
	onAddSubstitute?: () => void;
}

export function TeamBench({
	benchRef,
	isOverBench,
	hoveredSwapTargetPlayerId,
	benchPlayers,
	isLineupLocked,
	openMenuPlayerId,
	getPlayerName,
	getPlayerOtherSelectionLabels,
	onOpenPlayerMenu,
	onAddSubstitute,
}: TeamBenchProps) {
	return (
		<div
			ref={benchRef}
			className={`min-w-0 overflow-hidden rounded-2xl border-2 shadow-sm transition ${
				isOverBench
					? "border-yellow-400 bg-yellow-50 shadow-md"
					: "border-slate-200 bg-white"
			}`}
		>
			<div
				className={`flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
					isOverBench
						? "border-yellow-200 bg-yellow-100"
						: "border-slate-100 bg-slate-50"
				}`}
			>
				<div className="flex min-w-0 items-center gap-3">
					<div
						className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
							isOverBench
								? "bg-yellow-400 text-slate-950"
								: "bg-blue-900 text-white"
						}`}
					>
						SUB
					</div>

					<div className="min-w-0">
						<h3 className="text-sm font-bold text-slate-900">
							Matchday Bench
						</h3>

						<p className="text-xs text-slate-500">
							{isLineupLocked
								? "Bench locked with the saved lineup."
								: hoveredSwapTargetPlayerId
									? "Release to swap this bench player with the dragged player."
									: isOverBench
										? "Release to add this player to the bench."
										: "Add substitutes on mobile or drag players here on desktop."}
						</p>
					</div>
				</div>

				<div className="flex shrink-0 flex-wrap items-center gap-2">
					<StatusBadge
						label={`${benchPlayers.length} ${
							benchPlayers.length === 1 ? "sub" : "subs"
						}`}
						tone={benchPlayers.length > 0 ? "warning" : "neutral"}
					/>

					{isLineupLocked && <StatusBadge label="Locked" tone="neutral" />}
				</div>
			</div>

			<div
				className={`min-h-24 p-4 transition ${
					isOverBench ? "bg-yellow-50" : "bg-white"
				}`}
			>
				{onAddSubstitute && !isLineupLocked && (
					<button
						type="button"
						onClick={onAddSubstitute}
						className="mb-3 w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 xl:hidden"
					>
						Add substitute
					</button>
				)}

				{benchPlayers.length > 0 ? (
					<div className="flex flex-wrap gap-2">
						{benchPlayers.map((selectedPlayer, index) => (
							<BenchPlayer
								key={selectedPlayer.playerId}
								playerId={selectedPlayer.playerId}
								name={getPlayerName(selectedPlayer.playerId)}
								number={index + 1}
								disabled={isLineupLocked}
								isMenuOpen={openMenuPlayerId === selectedPlayer.playerId}
								isSwapTarget={
									hoveredSwapTargetPlayerId === selectedPlayer.playerId
								}
								otherSelectionLabels={getPlayerOtherSelectionLabels?.(selectedPlayer.playerId)}
								onOpenMenu={(event) =>
									onOpenPlayerMenu(selectedPlayer.playerId, event)
								}
							/>
						))}
					</div>
				) : (
					<div
						className={`flex min-h-16 items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${
							isOverBench
								? "border-yellow-400 bg-yellow-100 text-yellow-950"
								: "border-slate-200 bg-slate-50 text-slate-500"
						}`}
					>
						<p className="text-sm font-medium">
							{isLineupLocked
								? "No substitutes selected."
								: "No substitutes selected yet."}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
