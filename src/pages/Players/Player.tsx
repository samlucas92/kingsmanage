import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import LinkButton from "../../components/compositions/LinkButton";
import NotFoundCard from "../../components/compositions/NotFoundCard";
import EmptyState from "../../components/compositions/EmptyState";
import SeasonSelector from "../../components/compositions/SeasonSelector";
import MetricCard from "../../components/compositions/MetricCard";
import StatusBadge from "../../components/compositions/StatusBadge";
import { usePlayerStore } from "../../stores/players";
import { useSeasonStore } from "../../stores/seasons";
import { useStatsStore } from "../../stores/stats";
import { useFinanceStore } from "../../stores/finance";
import { matchApi } from "../../services/matchApi";
import { PlayerFormModal } from "./components/PlayerFormModal";
import { usePlayerForm } from "./hooks/usePlayerForm";
import { formatDisplayDate } from "../../utils/date";
import type { FinanceTransaction } from "../../types/finance";

type PlayerMatchRecord = Awaited<ReturnType<typeof matchApi.getPlayerMatches>>[number];

type FinanceStatus = {
	label: string;
	tone: "success" | "warning" | "danger" | "neutral";
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

export default function PlayerProfile() {
	const { id } = useParams();

	const [recentAppearances, setRecentAppearances] = useState<PlayerMatchRecord[]>([]);
	const [isLoadingRecentAppearances, setIsLoadingRecentAppearances] = useState(false);
	const [recentAppearancesError, setRecentAppearancesError] = useState("");
	const [selectedSeasonId, setSelectedSeasonId] = useState("");

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

	const player = players.find((player) => player.id === id);
	const selectedSeason = seasons.find((season) => season.id === selectedSeasonId);
	const playerStats = seasonStats.find((stats) => stats.playerId === id);
	const playerFinanceRecord = playerFinanceRecords.find(
		(record) => record.playerId === id
	);

	useEffect(() => {
		if (!id) {
			return;
		}

		void loadPlayer(id);
	}, [id, loadPlayer]);

	useEffect(() => {
		void loadSeasons();
	}, [loadSeasons]);

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
		<div className="space-y-6">
			<LinkButton to="/players">← Back to players</LinkButton>

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

			{recentAppearancesError && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
					{recentAppearancesError}
				</div>
			)}

			{(isLoadingSeasons ||
				isLoadingStats ||
				isLoadingFinance ||
				isLoadingRecentAppearances) && (
				<div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
					Loading season data...
				</div>
			)}

			<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
							Player Profile
						</p>
						<h1 className="text-2xl font-bold text-slate-900">
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
									className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800"
								>
									{position}
								</span>
							))}
						</div>
					</div>

					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => playerForm.openEditPlayerModal(player)}
							className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
						>
							Edit
						</button>
						<button
							type="button"
							onClick={() => void togglePlayerActive(player.id)}
							className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
						>
							{player.isActive ? "Deactivate" : "Activate"}
						</button>
					</div>
				</div>
			</div>

			<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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

			<div className="grid gap-4 sm:grid-cols-3">
				<MetricCard label="Career Apps" value={careerApps} />
				<MetricCard label="Season Apps" value={seasonApps} />
				<MetricCard label="Season Goals" value={seasonGoals} />
			</div>

			<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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

				<div className="mt-4 grid gap-3 sm:grid-cols-4">
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

			<div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
