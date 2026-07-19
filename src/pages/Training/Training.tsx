import { useEffect, useMemo, useState, type ReactNode } from "react";
import SeasonSelector from "../../components/compositions/SeasonSelector";
import EmptyState from "../../components/compositions/EmptyState";
import MetricCard from "../../components/compositions/MetricCard";
import StatusBadge from "../../components/compositions/StatusBadge";
import RadarChart from "../../components/charts/RadarChart";
import { useEventStore } from "../../stores/events";
import { usePlayerStore } from "../../stores/players";
import { useSeasonStore } from "../../stores/seasons";
import { trainingApi } from "../../services/trainingApi";
import { formatDisplayDate } from "../../utils/date";
import {
	createDefaultTrainingAssessment,
	getTrainingPlayerRole,
	toSaveTrainingAssessmentRequest,
	updateCategoryRating,
	updateMetricRating,
} from "../../utils/trainingDevelopment";
import type { ClubEvent } from "../../types/events";
import type { TrainingAssessment } from "../../types/training";
import TrainingMetricEditor from "./components/TrainingMetricEditor";

type DraftAssessment = Pick<TrainingAssessment, "playerRole" | "metrics" | "notes">;

export default function Training() {
	const events = useEventStore((state) => state.events);
	const isLoadingEvents = useEventStore((state) => state.isLoadingEvents);
	const eventsLoadError = useEventStore((state) => state.eventsLoadError);
	const loadEvents = useEventStore((state) => state.loadEvents);
	const players = usePlayerStore((state) => state.players);
	const isLoadingPlayers = usePlayerStore((state) => state.isLoadingPlayers);
	const playerLoadError = usePlayerStore((state) => state.playerLoadError);
	const loadPlayers = usePlayerStore((state) => state.loadPlayers);
	const seasons = useSeasonStore((state) => state.seasons);
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const loadSeasons = useSeasonStore((state) => state.loadSeasons);

	const [selectedSeasonId, setSelectedSeasonId] = useState("");
	const [selectedEventId, setSelectedEventId] = useState("");
	const [selectedPlayerId, setSelectedPlayerId] = useState("");
	const [isEditorOpen, setIsEditorOpen] = useState(false);
	const [assessments, setAssessments] = useState<TrainingAssessment[]>([]);
	const [draft, setDraft] = useState<DraftAssessment | null>(null);
	const [isLoadingAssessments, setIsLoadingAssessments] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [trainingError, setTrainingError] = useState("");

	useEffect(() => {
		void loadEvents(true);
		void loadPlayers();
		void loadSeasons();
	}, [loadEvents, loadPlayers, loadSeasons]);

	useEffect(() => {
		if (selectedSeasonId && seasons.some((season) => season.id === selectedSeasonId)) return;

		setSelectedSeasonId(activeSeasonId || seasons[0]?.id || "");
	}, [activeSeasonId, seasons, selectedSeasonId]);

	const selectedSeason = seasons.find((season) => season.id === selectedSeasonId);
	const trainingEvents = useMemo(
		() => getTrainingEventsForSeason(events, selectedSeason?.startDate, selectedSeason?.endDate),
		[events, selectedSeason]
	);
	const selectedEvent = trainingEvents.find((event) => event.id === selectedEventId) ?? trainingEvents[0];
	const activePlayers = useMemo(
		() => [...players].filter((player) => player.isActive).sort((firstPlayer, secondPlayer) => firstPlayer.name.localeCompare(secondPlayer.name)),
		[players]
	);
	const selectedPlayer = activePlayers.find((player) => player.id === selectedPlayerId);
	const selectedAssessment = assessments.find((assessment) => assessment.playerId === selectedPlayer?.id);
	const assessedCount = assessments.length;
	const averageRating = useMemo(() => getAverageAssessmentRating(assessments), [assessments]);

	useEffect(() => {
		if (!selectedEvent?.id) {
			setSelectedEventId("");
			setAssessments([]);
			return;
		}

		setSelectedEventId(selectedEvent.id);
	}, [selectedEvent?.id]);

	useEffect(() => {
		if (!selectedEvent?.id) return;

		let isMounted = true;

		async function loadAssessments() {
			setIsLoadingAssessments(true);
			setTrainingError("");

			try {
				const eventAssessments = await trainingApi.getEventAssessments(selectedEvent!.id);
				if (isMounted) setAssessments(eventAssessments);
			} catch (error) {
				if (isMounted) {
					setTrainingError(error instanceof Error ? error.message : "Failed to load training assessments.");
					setAssessments([]);
				}
			} finally {
				if (isMounted) setIsLoadingAssessments(false);
			}
		}

		void loadAssessments();

		return () => {
			isMounted = false;
		};
	}, [selectedEvent?.id]);

	useEffect(() => {
		if (!selectedPlayer || !isEditorOpen) {
			setDraft(null);
			return;
		}

		let isMounted = true;
		const role = selectedAssessment?.playerRole ?? getTrainingPlayerRole(selectedPlayer);

		async function loadDefinitions() {
			try {
				const metricDefinitions = await trainingApi.getMetricDefinitions(role);
				if (!isMounted) return;

				setDraft(selectedAssessment ?? createDefaultTrainingAssessment(metricDefinitions, role));
			} catch (error) {
				if (isMounted) {
					setTrainingError(error instanceof Error ? error.message : "Failed to load training metrics.");
				}
			}
		}

		void loadDefinitions();

		return () => {
			isMounted = false;
		};
	}, [isEditorOpen, selectedAssessment, selectedPlayer]);

	async function handleSaveAssessment() {
		if (!selectedEvent || !selectedPlayer || !draft) return;

		setIsSaving(true);
		setTrainingError("");

		try {
			const savedAssessment = await trainingApi.saveAssessment(
				selectedEvent.id,
				selectedPlayer.id,
				toSaveTrainingAssessmentRequest(draft)
			);

			setAssessments((currentAssessments) => {
				if (!currentAssessments.some((assessment) => assessment.playerId === savedAssessment.playerId)) {
					return [...currentAssessments, savedAssessment];
				}

				return currentAssessments.map((assessment) =>
					assessment.playerId === savedAssessment.playerId ? savedAssessment : assessment
				);
			});
			setDraft(savedAssessment);
		} catch (error) {
			setTrainingError(error instanceof Error ? error.message : "Failed to save training assessment.");
		} finally {
			setIsSaving(false);
		}
	}

	function openPlayerAssessment(playerId: string) {
		setSelectedPlayerId(playerId);
		setIsEditorOpen(true);
	}

	function closePlayerAssessment() {
		setIsEditorOpen(false);
		setSelectedPlayerId("");
		setDraft(null);
	}

	return (
		<div className="space-y-5">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<p className="text-xs font-black uppercase tracking-[.18em] text-yepset-700">Player development</p>
					<h1 className="text-3xl font-black tracking-[-.03em] text-slate-950">Training</h1>
					<p className="mt-1 max-w-2xl text-sm font-semibold text-slate-500">
						Assess top-level skills and micro-categories from training sessions, then track progress over time.
					</p>
				</div>
				<SeasonSelector
					label="Season"
					selectedSeasonId={selectedSeasonId}
					onSeasonChange={setSelectedSeasonId}
					showActiveLabel
				/>
			</div>

			{(eventsLoadError || playerLoadError || trainingError) && (
				<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
					{eventsLoadError || playerLoadError || trainingError}
				</div>
			)}

			<div className="grid gap-3 sm:grid-cols-3">
				<MetricCard label="Training sessions" value={trainingEvents.length} />
				<MetricCard label="Players assessed" value={`${assessedCount}/${activePlayers.length}`} />
				<MetricCard label="Average rating" value={averageRating ? `${averageRating}/5` : "—"} />
			</div>

			{trainingEvents.length === 0 ? (
				<EmptyState
					title="No training sessions"
					message="Create Training events first, then they will appear here for assessment."
				/>
			) : (
				<>
					<Panel title="Training session">
						<label className="block text-xs font-black uppercase tracking-wide text-slate-500">
							Session
							<select
								value={selectedEvent?.id ?? ""}
								onChange={(event) => setSelectedEventId(event.target.value)}
								className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-sm outline-none focus:border-yepset-600 focus:ring-2 focus:ring-yepset-600/15"
							>
								{trainingEvents.map((trainingEvent) => (
									<option key={trainingEvent.id} value={trainingEvent.id}>
										{trainingEvent.title} · {formatDisplayDate(trainingEvent.startDateTime)}
									</option>
								))}
							</select>
						</label>
					</Panel>

					<Panel
						title="Player overview"
						description="Track who has been assessed for this session and open the full review when needed."
					>
						{isLoadingEvents || isLoadingPlayers || isLoadingAssessments ? (
							<div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800">
								Loading training data...
							</div>
						) : activePlayers.length === 0 ? (
							<EmptyState title="No active players" message="Active players will appear here for training assessments." />
						) : (
							<PlayerOverviewList
								players={activePlayers}
								assessments={assessments}
								onOpenAssessment={openPlayerAssessment}
							/>
						)}
					</Panel>

					{isEditorOpen && (
						<AssessmentModal
							draft={draft}
							isLoading={isLoadingEvents || isLoadingPlayers || isLoadingAssessments}
							isSaving={isSaving}
							selectedEvent={selectedEvent}
							selectedPlayerName={selectedPlayer?.name}
							onClose={closePlayerAssessment}
							onSave={() => void handleSaveAssessment()}
							onMetricRatingChange={(metricKey, rating) =>
								setDraft((currentDraft) => currentDraft
									? { ...currentDraft, metrics: updateMetricRating(currentDraft.metrics, metricKey, rating) }
									: currentDraft)
							}
							onCategoryRatingChange={(metricKey, categoryKey, rating) =>
								setDraft((currentDraft) => currentDraft
									? { ...currentDraft, metrics: updateCategoryRating(currentDraft.metrics, metricKey, categoryKey, rating) }
									: currentDraft)
							}
							onNotesChange={(notes) =>
								setDraft((currentDraft) => currentDraft ? { ...currentDraft, notes } : currentDraft)
							}
						/>
					)}
				</>
			)}
		</div>
	);
}

