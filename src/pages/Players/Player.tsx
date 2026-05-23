import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import LinkButton from "../../components/compositions/LinkButton";
import NotFoundCard from "../../components/compositions/NotFoundCard";
import EmptyState from "../../components/compositions/EmptyState";
import SeasonSelector from "../../components/compositions/SeasonSelector";
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
						<span
							className={`rounded-full px-3 py-1 text-xs font-semibold ${
								currentPlayer.isActive
									? "bg-green-100 text-green-700"
									: "bg-gray-200 text-gray-600"
							}`}
						>
							{currentPlayer.isActive ? "Active" : "Inactive"}
						</span>

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
						<span
							key={position}
							className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800"
						>
							{position}
						</span>
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
					<Stat label="Career Apps" value={playerSummary.careerApps} />
					<Stat label="Career Goals" value={playerSummary.careerGoals} />
					<Stat label="Tracked Apps" value={playerSummary.trackedCareerApps} />
					<Stat
						label="Tracked Goals"
						value={playerSummary.trackedCareerGoals}
					/>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<Stat label="Pre 25/26 Apps" value={playerSummary.preSeasonApps} />
					<Stat label="Pre 25/26 Goals" value={playerSummary.preSeasonGoals} />
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
					<Stat label="First Team Apps" value={playerSummary.firstTeamApps} />
					<Stat label="First Team Goals" value={playerSummary.firstTeamGoals} />
					<Stat label="Second Team Apps" value={playerSummary.secondTeamApps} />
					<Stat
						label="Second Team Goals"
						value={playerSummary.secondTeamGoals}
					/>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<Stat
						label={`${selectedSeasonName} Apps`}
						value={playerSummary.seasonApps}
					/>
					<Stat
						label={`${selectedSeasonName} Goals`}
						value={playerSummary.seasonGoals}
					/>
					<Stat label="Season Starts" value={playerSummary.starts} />
					<Stat label="Season Bench" value={playerSummary.bench} />
				</div>

				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<Stat label="Assists" value={playerSummary.assists} />
					<Stat label="MOTM" value={playerSummary.motm} />
					<Stat label="Minutes" value={playerSummary.minutes} />
					<Stat label="Yellow Cards" value={playerSummary.yellowCards} />
				</div>

				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<Stat label="Red Cards" value={playerSummary.redCards} />
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
					<Stat label="Owed" value={formatMoney(financeAmountOwed)} />
					<Stat label="Paid" value={formatMoney(financeTotalPaid)} />
					<Stat label="Outstanding" value={formatMoney(financeOutstanding)} />
					<div className="min-w-0 rounded-xl bg-white p-4 shadow">
						<p className="truncate text-sm text-gray-500">Status</p>
						<div className="mt-2">
							<FinanceStatusBadge status={financeStatus} />
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
											{formatMoney(payment.amount)}
										</p>

										<p className="text-xs text-slate-500">
											{new Date(payment.paidAt).toLocaleString()}
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

					<span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
						{playerSummary.seasonApps} season{" "}
						{playerSummary.seasonApps === 1 ? "appearance" : "appearances"}
					</span>
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
										<span className="rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-slate-700">
											{appearance.area}
										</span>

										{appearance.stat.isMOTM && (
											<span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
												MOTM
											</span>
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

function Stat({
	label,
	value,
}: {
	label: string | number;
	value: string | number;
}) {
	return (
		<div className="min-w-0 rounded-xl bg-white p-4 shadow">
			<p className="truncate text-sm text-gray-500">{label}</p>
			<p className="text-2xl font-bold text-blue-900">{value}</p>
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

function FinanceStatusBadge({ status }: { status: string }) {
	if (status === "paid") {
		return (
			<span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
				Paid
			</span>
		);
	}

	if (status === "part-paid") {
		return (
			<span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
				Part paid
			</span>
		);
	}

	if (status === "unpaid") {
		return (
			<span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
				Unpaid
			</span>
		);
	}

	return (
		<span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
			Nothing owed
		</span>
	);
}

function formatMoney(value: number) {
	return new Intl.NumberFormat("en-GB", {
		style: "currency",
		currency: "GBP",
	}).format(value);
}