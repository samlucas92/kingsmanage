import PanelCard from "../../../../components/compositions/PanelCard";
import StatusBadge from "../../../../components/compositions/StatusBadge";
import {
	getClubDefaultFormationKey,
	getClubSportDefinition,
} from "../../../../constants/sports";
import { useAuthStore } from "../../../../stores/auth";
import type { Match } from "../../../../stores/match";
import { usePlayerStore } from "../../../../stores/players";
import type { ClubEvent } from "../../../../types/events";
import type {
	MatchdayStageId,
	MatchdayWorkflow,
} from "../../../../utils/fixtureWorkflow";
import { resolveLineupPosition } from "../../../../utils/lineupPosition";
import type { MatchDetailSectionId } from "./MatchDetailSectionNav";

type MatchOverviewGridProps = {
	match: Match;
	workflow: MatchdayWorkflow;
	linkedEvent?: ClubEvent;
	starterCount: number;
	benchCount: number;
	onSectionSelect: (sectionId: MatchDetailSectionId) => void;
	onAvailabilitySelect: () => void;
	onCommunicationsSelect: () => void;
};

export function MatchOverviewGrid({
	match,
	workflow,
	linkedEvent,
	starterCount,
	benchCount,
	onSectionSelect,
	onAvailabilitySelect,
	onCommunicationsSelect,
}: MatchOverviewGridProps) {
	const activeClub = useAuthStore((state) =>
		state.availableClubs.find((club) => club.isCurrent)
	);
	const players = usePlayerStore((state) => state.players);
	const sportDefinition = getClubSportDefinition(
		activeClub?.sportKey,
		activeClub?.customFormations
	);
	const defaultFormationKey = getClubDefaultFormationKey(
		activeClub?.sportKey,
		activeClub?.customFormations,
		activeClub?.defaultFormationKey
	);
	const formation =
		sportDefinition.formations.find(
			(candidate) => candidate.key === match.selectedFormation
		) ??
		sportDefinition.formations.find(
			(candidate) => candidate.key === defaultFormationKey
		) ??
		sportDefinition.formations[0];
	const availabilityStage = getStage(workflow, "availability");
	const communicationsStage = getStage(workflow, "communications");
	const resultStage = getStage(workflow, "result");
	const noteCount = Object.values(match.notes ?? {}).filter((note) => note.trim()).length;
	const pitchPlayers = match.selectedPlayers.filter((player) => player.area === "pitch");

	return (
		<div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
			<PanelCard className="lg:col-span-2" contentClassName="mt-0">
				<div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_190px] sm:items-center">
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<p className="text-xs font-black uppercase tracking-[0.14em] text-yepset-700">
								Squad & lineup
							</p>
							<StatusBadge
								label={match.isLineupLocked ? "Lineup locked" : "In preparation"}
								tone={match.isLineupLocked ? "success" : "warning"}
							/>
						</div>
						<h2 className="mt-2 text-xl font-black text-slate-950">
							{formation?.name || match.selectedFormation || "Formation not selected"}
						</h2>
						<p className="mt-1 text-sm font-medium text-slate-500">
							{starterCount}/11 starters · {benchCount} on the bench
						</p>

						<div className="mt-4 grid grid-cols-3 gap-2">
							<OverviewMetric label="Starters" value={`${starterCount}/11`} />
							<OverviewMetric label="Bench" value={String(benchCount)} />
							<OverviewMetric
								label="Status"
								value={match.isLineupLocked ? "Ready" : "Draft"}
							/>
						</div>

						<button
							type="button"
							onClick={() => onSectionSelect("squad")}
							className="mt-4 rounded-xl bg-yepset-700 px-4 py-2.5 text-sm font-black text-white hover:bg-yepset-800"
						>
							Open squad & lineup
						</button>
					</div>

					<button
						type="button"
						onClick={() => onSectionSelect("squad")}
						className="relative mx-auto h-52 w-44 overflow-hidden rounded-2xl border-4 border-white bg-[repeating-linear-gradient(90deg,#17663a_0,#17663a_25px,#1a6d3e_25px,#1a6d3e_50px)] shadow-inner ring-1 ring-slate-200"
						aria-label="Open lineup preview"
					>
						<span className="absolute inset-3 rounded-md border border-white/70" />
						<span className="absolute inset-x-3 top-1/2 border-t border-white/70" />
						<span className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70" />
						<span className="absolute bottom-3 left-1/2 h-10 w-20 -translate-x-1/2 border border-b-0 border-white/70" />
						{pitchPlayers.slice(0, 11).map((player, index) => {
							const position = resolveLineupPosition(
								player,
								formation?.slots ?? []
							);
							const playerRecord = players.find(
								(candidate) => candidate.id === player.playerId
							);
							const markerLabel = playerRecord?.number
								? String(playerRecord.number)
								: getInitials(playerRecord?.name, index);
							return (
								<span
									key={player.playerId}
									className="absolute z-10 grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-kick-300 bg-yepset-700 text-[6px] font-black text-white shadow"
									style={{
										left: `${position.x}%`,
										top: `${position.y}%`,
									}}
								>
									{markerLabel}
								</span>
							);
						})}
						{pitchPlayers.length === 0 && (
							<span className="absolute inset-0 grid place-items-center px-6 text-center text-xs font-black text-white">
								Select the starting eleven
							</span>
						)}
					</button>
				</div>
			</PanelCard>

			<OverviewActionCard
				eyebrow="Calendar & availability"
				title={availabilityStage.status}
				detail={availabilityStage.detail}
				status={linkedEvent ? "Event linked" : "Event missing"}
				tone={linkedEvent ? availabilityStage.tone : "warning"}
				actionLabel={linkedEvent ? "Review availability" : "Add to calendar"}
				onClick={onAvailabilitySelect}
			/>

			<OverviewActionCard
				eyebrow="Fixture details"
				title={match.venue === "home" ? "Home fixture" : "Away fixture"}
				detail={[
					match.competition || "Competition not set",
					match.location || "Location not set",
				].join(" · ")}
				status={match.competition && match.location ? "Complete" : "Needs attention"}
				tone={match.competition && match.location ? "success" : "warning"}
				actionLabel="Fixture summary above"
			/>

			<OverviewActionCard
				eyebrow="Communications"
				title={communicationsStage.status}
				detail={communicationsStage.detail}
				status={match.isLineupLocked ? "Ready" : "Waiting for lineup"}
				tone={communicationsStage.tone}
				actionLabel={match.isLineupLocked ? "Generate matchday post" : "Finish lineup"}
				onClick={onCommunicationsSelect}
			/>

			<OverviewActionCard
				eyebrow="Match report"
				title={resultStage.status}
				detail={resultStage.detail}
				status={match.isCompleted ? "Report unlocked" : "Available after result"}
				tone={resultStage.tone}
				actionLabel="Open match stats"
				onClick={() => onSectionSelect("stats")}
			/>

			<OverviewActionCard
				eyebrow="Match notes"
				title={noteCount > 0 ? `${noteCount} sections updated` : "No notes added"}
				detail="Keep availability, tactical, injury and general notes together."
				status={noteCount > 0 ? "In progress" : "Not started"}
				tone={noteCount > 0 ? "info" : "neutral"}
				actionLabel="Open notes"
				onClick={() => onSectionSelect("notes")}
			/>
		</div>
	);
}