function PlayerOverviewList({
	players,
	assessments,
	onOpenAssessment,
}: {
	players: Array<{ id: string; name: string; positions: string[] }>;
	assessments: TrainingAssessment[];
	onOpenAssessment: (playerId: string) => void;
}) {
	return (
		<div className="overflow-hidden rounded-2xl border border-slate-200">
			<div className="hidden grid-cols-[1fr_8rem_8rem_7rem] gap-3 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500 sm:grid">
				<span>Player</span>
				<span>Role</span>
				<span>Status</span>
				<span className="text-right">Action</span>
			</div>
			<div className="divide-y divide-slate-100 bg-white">
				{players.map((player) => {
					const assessment = assessments.find((item) => item.playerId === player.id);
					const rating = assessment ? getAssessmentAverage(assessment) : 0;

					return (
						<div
							key={player.id}
							className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_8rem_8rem_7rem] sm:items-center"
						>
							<div className="flex items-center justify-between gap-3">
								<div className="min-w-0">
									<p className="truncate text-sm font-black text-slate-950">{player.name}</p>
									<p className="text-xs font-semibold text-slate-500 sm:hidden">
										{getTrainingPlayerRole(player)} · {assessment ? `${rating}/5 average` : "No assessment yet"}
									</p>
								</div>
								<div className="sm:hidden">
									<StatusBadge
										label={assessment ? "Assessed" : "Pending"}
										tone={assessment ? "success" : "neutral"}
									/>
								</div>
							</div>
							<span className="hidden text-sm font-bold text-slate-600 sm:block">{getTrainingPlayerRole(player)}</span>
							<div className="hidden sm:block">
								<StatusBadge
									label={assessment ? `${rating}/5` : "Pending"}
									tone={assessment ? "success" : "neutral"}
								/>
							</div>
							<button
								type="button"
								onClick={() => onOpenAssessment(player.id)}
								className="rounded-xl border border-yepset-200 px-3 py-2 text-sm font-black text-yepset-800 transition hover:border-yepset-600 hover:bg-yepset-50"
							>
								{assessment ? "See more" : "Assess"}
							</button>
						</div>
					);
				})}
			</div>
		</div>
	);
}

