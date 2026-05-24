import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import LinkButton from "../../components/compositions/LinkButton";
import NotFoundCard from "../../components/compositions/NotFoundCard";
import EmptyState from "../../components/compositions/EmptyState";
import SeasonSelector from "../../components/compositions/SeasonSelector";
import MetricCard from "../../components/compositions/MetricCard";
import StatusBadge from "../../components/compositions/StatusBadge";
import { usePlayerStore } from "../../stores/players";
import { useMatchStore } from "../../stores/match";
import { useSeasonStore } from "../../stores/seasons";
import { useFinanceStore } from "../../stores/finance";
import { useHistoricalStatsStore } from "../../stores/historicalStats";
import { DEFAULT_SEASON_ID } from "../../data/seedSeasons";
import {
	getPlayerStatsSummary,
	getRecentPlayerSeasonAppearances,
} from "../../services/statsService";
import { PlayerFormModal } from "./components/PlayerFormModal";
import { usePlayerForm } from "./hooks/usePlayerForm";
import { formatDisplayDate } from "../../utils/date";
import { formatCurrency, formatDateTime } from "../../utils/format";
import {
	getPlayerBalance,
	getPlayerPaymentStatus,
	getPlayerTotalPaid,
} from "../../services/financeService";

export default function PlayerProfile() {
	const { id } = useParams();

	const players = usePlayerStore((state) => state.players);
	const matches = useMatchStore((state) => state.matches);
	const updatePlayer = usePlayerStore((state) => state.updatePlayer);
	const togglePlayerActive = usePlayerStore(
		(state) => state.togglePlayerActive
	);

	const playerFinanceRecords = useFinanceStore(
		(state) => state.playerFinanceRecords
	);

	const seasons = useSeasonStore((state) => state.seasons);
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);

	const historicalPlayerStats = useHistoricalStatsStore(
		(state) => state.historicalPlayerStats
	);
	const initialiseHistoricalStats = useHistoricalStatsStore(
		(state) => state.initialiseHistoricalStats
	);

	const player = players.find((player) => player.id === id);
	const activeSeason = seasons.find((season) => season.id === activeSeasonId);
	const selectedSeasonName = activeSeason?.name ?? "Selected season";

	const playerForm = usePlayerForm({
		players,
		onUpdatePlayer: updatePlayer,
	});

	useEffect(() => {
		initialiseHistoricalStats(players);
	}, [players, initialiseHistoricalStats]);

	const playerSummary = useMemo(() => {
		if (!player) {
			return null;
		}

		const historicalRecord = historicalPlayerStats.find(
			(record) => record.playerId === player.id
		);

		return getPlayerStatsSummary({
			playerId: player.id,
			playerName: player.name,
			selectedSeasonId: activeSeasonId,
			matches,
			preSeasonStats: historicalRecord
				? {
						appearances: historicalRecord.appearances,
						goals: historicalRecord.goals,
					}
				: undefined,
		});
	}, [player, matches, activeSeasonId, historicalPlayerStats]);

	const recentSeasonAppearances = useMemo(() => {
		if (!player) {
			return [];
		}

		return getRecentPlayerSeasonAppearances({
			playerId: player.id,
			selectedSeasonId: activeSeasonId,
			matches,
			limit: 10,
		});
	}, [player, matches, activeSeasonId]);

	if (!player || !playerSummary) {
		return (
			<div className="space-y-6">
				<LinkButton to="/players" variant="back" className="mb-4 inline-flex">
					← Back to players
				</LinkButton>

				<NotFoundCard
					title="Player not found"
					message="This player may have been archived, removed, or the link may be incorrect."
					action={
						<LinkButton to="/players" variant="plain">
							View players
						</LinkButton>
					}
				/>
			</div>
		);
	}

	const currentPlayer = player;

	const playerFinanceRecord = playerFinanceRecords.find(
		(record) =>
			record.playerId === currentPlayer.id &&
			(record.seasonId ?? DEFAULT_SEASON_ID) === activeSeasonId
	);

	const financeAmountOwed = playerFinanceRecord?.amountOwed ?? 0;
	const financeTotalPaid = getPlayerTotalPaid(playerFinanceRecord);
	const financeOutstanding = getPlayerBalance(playerFinanceRecord);
	const financeStatus = getPlayerPaymentStatus(playerFinanceRecord);
	const financeStatusBadge = getFinanceStatusBadge(financeStatus);

	const recentPayments = [...(playerFinanceRecord?.payments ?? [])]
		.sort(
			(firstPayment, secondPayment) =>
				new Date(secondPayment.paidAt).getTime() -
				new Date(firstPayment.paidAt).getTime()
		)
		.slice(0, 5);

	return (
		<div className="w-full min-w-0 space-y-6 overflow-hidden">
			<LinkButton to="/players" variant="back" className="mb-4 inline-flex">
				← Back to players
			</LinkButton>

			<div className="rounded-xl bg-white p-6 shadow">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="min-w-0">
						<p className="text-sm text-gray-500">Player Profile</p>

						<h1 className="text-3xl font-bold text-blue-900">
							{currentPlayer.name}
						</h1>

						<p className="mt-1 text-gray-600">#{currentPlayer.number}</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<StatusBadge
							label={currentPlayer.isActive ? "Active" : "Inactive"}
							tone={currentPlayer.isActive ? "success" : "neutral"}
						/>

						<button
							type="button"
							onClick={() => playerForm.openEditPlayerModal(currentPlayer)}
							className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
						>
							Edit
						</button>

						<button
							type="button"
							onClick={() => togglePlayerActive(currentPlayer.id)}
							className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
						>
							{currentPlayer.isActive ? "Deactivate" : "Activate"}
						</button>
					</div>
				</div>

				<div className="mt-4 flex flex-wrap gap-2">
					{currentPlayer.positions.map((position) => (
						<StatusBadge key={position} label={position} tone="info" />
					))}
				</div>
			</div>

			<div className="rounded-xl bg-white p-6 shadow">
				<div>
					<h2 className="text-lg font-bold text-blue-900">Career Summary</h2>

					<p className="mt-1 text-sm text-gray-500">
						Career totals combine Pre 25/26 historical records with every
						completed tracked match across all seasons.
					</p>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<MetricCard
						label="Career Apps"
						value={playerSummary.careerApps}
						size="compact"
					/>
					<MetricCard
						label="Career Goals"
						value={playerSummary.careerGoals}
						size="compact"
					/>
					<MetricCard
						label="Tracked Apps"
						value={playerSummary.trackedCareerApps}
						size="compact"
					/>
					<MetricCard
						label="Tracked Goals"
						value={playerSummary.trackedCareerGoals}
						size="compact"
					/>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<MetricCard
						label="Pre 25/26 Apps"
						value={playerSummary.preSeasonApps}
						size="compact"
					/>
					<MetricCard
						label="Pre 25/26 Goals"
						value={playerSummary.preSeasonGoals}
						size="compact"
					/>
				</div>
			</div>

			<section className="rounded-xl bg-white p-4 shadow">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="min-w-0">
						<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
							Season view
						</p>

						<h2 className="mt-1 text-lg font-bold text-slate-900">
							{selectedSeasonName}
						</h2>

						<p className="mt-1 text-sm text-slate-500">
							Selected-season stats use this season only. Change season here to
							view that season’s apps, goals and match history.
						</p>
					</div>

					<SeasonSelector label="Selected season" />
				</div>
			</section>

			<div className="rounded-xl bg-white p-6 shadow">
				<div>
					<h2 className="text-lg font-bold text-blue-900">
						{selectedSeasonName} Stats
					</h2>

					<p className="mt-1 text-sm text-gray-500">
						Apps and goals split by first team and second team for the selected
						season only.
					</p>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<MetricCard
						label="First Team Apps"
						value={playerSummary.firstTeamApps}
						size="compact"
					/>
					<MetricCard
						label="First Team Goals"
						value={playerSummary.firstTeamGoals}
						size="compact"
					/>
					<MetricCard
						label="Second Team Apps"
						value={playerSummary.secondTeamApps}
						size="compact"
					/>
					<MetricCard
						label="Second Team Goals"
						value={playerSummary.secondTeamGoals}
						size="compact"
					/>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<MetricCard
						label={`${selectedSeasonName} Apps`}
						value={playerSummary.seasonApps}
						size="compact"
					/>
					<MetricCard
						label={`${selectedSeasonName} Goals`}
						value={playerSummary.seasonGoals}
						size="compact"
					/>
					<MetricCard
						label="Season Starts"
						value={playerSummary.starts}
						size="compact"
					/>
					<MetricCard
						label="Season Bench"
						value={playerSummary.bench}
						size="compact"
					/>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<MetricCard
						label="Assists"
						value={playerSummary.assists}
						size="compact"
					/>
					<MetricCard
						label="MOTM"
						value={playerSummary.motm}
						size="compact"
					/>
					<MetricCard
						label="Minutes"
						value={playerSummary.minutes}
						size="compact"
					/>
					<MetricCard
						label="Yellow Cards"
						value={playerSummary.yellowCards}
						size="compact"
					/>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<MetricCard
						label="Red Cards"
						value={playerSummary.redCards}
						size="compact"
					/>
				</div>
			</div>

			<div className="rounded-xl bg-white p-6 shadow">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<h2 className="text-lg font-bold text-blue-900">Finance</h2>

						<p className="mt-1 text-sm text-gray-500">
							Active-season finance position for this player.
						</p>
					</div>

					<LinkButton to="/finance" variant="plain">
						View Finance
					</LinkButton>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<MetricCard
						label="Owed"
						value={formatCurrency(financeAmountOwed)}
						size="compact"
					/>
					<MetricCard
						label="Paid"
						value={formatCurrency(financeTotalPaid)}
						size="compact"
						tone="success"
					/>
					<MetricCard
						label="Outstanding"
						value={formatCurrency(financeOutstanding)}
						size="compact"
						tone={financeOutstanding > 0 ? "danger" : "success"}
					/>

					<div className="min-w-0 rounded-xl bg-white p-4 shadow">
						<p className="truncate text-sm text-gray-500">Status</p>
						<div className="mt-2">
							<StatusBadge
								label={financeStatusBadge.label}
								tone={financeStatusBadge.tone}
							/>
						</div>
					</div>
				</div>

				<div className="mt-5">
					<h3 className="text-sm font-bold text-slate-700">Recent payments</h3>

					{recentPayments.length === 0 ? (
						<p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
							No payments recorded for this player in the active season.
						</p>
					) : (
						<div className="mt-2 space-y-2">
							{recentPayments.map((payment) => (
								<div
									key={payment.id}
									className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
								>
									<div>
										<p className="text-sm font-semibold text-slate-900">
											{formatCurrency(payment.amount)}
										</p>

										<p className="text-xs text-slate-500">
											{formatDateTime(payment.paidAt)}
											{payment.note ? ` · ${payment.note}` : ""}
										</p>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			<div className="rounded-xl bg-white p-6 shadow">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<h2 className="text-lg font-bold text-blue-900">
							Recent Season Appearances
						</h2>

						<p className="mt-1 text-sm text-gray-500">
							Shows the latest completed selected-season matches where this
							player was selected, even if no individual report detail was
							recorded.
						</p>
					</div>

					<StatusBadge
						label={`${playerSummary.seasonApps} season ${
							playerSummary.seasonApps === 1 ? "appearance" : "appearances"
						}`}
						tone="info"
					/>
				</div>

				{recentSeasonAppearances.length === 0 ? (
					<div className="mt-4">
						<EmptyState
							title="No completed appearances this season"
							message="Once this player appears in a completed match, their appearance history will show here."
						/>
					</div>
				) : (
					<div className="mt-4 space-y-3">
						{recentSeasonAppearances.map((appearance) => (
							<div
								key={`${appearance.match.id}-${currentPlayer.id}`}
								className="rounded-xl border border-slate-200 bg-slate-50 p-4"
							>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<p className="font-semibold text-slate-900">
											vs {appearance.match.opponent}
										</p>

										<p className="text-sm text-slate-500">
											{formatDisplayDate(appearance.match.date)}
										</p>
									</div>

									<div className="flex flex-wrap items-center gap-2">
										<StatusBadge label={appearance.area} tone="neutral" />

										{appearance.stat.isMOTM && (
											<StatusBadge label="MOTM" tone="warning" />
										)}
									</div>
								</div>

								<div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
									<MiniStat label="G" value={appearance.stat.goals} />
									<MiniStat label="A" value={appearance.stat.assists} />
									<MiniStat label="YC" value={appearance.stat.yellowCards} />
									<MiniStat label="RC" value={appearance.stat.redCards} />
									<MiniStat label="Min" value={appearance.stat.minutes} />
								</div>

								{appearance.stat.note ? (
									<p className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-600">
										{appearance.stat.note}
									</p>
								) : !appearance.hasReportDetail ? (
									<p className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-500">
										No individual report detail recorded.
									</p>
								) : null}
							</div>
						))}
					</div>
				)}
			</div>

			<PlayerFormModal
				isOpen={playerForm.isPlayerModalOpen}
				isEditing={playerForm.isEditing}
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

function MiniStat({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="rounded-lg bg-white p-2 text-center">
			<p className="text-xs font-semibold text-slate-500">{label}</p>
			<p className="text-sm font-bold text-blue-900">{value}</p>
		</div>
	);
}

function getFinanceStatusBadge(status: string): {
	label: string;
	tone: "success" | "warning" | "danger" | "neutral";
} {
	if (status === "paid") {
		return {
			label: "Paid",
			tone: "success",
		};
	}

	if (status === "part-paid") {
		return {
			label: "Part paid",
			tone: "warning",
		};
	}

	if (status === "unpaid") {
		return {
			label: "Unpaid",
			tone: "danger",
		};
	}

	return {
		label: "Nothing owed",
		tone: "neutral",
	};
}