function OverviewMetric({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-xl bg-slate-50 px-3 py-2.5">
			<p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
				{label}
			</p>
			<p className="mt-1 text-sm font-black text-slate-900">{value}</p>
		</div>
	);
}

function getInitials(name: string | undefined, fallbackIndex: number) {
	if (!name) {
		return String(fallbackIndex + 1);
	}

	const parts = name.trim().split(/\s+/);
	return parts.length > 1
		? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
		: parts[0].slice(0, 2).toUpperCase();
}

function OverviewActionCard({
	eyebrow,
	title,
	detail,
	status,
	tone,
	actionLabel,
	onClick,
}: {
	eyebrow: string;
	title: string;
	detail: string;
	status: string;
	tone: string;
	actionLabel: string;
	onClick?: () => void;
}) {
	return (
		<PanelCard contentClassName="mt-0">
			<div className="flex h-full min-h-44 flex-col">
				<div className="flex flex-wrap items-start justify-between gap-2">
					<p className="text-xs font-black uppercase tracking-[0.12em] text-yepset-700">
						{eyebrow}
					</p>
					<StatusBadge label={status} tone={tone} />
				</div>
				<h2 className="mt-3 text-lg font-black text-slate-950">{title}</h2>
				<p className="mt-1 text-sm font-medium leading-5 text-slate-500">{detail}</p>
				{onClick ? (
					<button
						type="button"
						onClick={onClick}
						className="mt-auto pt-4 text-left text-sm font-black text-yepset-700 hover:text-yepset-900"
					>
						{actionLabel} →
					</button>
				) : (
					<p className="mt-auto pt-4 text-sm font-bold text-slate-400">{actionLabel}</p>
				)}
			</div>
		</PanelCard>
	);
}

function getStage(workflow: MatchdayWorkflow, stageId: MatchdayStageId) {
	return workflow.stages.find((stage) => stage.id === stageId) ?? {
		id: stageId,
		label: stageId,
		status: "Not started",
		detail: "No status is available yet.",
		tone: "neutral" as const,
	};
}