function AssessmentModal({
	draft,
	isLoading,
	isSaving,
	selectedEvent,
	selectedPlayerName,
	onClose,
	onSave,
	onMetricRatingChange,
	onCategoryRatingChange,
	onNotesChange,
}: {
	draft: DraftAssessment | null;
	isLoading: boolean;
	isSaving: boolean;
	selectedEvent?: ClubEvent;
	selectedPlayerName?: string;
	onClose: () => void;
	onSave: () => void;
	onMetricRatingChange: (metricKey: string, rating: number) => void;
	onCategoryRatingChange: (metricKey: string, categoryKey: string, rating: number) => void;
	onNotesChange: (notes: string) => void;
}) {
	return (
		<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 px-3 py-6 backdrop-blur-sm sm:px-6">
			<div className="mx-auto max-w-6xl rounded-3xl bg-white shadow-2xl">
				<div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-200 bg-white/95 p-4 backdrop-blur sm:flex-row sm:items-start sm:justify-between sm:p-5">
					<div>
						<p className="text-xs font-black uppercase tracking-wide text-yepset-700">Training assessment</p>
						<h2 className="text-2xl font-black text-slate-950">{selectedPlayerName ?? "Select a player"}</h2>
						{selectedEvent && (
							<p className="mt-1 text-sm font-semibold text-slate-500">
								{selectedEvent.title} · {formatDisplayDate(selectedEvent.startDateTime)}
							</p>
						)}
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={onClose}
							className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-900 transition hover:bg-slate-50"
						>
							Close
						</button>
						{draft && (
							<button
								type="button"
								onClick={onSave}
								disabled={isSaving}
								className="rounded-xl bg-yepset-900 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-yepset-800 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isSaving ? "Saving..." : "Save assessment"}
							</button>
						)}
					</div>
				</div>

				<div className="p-4 sm:p-5">
					<Panel title={selectedPlayerName ?? "Select a player"}>
						{isLoading ? (
							<div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800">
								Loading training data...
							</div>
						) : !draft ? (
							<EmptyState title="No player selected" message="Choose a player to begin their training assessment." />
						) : (
							<div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
								<div className="space-y-4">
									<TrainingMetricEditor
										metrics={draft.metrics}
										onMetricRatingChange={onMetricRatingChange}
										onCategoryRatingChange={onCategoryRatingChange}
									/>
									<label className="block">
										<span className="text-xs font-black uppercase tracking-wide text-slate-500">Coach notes</span>
										<textarea
											value={draft.notes}
											onChange={(event) => onNotesChange(event.target.value)}
											rows={4}
											className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-yepset-600 focus:ring-2 focus:ring-yepset-600/15"
											placeholder="Add private coaching notes..."
										/>
									</label>
								</div>
								<div className="space-y-4">
									<RadarChart metrics={draft.metrics.map((metric) => ({
										key: metric.key,
										label: metric.label,
										value: metric.rating,
									}))} />
									<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
										Radar reflects this session’s top-level scores. Micro-categories are saved underneath each skill.
									</div>
								</div>
							</div>
						)}
					</Panel>
				</div>
			</div>
		</div>
	);
}

