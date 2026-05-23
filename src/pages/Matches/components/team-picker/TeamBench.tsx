import type { MouseEvent, RefObject } from "react";
import type { SelectedPlayer } from "../../../../stores/match";
import { BenchPlayer } from "./PlayerCards";

interface TeamBenchProps {
	benchRef: RefObject<HTMLDivElement | null>;
	isOverBench: boolean;
	hoveredSwapTargetPlayerId: string | null;
	benchPlayers: SelectedPlayer[];
	isLineupLocked: boolean;
	openMenuPlayerId?: string;
	getPlayerName: (playerId: string) => string;
	onOpenPlayerMenu: (
		playerId: string,
		event: MouseEvent<HTMLButtonElement>
	) => void;
}

export function TeamBench({
	benchRef,
	isOverBench,
	hoveredSwapTargetPlayerId,
	benchPlayers,
	isLineupLocked,
	openMenuPlayerId,
	getPlayerName,
	onOpenPlayerMenu,
}: TeamBenchProps) {
	return (
		<div
			ref={benchRef}
			className={`overflow-hidden rounded-2xl border-2 shadow-sm transition ${
				isOverBench
					? "border-yellow-400 bg-yellow-50 shadow-md"
					: "border-slate-200 bg-white"
			}`}
		>
			<div
				className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 ${
					isOverBench
						? "border-yellow-200 bg-yellow-100"
						: "border-slate-100 bg-slate-50"
				}`}
			>
				<div className="flex items-center gap-3">
					<div
						className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black ${
							isOverBench
								? "bg-yellow-400 text-slate-950"
								: "bg-blue-900 text-white"
						}`}
					>
						SUB
					</div>

					<div>
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
										: "Drag substitutes here or drop a pitch player onto a bench player to swap."}
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<span
						className={`rounded-full px-3 py-1 text-xs font-bold ${
							benchPlayers.length > 0
								? "bg-yellow-100 text-yellow-900"
								: "bg-slate-100 text-slate-600"
						}`}
					>
						{benchPlayers.length} {benchPlayers.length === 1 ? "sub" : "subs"}
					</span>

					{isLineupLocked && (
						<span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
							Locked
						</span>
					)}
				</div>
			</div>

			<div
				className={`min-h-24 p-4 transition ${
					isOverBench ? "bg-yellow-50" : "bg-white"
				}`}
			>
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
								: "Drop players here to add them as substitutes."}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
