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
		if (selectedSeasonId && seasons.some((season) => season.id === selectedSeasonId)) {
			return;
		}

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
	const selectedPlayer = activePlayers.find((player) => player.id === selectedPlayerId) ?? activePlayers[0];
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
		if (!selectedPlayer?.id) {
			setSelectedPlayerId("");
			return;
		}

		setSelectedPlayerId(selectedPlayer.id);
	}, [selectedPlayer?.id]);

	useEffect(() => {
		if (!selectedEvent?.id) {
			return;
		}

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
		if (!selectedPlayer) {
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
	}, [selectedAssessment, selectedPlayer]);

	async function handleSaveAssessment() {
		if (!selectedEvent || !selectedPlayer || !draft) {
			return;
		}

		setIsSaving(true);
		setTrainingError("");

		try {
			const savedAssessment = await trainingApi.saveAssessment(
				selectedEvent.id,
				selectedPlayer.id,
				toSaveTrainingAssessmentRequest(draft)
			);

			setAssessments((currentAssessments) => {
				const existingIndex = currentAssessments.findIndex((assessment) => assessment.playerId === savedAssessment.playerId);

				if (existingIndex === -1) {
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
				<div className="grid gap-5 xl:grid-cols-[22rem_1fr]">
					<div className="space-y-4">
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

						<Panel title="Players">
							<div className="space-y-2">
								{activePlayers.map((player) => {
									const assessment = assessments.find((item) => item.playerId === player.id);
									const isSelected = player.id === selectedPlayer?.id;

									return (
										<button
											key={player.id}
											type="button"
											onClick={() => setSelectedPlayerId(player.id)}
											className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
												isSelected
													? "border-yepset-600 bg-yepset-50 shadow-sm"
													: "border-slate-200 bg-white hover:border-yepset-200 hover:bg-slate-50"
											}`}
										>
											<div className="flex items-center justify-between gap-3">
												<div className="min-w-0">
													<p className="truncate text-sm font-black text-slate-950">{player.name}</p>
													<p className="text-xs font-semibold text-slate-500">{getTrainingPlayerRole(player)}</p>
												</div>
												<StatusBadge
													label={assessment ? "Assessed" : "Pending"}
													tone={assessment ? "success" : "neutral"}
												/>
											</div>
										</button>
									);
								})}
							</div>
						</Panel>
					</div>

					<Panel
						title={selectedPlayer ? selectedPlayer.name : "Select a player"}
						description={selectedEvent ? `${selectedEvent.title} · ${formatDisplayDate(selectedEvent.startDateTime)}` : undefined}
						action={draft ? (
							<button
								type="button"
								onClick={() => void handleSaveAssessment()}
								disabled={isSaving}
								className="rounded-xl bg-yepset-900 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-yepset-800 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isSaving ? "Saving..." : "Save assessment"}
							</button>
						) : null}
					>
						{isLoadingEvents || isLoadingPlayers || isLoadingAssessments ? (
							<div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800">
								Loading training data...
							</div>
						) : !selectedPlayer || !draft ? (
							<EmptyState title="No player selected" message="Choose a player to begin their training assessment." />
						) : (
							<div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
								<div className="space-y-4">
									<TrainingMetricEditor
										metrics={draft.metrics}
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
									/>
									<label className="block">
										<span className="text-xs font-black uppercase tracking-wide text-slate-500">Coach notes</span>
										<textarea
											value={draft.notes}
											onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
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
			)}
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
	action?: React.ReactNode;
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

	if (ratings.length === 0) {
		return 0;
	}

	return Math.round((ratings.reduce((total, rating) => total + rating, 0) / ratings.length) * 10) / 10;
}