function Panel({
	title,
	description,
	action,
	children,
}: {
	title: string;
	description?: string;
	action?: ReactNode;
	children: ReactNode;
}) {
	return (
		<section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
			<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h2 className="text-lg font-black text-slate-950">{title}</h2>
					{description && <p className="mt-1 text-sm font-semibold text-slate-500">{description}</p>}
				</div>
				{action}
			</div>
			{children}
		</section>
	);
}

function getTrainingEventsForSeason(
	events: ClubEvent[],
	seasonStartDate?: string,
	seasonEndDate?: string
) {
	const startTime = seasonStartDate ? new Date(seasonStartDate).getTime() : Number.NEGATIVE_INFINITY;
	const endTime = seasonEndDate ? new Date(seasonEndDate).getTime() : Number.POSITIVE_INFINITY;

	return events
		.filter((event) => {
			const eventTime = new Date(event.startDateTime).getTime();
			return event.type === "Training" && eventTime >= startTime && eventTime <= endTime;
		})
		.sort((firstEvent, secondEvent) => new Date(secondEvent.startDateTime).getTime() - new Date(firstEvent.startDateTime).getTime());
}

function getAverageAssessmentRating(assessments: TrainingAssessment[]) {
	const ratings = assessments.flatMap((assessment) => assessment.metrics.map((metric) => metric.rating));

	if (ratings.length === 0) return 0;

	return roundRating(ratings.reduce((total, rating) => total + rating, 0) / ratings.length);
}

function getAssessmentAverage(assessment: TrainingAssessment) {
	if (assessment.metrics.length === 0) return 0;

	return roundRating(
		assessment.metrics.reduce((total, metric) => total + metric.rating, 0) / assessment.metrics.length
	);
}

function roundRating(rating: number) {
	return Math.round(rating * 10) / 10;
}
