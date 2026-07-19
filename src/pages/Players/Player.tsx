import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import LinkButton from "../../components/compositions/LinkButton";
import NotFoundCard from "../../components/compositions/NotFoundCard";
import EmptyState from "../../components/compositions/EmptyState";
import SeasonSelector from "../../components/compositions/SeasonSelector";
import MetricCard from "../../components/compositions/MetricCard";
import StatusBadge from "../../components/compositions/StatusBadge";
import RadarChart from "../../components/charts/RadarChart";
import { useAuthStore } from "../../stores/auth";
import { usePlayerStore } from "../../stores/players";
import { useSeasonStore } from "../../stores/seasons";
import { useStatsStore } from "../../stores/stats";
import { useFinanceStore } from "../../stores/finance";
import { useEventStore } from "../../stores/events";
import { matchApi } from "../../services/matchApi";
import { trainingApi } from "../../services/trainingApi";
import { PlayerFormModal } from "./components/PlayerFormModal";
import { usePlayerForm } from "./hooks/usePlayerForm";
import { formatDisplayDate } from "../../utils/date";
import type { ClubEvent, ClubEventAvailabilityStatus } from "../../types/events";
import type { FinanceTransaction } from "../../types/finance";
import type { PlayerTrainingDevelopment } from "../../types/training";
import {
	getCompletedTrainingEvents,
	getTrainingAvailabilitySummary,
} from "../../utils/trainingAvailability";

type PlayerMatchRecord = Awaited<ReturnType<typeof matchApi.getPlayerMatches>>[number];

type FinanceStatus = {
	label: string;
	tone: "success" | "warning" | "danger" | "neutral";
};

type TrainingReport = {
	total: number;
	available: number;
	declined: number;
	unanswered: number;
	availabilityRate: number;
	recent: Array<{
		id: string;
		title: string;
		startDateTime: string;
		status: ClubEventAvailabilityStatus;
	}>;
};

function formatCurrency(amount: number) {
	return new Intl.NumberFormat("en-GB", {
		style: "currency",
		currency: "GBP",
	}).format(amount);
}

function formatTransactionDate(date: string) {
	if (!date) {
		return "Unknown date";
	}

	return formatDisplayDate(date);
}

function getTransactionAmountClass(transaction: FinanceTransaction) {
	if (transaction.type === "Payment") {
		return "text-green-700";
	}

	if (transaction.type === "Adjustment" && transaction.amount < 0) {
		return "text-amber-700";
	}

	if (transaction.type === "Adjustment") {
		return "text-blue-700";
	}

	return "text-slate-900";
}

function getFinanceStatus(
	amountOwed: number,
	totalPaid: number,
	balance: number
): FinanceStatus {
	if (amountOwed === 0 && totalPaid === 0 && balance === 0) {
		return {
			label: "No charge",
			tone: "neutral",
		};
	}

	if (balance <= 0) {
		return {
			label: "Paid",
			tone: "success",
		};
	}

	if (totalPaid > 0) {
		return {
			label: "Part paid",
			tone: "warning",
		};
	}

	return {
		label: "Outstanding",
		tone: "danger",
	};
}

function getTrainingAvailabilityReport({
	playerId,
	seasonStartDate,
	seasonEndDate,
	events,
}: {
	playerId?: string;
	seasonStartDate?: string;
	seasonEndDate?: string;
	events: ClubEvent[];
}): TrainingReport {
	if (!playerId || !seasonStartDate || !seasonEndDate) {
		return emptyTrainingReport();
	}

	const trainingEvents = getCompletedTrainingEvents({
		events,
		seasonStartDate,
		seasonEndDate,
	})
		.sort(
			(firstEvent, secondEvent) =>
				new Date(secondEvent.startDateTime).getTime() -
				new Date(firstEvent.startDateTime).getTime()
		);

	const recent = trainingEvents.map((event) => ({
		id: event.id,
		title: event.title,
		startDateTime: event.startDateTime,
		status:
			event.availabilityResponses.find(
				(response) => response.playerId === playerId
			)?.status ?? "Unanswered",
	}));
	const summary = getTrainingAvailabilitySummary({
		playerId,
		seasonStartDate,
		seasonEndDate,
		events,
	});

	return {
		total: summary.total,
		available: summary.available,
		declined: summary.declined,
		unanswered: summary.unanswered,
		availabilityRate: summary.percentage,
		recent: recent.slice(0, 8),
	};
}

