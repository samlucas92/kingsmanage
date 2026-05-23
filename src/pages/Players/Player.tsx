import { useMemo } from "react";
import { useParams } from "react-router-dom";
import LinkButton from "../../components/compositions/LinkButton";
import NotFoundCard from "../../components/compositions/NotFoundCard";
import EmptyState from "../../components/compositions/EmptyState";
import { usePlayerStore } from "../../stores/players";
import { useMatchStore } from "../../stores/match";
import { useSeasonStore } from "../../stores/seasons";
import { useFinanceStore } from "../../stores/finance";
import type { Match, MatchPlayerStat } from "../../stores/match";
import { DEFAULT_SEASON_ID } from "../../data/seedSeasons";
import { getPreSeasonPlayerStats } from "../../data/preSeasonPlayerStats";
import { PlayerFormModal } from "./components/PlayerFormModal";
import { usePlayerForm } from "./hooks/usePlayerForm";
import { formatDisplayDate } from "../../utils/date";
import {
	getPlayerBalance,
	getPlayerPaymentStatus,
	getPlayerTotalPaid,
} from "../../services/financeService";

const emptyPlayerStat: MatchPlayerStat = {
	playerId: "",
	goals: 0,
	assists: 0,
	yellowCards: 0,
	redCards: 0,
	minutes: 0,
	isMOTM: false,
	note: "",
};

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
	const setActiveSeason = useSeasonStore((state) => state.setActiveSeason);

	const player = players.find((player) => player.id === id);
	const activeSeason = seasons.find((season) => season.id === activeSeasonId);

	const playerForm = usePlayerForm({
		players,
		onUpdatePlayer: updatePlayer,
	});

	const completedSeasonMatches = useMemo(() => {
		return matches.filter(
			(match) =>
				(match.seasonId ?? DEFAULT_SEASON_ID) === activeSeasonId &&
				match.isCompleted
		);
	}, [matches, activeSeasonId]);

	if (!player) {
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
	const preSeasonStats = getPreSeasonPlayerStats(currentPlayer.name);

	const firstTeamMatches = completedSeasonMatches.filter(
		(match) => match.team === "first"
	);

	const secondTeamMatches = completedSeasonMatches.filter(
		(match) => match.team === "second"
	);

	const firstTeamApps = getPlayerAppearancesInMatches(
		firstTeamMatches,
		currentPlayer.id
	);

	const secondTeamApps = getPlayerAppearancesInMatches(
		secondTeamMatches,
		currentPlayer.id
	);

	const firstTeamGoals = getPlayerGoalsInMatches(
		firstTeamMatches,
		currentPlayer.id
	);

	const secondTeamGoals = getPlayerGoalsInMatches(
		secondTeamMatches,
		currentPlayer.id
	);

	const seasonApps = firstTeamApps + secondTeamApps;
	const seasonGoals = firstTeamGoals + secondTeamGoals;

	const careerApps = preSeasonStats.appearances + seasonApps;
	const careerGoals = preSeasonStats.goals + seasonGoals;

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

	const playerMatchStats = completedSeasonMatches.flatMap((match) =>
		(match.playerStats ?? [])
			.filter((stat) => stat.playerId === currentPlayer.id)
			.map((stat) => ({
				...stat,
				match,
			}))
	);

	const calculatedSquadAppearances = completedSeasonMatches.filter((match) =>
		match.selectedPlayers.some(
			(selectedPlayer) => selectedPlayer.playerId === currentPlayer.id
		)
	);

	const calculatedStarts = completedSeasonMatches.filter((match) =>
		match.selectedPlayers.some(
			(selectedPlayer) =>
				selectedPlayer.playerId === currentPlayer.id &&
				selectedPlayer.area === "pitch"
		)
	);

	const calculatedBenchAppearances = completedSeasonMatches.filter((match) =>
		match.selectedPlayers.some(
			(selectedPlayer) =>
				selectedPlayer.playerId === currentPlayer.id &&
				selectedPlayer.area === "bench"
		)
	);

	const totalAssists = playerMatchStats.reduce(
		(total, stat) => total + stat.assists,
		0
	);

	const totalYellowCards = playerMatchStats.reduce(
		(total, stat) => total + stat.yellowCards,
		0
	);

	const totalRedCards = playerMatchStats.reduce(
		(total, stat) => total + stat.redCards,
		0
	);

	const totalMinutes = playerMatchStats.reduce(
		(total, stat) => total + stat.minutes,
		0
	);

	const motmAwards = playerMatchStats.filter((stat) => stat.isMOTM).length;

	const recentSeasonAppearances = calculatedSquadAppearances
		.map((match) => {
			const selectedPlayer = match.selectedPlayers.find(
				(selectedPlayer) => selectedPlayer.playerId === currentPlayer.id
			);

			const stat = (match.playerStats ?? []).find(
				(playerStat) => playerStat.playerId === currentPlayer.id
			);

			const currentStat: MatchPlayerStat = stat ?? {
				...emptyPlayerStat,
				playerId: currentPlayer.id,
			};

			return {
				match,
				area: selectedPlayer?.area ?? "bench",
				stat: currentStat,
				hasReportDetail:
					currentStat.goals > 0 ||
					currentStat.assists > 0 ||
					currentStat.yellowCards > 0 ||
					currentStat.redCards > 0 ||
					currentStat.minutes > 0 ||
					currentStat.isMOTM ||
					currentStat.note.trim().length > 0,
			};
		})
		.sort(
			(firstAppearance, secondAppearance) =>
				new Date(secondAppearance.match.date).getTime() -
				new Date(firstAppearance.match.date).getTime()
		)
		.slice(0, 10);

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

			<section className="rounded-xl bg-white p-4 shadow">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="min-w-0">
						<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
							Season view
						</p>

						<h2 className="mt-1 text-lg font-bold text-slate-900">
							{activeSeason?.name ?? "No active season"}
						</h2>

						<p className="mt-1 text-sm text-slate-500">
							25/26 stats are calculated from completed matches in this season.
							Pre 25/26 stats come from the historical stats sheet.
						</p>
					</div>

					<label className="block shrink-0">
						<span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
							Active season
						</span>

						<select
							value={activeSeasonId}
							onChange={(event) => setActiveSeason(event.target.value)}
							className="min-w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm"
						>
							{seasons.map((season) => (
								<option key={season.id} value={season.id}>
									{season.name}
								</option>
							))}
						</select>
					</label>
				</div>
			</section>

			<div className="rounded-xl bg-white p-6 shadow">
				<div>
					<h2 className="text-lg font-bold text-blue-900">Career Summary</h2>

					<p className="mt-1 text-sm text-gray-500">
						Career totals combine Pre 25/26 historical records with the active
						season match reports.
					</p>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<Stat label="Career Apps" value={careerApps} />
					<Stat label="Career Goals" value={careerGoals} />
					<Stat label="Pre 25/26 Apps" value={preSeasonStats.appearances} />
					<Stat label="Pre 25/26 Goals" value={preSeasonStats.goals} />
				</div>
			</div>

			<div className="rounded-xl bg-white p-6 shadow">
				<div>
					<h2 className="text-lg font-bold text-blue-900">
						{activeSeason?.name ?? "Season"} Stats
					</h2>

					<p className="mt-1 text-sm text-gray-500">
						Apps and goals split by first team and second team for this season.
					</p>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<Stat label="First Team Apps" value={firstTeamApps} />
					<Stat label="First Team Goals" value={firstTeamGoals} />
					<Stat label="Second Team Apps" value={secondTeamApps} />
					<Stat label="Second Team Goals" value={secondTeamGoals} />
				</div>

				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<Stat label="Total 25/26 Apps" value={seasonApps} />
					<Stat label="Total 25/26 Goals" value={seasonGoals} />
					<Stat label="Season Starts" value={calculatedStarts.length} />
					<Stat label="Season Bench" value={calculatedBenchAppearances.length} />
				</div>

				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<Stat label="Assists" value={totalAssists} />
					<Stat label="MOTM" value={motmAwards} />
					<Stat label="Minutes" value={totalMinutes} />
					<Stat label="Yellow Cards" value={totalYellowCards} />
				</div>

				<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<Stat label="Red Cards" value={totalRedCards} />
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
							Shows the latest completed active-season matches where this player
							was selected, even if no individual report detail was recorded.
						</p>
					</div>

					<span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
						{seasonApps} season {seasonApps === 1 ? "appearance" : "appearances"}
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

function getPlayerAppearancesInMatches(matches: Match[], playerId: string) {
	return matches.filter((match) =>
		match.selectedPlayers.some(
			(selectedPlayer) => selectedPlayer.playerId === playerId
		)
	).length;
}

function getPlayerGoalsInMatches(matches: Match[], playerId: string) {
	return matches.reduce((total, match) => {
		const playerStat = match.playerStats?.find(
			(stat) => stat.playerId === playerId
		);

		return total + (playerStat?.goals ?? 0);
	}, 0);
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