function emptyTrainingReport(): TrainingReport {
	return {
		total: 0,
		available: 0,
		declined: 0,
		unanswered: 0,
		availabilityRate: 0,
		recent: [],
	};
}

export default function PlayerProfile() {
	const { id } = useParams();

	const [recentAppearances, setRecentAppearances] = useState<PlayerMatchRecord[]>([]);
	const [isLoadingRecentAppearances, setIsLoadingRecentAppearances] = useState(false);
	const [recentAppearancesError, setRecentAppearancesError] = useState("");
	const [selectedSeasonId, setSelectedSeasonId] = useState("");
	const [trainingDevelopment, setTrainingDevelopment] = useState<PlayerTrainingDevelopment | null>(null);
	const [isLoadingTrainingDevelopment, setIsLoadingTrainingDevelopment] = useState(false);
	const [trainingDevelopmentError, setTrainingDevelopmentError] = useState("");

	const currentUser = useAuthStore((state) => state.currentUser);
	const players = usePlayerStore((state) => state.players);
	const isLoadingPlayers = usePlayerStore((state) => state.isLoadingPlayers);
	const playerLoadError = usePlayerStore((state) => state.playerLoadError);
	const loadPlayer = usePlayerStore((state) => state.loadPlayer);
	const addPlayer = usePlayerStore((state) => state.addPlayer);
	const updatePlayer = usePlayerStore((state) => state.updatePlayer);
	const togglePlayerActive = usePlayerStore(
		(state) => state.togglePlayerActive
	);

	const seasons = useSeasonStore((state) => state.seasons);
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const isLoadingSeasons = useSeasonStore((state) => state.isLoadingSeasons);
	const seasonLoadError = useSeasonStore((state) => state.seasonLoadError);
	const loadSeasons = useSeasonStore((state) => state.loadSeasons);

	const seasonStats = useStatsStore((state) => state.seasonStats);
	const isLoadingStats = useStatsStore((state) => state.isLoadingStats);
	const statsLoadError = useStatsStore((state) => state.statsLoadError);
	const loadSeasonStats = useStatsStore((state) => state.loadSeasonStats);

	const playerFinanceRecords = useFinanceStore(
		(state) => state.playerFinanceRecords
	);
	const isLoadingFinance = useFinanceStore((state) => state.isLoadingFinance);
	const financeLoadError = useFinanceStore((state) => state.financeLoadError);
	const loadFinance = useFinanceStore((state) => state.loadFinance);
	const events = useEventStore((state) => state.events);
	const loadEvents = useEventStore((state) => state.loadEvents);
	const eventsLoadError = useEventStore((state) => state.eventsLoadError);

	const player = players.find((player) => player.id === id);
	const selectedSeason = seasons.find((season) => season.id === selectedSeasonId);
	const playerStats = seasonStats.find((stats) => stats.playerId === id);
	const playerFinanceRecord = playerFinanceRecords.find(
		(record) => record.playerId === id
	);
	const canViewTrainingDevelopment = currentUser?.role !== "Player";

	useEffect(() => {
		if (!id) {
			return;
		}

		void loadPlayer(id);
	}, [id, loadPlayer]);

	useEffect(() => {
		void loadSeasons();
		void loadEvents(true);
	}, [loadSeasons, loadEvents]);

	useEffect(() => {
		if (selectedSeasonId && seasons.some((season) => season.id === selectedSeasonId)) {
			return;
		}

		setSelectedSeasonId(activeSeasonId || seasons[0]?.id || "");
	}, [activeSeasonId, seasons, selectedSeasonId]);

	useEffect(() => {
		if (!selectedSeasonId) {
			return;
		}

		void loadSeasonStats(selectedSeasonId, true);
		void loadFinance(selectedSeasonId);
	}, [selectedSeasonId, loadSeasonStats, loadFinance]);

	useEffect(() => {
		if (!id || !selectedSeasonId) {
			setRecentAppearances([]);
			return;
		}

		let isMounted = true;

		async function loadRecentAppearances() {
			setIsLoadingRecentAppearances(true);
			setRecentAppearancesError("");

			try {
				const matches = id
					? await matchApi.getPlayerMatches(id, selectedSeasonId)
					: [];

				if (!isMounted) {
					return;
				}

				setRecentAppearances(
					[...matches]
						.sort(
							(firstMatch, secondMatch) =>
								new Date(secondMatch.date).getTime() -
								new Date(firstMatch.date).getTime()
						)
						.slice(0, 10)
				);
			} catch (error) {
				if (!isMounted) {
					return;
				}

				setRecentAppearances([]);
				setRecentAppearancesError(
					error instanceof Error
						? error.message
						: "Failed to load recent appearances."
				);
			} finally {
				if (isMounted) {
					setIsLoadingRecentAppearances(false);
				}
			}
		}

		void loadRecentAppearances();

		return () => {
			isMounted = false;
		};
	}, [id, selectedSeasonId]);

	useEffect(() => {
		if (!id || !selectedSeason || !canViewTrainingDevelopment) {
			setTrainingDevelopment(null);
			return;
		}

		let isMounted = true;

		async function loadTrainingDevelopment() {
			setIsLoadingTrainingDevelopment(true);
			setTrainingDevelopmentError("");

			try {
				const development = await trainingApi.getPlayerDevelopment({
					playerId: id!,
					from: selectedSeason!.startDate,
					to: selectedSeason!.endDate,
				});

				if (isMounted) {
					setTrainingDevelopment(development);
				}
			} catch (error) {
				if (isMounted) {
					setTrainingDevelopment(null);
					setTrainingDevelopmentError(
						error instanceof Error
							? error.message
							: "Failed to load player development."
					);
				}
			} finally {
				if (isMounted) {
					setIsLoadingTrainingDevelopment(false);
				}
			}
		}

		void loadTrainingDevelopment();

		return () => {
			isMounted = false;
		};
	}, [canViewTrainingDevelopment, id, selectedSeason]);

	const playerForm = usePlayerForm({
		players,
		onCreatePlayer: async (player) => {
			await addPlayer(player);
		},
		onUpdatePlayer: async (playerId, player) => {
			await updatePlayer(playerId, player);
		},
	});

	const careerApps = useMemo(() => {
		return playerStats?.careerApps ?? player?.appearances ?? 0;
	}, [player, playerStats]);

	const seasonApps = useMemo(() => {
		return playerStats?.seasonApps ?? recentAppearances.length;
	}, [playerStats, recentAppearances]);

	const seasonGoals = useMemo(() => {
		return playerStats?.seasonGoals ?? 0;
	}, [playerStats]);

	const financeAmountOwed = playerFinanceRecord?.amountOwed ?? 0;
	const financeTotalPaid = playerFinanceRecord?.totalPaid ?? 0;
	const financeTotalAdjustments = playerFinanceRecord?.totalAdjustments ?? 0;
	const financeBalance = playerFinanceRecord?.balance ?? financeAmountOwed - financeTotalPaid;
	const financeTransactions = useMemo(() => {
		return [...(playerFinanceRecord?.transactions ?? [])].sort(
			(firstTransaction, secondTransaction) =>
				new Date(secondTransaction.transactionDate).getTime() -
				new Date(firstTransaction.transactionDate).getTime()
		);
	}, [playerFinanceRecord]);
	const financeStatus = getFinanceStatus(
		financeAmountOwed,
		financeTotalPaid,
		financeBalance
	);
	const trainingReport = useMemo(() => {
		return getTrainingAvailabilityReport({
			playerId: id,
			seasonStartDate: selectedSeason?.startDate,
			seasonEndDate: selectedSeason?.endDate,
			events,
		});
	}, [id, selectedSeason, events]);

	if (!id) {
		return (
			<NotFoundCard
				title="Player not found"
				message="That player could not be found."
				action={<LinkButton to="/players">View players</LinkButton>}
			/>
		);
	}

	if (isLoadingPlayers && !player) {
		return (
			<div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
				Loading player...
			</div>
		);
	}

	if (!player) {
		return (
			<NotFoundCard
				title="Player not found"
				message="That player could not be found."
				action={<LinkButton to="/players">View players</LinkButton>}
			/>
		);
	}

	return (
		<div className="space-y-3 lg:space-y-6">
			<LinkButton to="/players" className="hidden lg:inline-flex">← Back to players</LinkButton>

			{playerLoadError && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
					{playerLoadError}
				</div>
			)}

			{seasonLoadError && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
					{seasonLoadError}
				</div>
			)}

			{statsLoadError && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
					{statsLoadError}
				</div>
			)}

			{financeLoadError && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
					{financeLoadError}
				</div>
			)}

			{eventsLoadError && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
					{eventsLoadError}
				</div>
			)}

			{recentAppearancesError && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
					{recentAppearancesError}
				</div>
			)}

			{trainingDevelopmentError && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
					{trainingDevelopmentError}
				</div>
			)}

			{(isLoadingSeasons ||
				isLoadingStats ||
				isLoadingFinance ||
				isLoadingRecentAppearances ||
				isLoadingTrainingDevelopment) && (
				<div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
					Loading season data...
				</div>
			)}

			<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="flex min-w-0 items-center gap-3">
						<div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-yepset-100 text-lg font-black text-yepset-900">
							{player.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}
						</div>
						<div className="min-w-0">
						<p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
							Player Profile
						</p>
						<h1 className="truncate text-xl font-black text-slate-950 sm:text-2xl">
							{player.name}
						</h1>
						<div className="mt-3 flex flex-wrap items-center gap-2">
							<StatusBadge
								label={player.isActive ? "Active" : "Inactive"}
								tone={player.isActive ? "success" : "neutral"}
							/>
							<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
								#{player.number}
							</span>
							{player.positions.map((position) => (
								<span
									key={position}
									className="rounded-full bg-yepset-50 px-3 py-1 text-xs font-semibold text-yepset-800"
								>
									{position}
								</span>
							))}
						</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
						<button
							type="button"
							onClick={() => playerForm.openEditPlayerModal(player)}
							className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold hover:bg-slate-50"
						>
							Edit
						</button>
						<button
							type="button"
							onClick={() => void togglePlayerActive(player.id)}
							className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold hover:bg-slate-50"
						>
							{player.isActive ? "Deactivate" : "Activate"}
						</button>
					</div>
				</div>
			</div>

			<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
							Season view
						</p>
						<h2 className="text-lg font-bold text-slate-900">
							{selectedSeason?.name ?? "No season selected"}
						</h2>
					</div>
					<SeasonSelector
						label="Season filter"
						selectedSeasonId={selectedSeasonId}
						onSeasonChange={setSelectedSeasonId}
					/>
				</div>
			</div>

			<div className="grid grid-cols-3 gap-2 sm:gap-4">
				<MetricCard label="Career Apps" value={careerApps} />
				<MetricCard label="Season Apps" value={seasonApps} />
				<MetricCard label="Season Goals" value={seasonGoals} />
			</div>

			{canViewTrainingDevelopment && (
				<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<h2 className="text-lg font-bold text-slate-900">
								Player Development
							</h2>
							<p className="mt-1 text-sm text-slate-500">
								Private coaching view based on saved Training assessments. Players cannot see this section.
							</p>
						</div>
						<StatusBadge
							label={`${trainingDevelopment?.assessmentCount ?? 0} assessments`}
							tone={(trainingDevelopment?.assessmentCount ?? 0) > 0 ? "success" : "neutral"}
						/>
					</div>

					{!trainingDevelopment || trainingDevelopment.assessmentCount === 0 ? (
						<div className="mt-4">
							<EmptyState
								title="No development assessments yet"
								message="Use the Training area to assess this player against top-level metrics and micro-categories."
							/>
						</div>
					) : (
						<div className="mt-4 grid gap-5 xl:grid-cols-[22rem_1fr]">
							<RadarChart
								metrics={trainingDevelopment.averages.map((metric) => ({
									key: metric.key,
									label: metric.label,
									value: metric.rating,
								}))}
							/>
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
									{trainingDevelopment.averages.slice(0, 4).map((metric) => (
										<MetricCard
											key={metric.key}
											label={metric.label}
											value={`${metric.rating}/5`}
											size="compact"
										/>
									))}
								</div>
								<div className="overflow-hidden rounded-2xl border border-slate-200">
									<div className="bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
										Latest assessment micro-categories
									</div>
									<div className="divide-y divide-slate-100">
										{trainingDevelopment.latestAssessment?.metrics.map((metric) => (
											<div key={metric.key} className="p-4">
												<div className="flex items-center justify-between gap-3">
													<p className="font-black text-slate-950">{metric.label}</p>
													<span className="rounded-full bg-yepset-100 px-2 py-1 text-xs font-black text-yepset-900">
														{metric.rating}/5
													</span>
												</div>
												<div className="mt-2 grid gap-2 sm:grid-cols-2">
													{metric.categories.map((category) => (
														<div
															key={category.key}
															className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm"
														>
															<span className="font-semibold text-slate-600">{category.label}</span>
															<span className="font-black text-slate-950">{category.rating}/5</span>
														</div>
													))}
												</div>
											</div>
										))}
									</div>
								</div>
								{trainingDevelopment.latestAssessment?.notes && (
									<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
										<p className="text-xs font-black uppercase tracking-wide text-slate-500">Latest coach notes</p>
										<p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-slate-700">
											{trainingDevelopment.latestAssessment.notes}
										</p>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			)}

			<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<h2 className="text-lg font-bold text-slate-900">
							Training Availability Report
						</h2>
						<p className="mt-1 text-sm text-slate-500">
							Based on Training event responses in the selected season. This is
							availability, not confirmed attendance.
						</p>
					</div>
					<StatusBadge
						label={`${trainingReport.availabilityRate}% available`}
						tone={trainingReport.availabilityRate >= 75 ? "success" : trainingReport.availabilityRate >= 50 ? "warning" : "danger"}
					/>
				</div>

				<div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
					<MetricCard label="Training events" value={trainingReport.total} size="compact" />
					<MetricCard label="Available" value={trainingReport.available} tone="success" size="compact" />
					<MetricCard label="Declined" value={trainingReport.declined} tone={trainingReport.declined > 0 ? "warning" : "default"} size="compact" />
					<MetricCard label="No response" value={trainingReport.unanswered} tone={trainingReport.unanswered > 0 ? "danger" : "default"} size="compact" />
				</div>

				{trainingReport.recent.length === 0 ? (
					<div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
						No training events found for this player in the selected season.
					</div>
				) : (
					<div className="mt-4 divide-y divide-slate-100">
						{trainingReport.recent.map((event) => (
							<div key={event.id} className="flex items-center justify-between gap-4 py-3 text-sm">
								<div>
									<p className="font-semibold text-slate-900">{event.title}</p>
									<p className="text-slate-500">{formatDisplayDate(event.startDateTime)}</p>
								</div>
								<StatusBadge
									label={event.status === "Available" ? "Available" : event.status === "Declined" ? "Declined" : "No response"}
									tone={event.status === "Available" ? "success" : event.status === "Declined" ? "warning" : "danger"}
								/>
							</div>
						))}
					</div>
				)}
			</div>

			<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<h2 className="text-lg font-bold text-slate-900">
							Season Finance
						</h2>
						<p className="mt-1 text-sm text-slate-500">
							Shows the selected season balance and transaction audit for this player.
						</p>
					</div>
					<StatusBadge label={financeStatus.label} tone={financeStatus.tone} />
				</div>

				<div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
					<MetricCard
						label="Charged"
						value={formatCurrency(financeAmountOwed)}
						size="compact"
					/>
					<MetricCard
						label="Paid"
						value={formatCurrency(financeTotalPaid)}
						tone={financeTotalPaid > 0 ? "success" : "default"}
						size="compact"
					/>
					<MetricCard
						label="Adjustments"
						value={formatCurrency(financeTotalAdjustments)}
						tone={financeTotalAdjustments < 0 ? "warning" : "default"}
						size="compact"
					/>
					<MetricCard
						label="Outstanding"
						value={formatCurrency(financeBalance)}
						tone={financeBalance > 0 ? "danger" : "success"}
						size="compact"
					/>
				</div>

				<div className="mt-5">
					<h3 className="text-sm font-semibold text-slate-900">
						Finance History
					</h3>

					{financeTransactions.length === 0 ? (
						<div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
							No finance transactions have been recorded for this player in the selected season.
						</div>
					) : (
						<div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
							<div className="hidden bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid sm:grid-cols-[1fr_1fr_1fr_2fr] sm:gap-4">
								<span>Date</span>
								<span>Type</span>
								<span className="text-right">Amount</span>
								<span>Note</span>
							</div>
							<div className="divide-y divide-slate-100">
								{financeTransactions.map((transaction) => (
									<div
										key={transaction.id}
										className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_1fr_1fr_2fr] sm:gap-4"
									>
										<div>
											<span className="text-xs font-semibold uppercase tracking-wide text-slate-400 sm:hidden">
												Date
											</span>
											<p className="text-slate-700">
												{formatTransactionDate(transaction.transactionDate)}
											</p>
										</div>
										<div>
											<span className="text-xs font-semibold uppercase tracking-wide text-slate-400 sm:hidden">
												Type
											</span>
											<p className="font-medium text-slate-900">
												{transaction.type}
											</p>
										</div>
										<div className="sm:text-right">
											<span className="text-xs font-semibold uppercase tracking-wide text-slate-400 sm:hidden">
												Amount
											</span>
											<p className={`font-semibold ${getTransactionAmountClass(transaction)}`}>
												{formatCurrency(transaction.amount)}
											</p>
										</div>
										<div>
											<span className="text-xs font-semibold uppercase tracking-wide text-slate-400 sm:hidden">
												Note
											</span>
											<p className="text-slate-600">
												{transaction.note?.trim() || "—"}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>

			<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
				<h2 className="text-lg font-bold text-slate-900">
					Recent Season Appearances
				</h2>
				<p className="mt-1 text-sm text-slate-500">
					Shows the latest completed selected-season matches where this player was selected.
				</p>

				{recentAppearances.length === 0 ? (
					<div className="mt-4">
						<EmptyState
							title="No appearances yet"
							message="This player has no completed appearances for the selected season."
						/>
					</div>
				) : (
					<div className="mt-4 divide-y divide-slate-100">
						{recentAppearances.map((match) => (
							<div
								key={match.id}
								className="flex items-center justify-between gap-4 py-3 text-sm"
							>
								<div>
									<p className="font-semibold text-slate-900">
										vs {match.opponent}
									</p>
									<p className="text-slate-500">
										{formatDisplayDate(match.date)}
									</p>
								</div>
								<div className="text-right">
									<p className="font-semibold text-slate-900">
										{match.playerStat?.goals ?? 0} goals
									</p>
									{match.playerStat?.isMOTM && (
										<p className="text-xs font-semibold text-amber-700">
											MOTM
										</p>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			<PlayerFormModal
				isOpen={playerForm.isPlayerModalOpen}
				isEditing={playerForm.isEditing}
				isSaving={playerForm.isSavingPlayer}
				playerForm={playerForm.playerForm}
				formError={playerForm.formError}
				onClose={playerForm.closePlayerModal}
				onConfirm={playerForm.handleSavePlayer}
				onUpdatePlayerForm={playerForm.updatePlayerForm}
				onTogglePosition={playerForm.togglePosition}
			/>
		</div>
	);
}
