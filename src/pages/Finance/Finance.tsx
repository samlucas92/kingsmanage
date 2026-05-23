import { Link } from "react-router-dom";
import { usePlayerStore } from "../../stores/players";
import { useMatchStore } from "../../stores/match";
import { useFinanceStore } from "../../stores/finance";
import { useSeasonStore } from "../../stores/seasons";
import { DEFAULT_SEASON_ID } from "../../data/seedSeasons";
import {
	getPlayerBalance,
	getPlayerTotalPaid,
} from "../../services/financeService";
import DevToolsCard from "../../components/compositions/DevToolsCard";
import { formatDisplayDateTime } from "../../utils/date";

export default function Dashboard() {
	const players = usePlayerStore((state) => state.players);
	const matches = useMatchStore((state) => state.matches);
	const playerFinanceRecords = useFinanceStore(
		(state) => state.playerFinanceRecords
	);

	const seasons = useSeasonStore((state) => state.seasons);
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const setActiveSeason = useSeasonStore((state) => state.setActiveSeason);

	const activeSeason = seasons.find((season) => season.id === activeSeasonId);

	const activePlayers = players.filter((player) => player.isActive);
	const inactivePlayers = players.filter((player) => !player.isActive);

	const activeSeasonMatches = matches.filter(
		(match) => (match.seasonId ?? DEFAULT_SEASON_ID) === activeSeasonId
	);

	const upcomingMatches = activeSeasonMatches.filter(
		(match) => !match.isCompleted && match.state !== "postponed"
	);

	const completedMatches = activeSeasonMatches.filter(
		(match) => match.isCompleted
	);

	const postponedMatches = activeSeasonMatches.filter(
		(match) => match.state === "postponed"
	);

	const unlockedUpcomingMatches = upcomingMatches.filter(
		(match) => !match.isLineupLocked
	);

	const activePlayerFinanceRecords = activePlayers.map((player) =>
		playerFinanceRecords.find(
			(record) =>
				record.playerId === player.id &&
				(record.seasonId ?? DEFAULT_SEASON_ID) === activeSeasonId
		)
	);

	const totalExpected = activePlayerFinanceRecords.reduce(
		(total, record) => total + (record?.amountOwed ?? 0),
		0
	);

	const totalPaid = activePlayerFinanceRecords.reduce(
		(total, record) => total + getPlayerTotalPaid(record),
		0
	);

	const totalOutstanding = activePlayerFinanceRecords.reduce(
		(total, record) => total + getPlayerBalance(record),
		0
	);

	const playersOwingMoney = activePlayerFinanceRecords.filter(
		(record) => getPlayerBalance(record) > 0
	).length;

	const paidPercentage =
		totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;

	const nextMatch = [...upcomingMatches].sort(
		(firstMatch, secondMatch) =>
			new Date(firstMatch.date).getTime() -
			new Date(secondMatch.date).getTime()
	)[0];

	const latestCompletedMatch = [...completedMatches].sort(
		(firstMatch, secondMatch) =>
			new Date(secondMatch.date).getTime() -
			new Date(firstMatch.date).getTime()
	)[0];

	const nextThreeMatches = [...upcomingMatches]
		.sort(
			(firstMatch, secondMatch) =>
				new Date(firstMatch.date).getTime() -
				new Date(secondMatch.date).getTime()
		)
		.slice(0, 3);

	const latestThreeResults = [...completedMatches]
		.sort(
			(firstMatch, secondMatch) =>
				new Date(secondMatch.date).getTime() -
				new Date(firstMatch.date).getTime()
		)
		.slice(0, 3);

	return (
		<div className="w-full min-w-0 space-y-6 overflow-hidden">
			<div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
				<div className="min-w-0">
					<h1 className="text-2xl font-bold text-blue-900">Dashboard</h1>

					<p className="text-gray-600">
						Quick overview of what needs attention for the active season.
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

			<section className="rounded-xl bg-white p-5 shadow">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="min-w-0">
						<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
							Current season
						</p>

						<h2 className="mt-1 text-lg font-bold text-slate-900">
							{activeSeason?.name ?? "No active season"}
						</h2>

						<p className="mt-1 text-sm text-slate-500">
							Dashboard figures are filtered to this season.
						</p>
					</div>

					<div className="flex flex-wrap gap-2">
						<SmallBadge label={`${activeSeasonMatches.length} matches`} />
						<SmallBadge label={`${activePlayers.length} active players`} />
						<SmallBadge label={`${paidPercentage}% finance collected`} />
					</div>
				</div>
			</section>

			<div className="grid min-w-0 gap-4 lg:grid-cols-3">
				<PriorityCard
					title="Next Fixture"
					to={nextMatch ? `/matches/${nextMatch.id}` : "/matches"}
					tone={nextMatch?.isLineupLocked ? "good" : "warning"}
				>
					{nextMatch ? (
						<div>
							<p className="text-xl font-bold text-slate-900">
								vs {nextMatch.opponent}
							</p>

							<p className="mt-1 text-sm text-slate-500">
								{formatDisplayDateTime(nextMatch.date)} ·{" "}
								<span className="capitalize">{nextMatch.venue}</span> ·{" "}
								{getTeamLabel(nextMatch.team)}
							</p>

							<div className="mt-4">
								<span
									className={`rounded-full px-3 py-1 text-xs font-bold ${
										nextMatch.isLineupLocked
											? "bg-green-100 text-green-800"
											: "bg-amber-100 text-amber-800"
									}`}
								>
									{nextMatch.isLineupLocked
										? "Lineup saved"
										: "Lineup needs attention"}
								</span>
							</div>
						</div>
					) : (
						<p className="text-sm text-slate-500">
							No upcoming fixtures in this season.
						</p>
					)}
				</PriorityCard>

				<PriorityCard
					title="Finance Attention"
					to="/finance"
					tone={playersOwingMoney > 0 ? "danger" : "good"}
				>
					<p
						className={`text-3xl font-bold ${
							totalOutstanding > 0 ? "text-red-700" : "text-green-700"
						}`}
					>
						{formatMoney(totalOutstanding)}
					</p>

					<p className="mt-1 text-sm text-slate-500">
						Outstanding from {playersOwingMoney}{" "}
						{playersOwingMoney === 1 ? "player" : "players"}.
					</p>

					<div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
						<div
							className="h-full rounded-full bg-blue-700"
							style={{ width: `${Math.min(100, paidPercentage)}%` }}
						/>
					</div>
				</PriorityCard>

				<PriorityCard
					title="Latest Result"
					to={latestCompletedMatch ? `/matches/${latestCompletedMatch.id}` : "/matches"}
					tone="neutral"
				>
					{latestCompletedMatch ? (
						<div>
							<p className="text-xl font-bold text-slate-900">
								vs {latestCompletedMatch.opponent}
							</p>

							<p className="mt-1 text-sm text-slate-500">
								{formatDisplayDateTime(latestCompletedMatch.date)} ·{" "}
								{getTeamLabel(latestCompletedMatch.team)}
							</p>

							<div className="mt-3 flex items-center gap-3">
								{latestCompletedMatch.result && (
									<p className="text-2xl font-bold text-slate-900">
										{latestCompletedMatch.result.homeGoals} -{" "}
										{latestCompletedMatch.result.awayGoals}
									</p>
								)}

								<ResultBadge state={latestCompletedMatch.state} />
							</div>
						</div>
					) : (
						<p className="text-sm text-slate-500">
							No completed results in this season.
						</p>
					)}
				</PriorityCard>
			</div>

			<div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<DashboardStatCard
					label="Upcoming"
					value={upcomingMatches.length}
					helper={`${unlockedUpcomingMatches.length} need team`}
					to="/matches"
					warning={unlockedUpcomingMatches.length > 0}
				/>

				<DashboardStatCard
					label="Completed"
					value={completedMatches.length}
					helper="Results entered"
					to="/matches"
				/>

				<DashboardStatCard
					label="Postponed"
					value={postponedMatches.length}
					helper="Awaiting restoration"
					to="/matches"
					warning={postponedMatches.length > 0}
				/>

				<DashboardStatCard
					label="Active Players"
					value={activePlayers.length}
					helper={`${inactivePlayers.length} inactive`}
					to="/players"
				/>
			</div>

			<div className="grid min-w-0 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
				<section className="rounded-xl bg-white p-6 shadow">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div>
							<h2 className="text-lg font-bold text-blue-900">
								Quick Actions
							</h2>

							<p className="mt-1 text-sm text-slate-500">
								Common things you are likely to do next.
							</p>
						</div>
					</div>

					<div className="mt-5 grid gap-3 sm:grid-cols-2">
						<QuickAction
							to="/matches"
							title="Manage matches"
							description="Add fixtures, enter results, select teams and review match reports."
						/>

						<QuickAction
							to="/players"
							title="Manage players"
							description="Add players, update positions, shirt numbers and active status."
						/>

						<QuickAction
							to="/finance"
							title="Record payments"
							description="Set owed amounts, add payments and check outstanding balances."
						/>

						<QuickAction
							to="/stats"
							title="Review stats"
							description="View active-season stats and historical appearance totals."
						/>
					</div>
				</section>

				<section className="rounded-xl bg-white p-6 shadow">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div>
							<h2 className="text-lg font-bold text-blue-900">
								Season Finance
							</h2>

							<p className="mt-1 text-sm text-slate-500">
								Active player payment summary.
							</p>
						</div>

						<Link
							to="/finance"
							className="text-sm font-semibold text-blue-700 hover:text-blue-900"
						>
							View finance
						</Link>
					</div>

					<div className="mt-5 space-y-4">
						<FinanceLine label="Expected" value={formatMoney(totalExpected)} />
						<FinanceLine label="Paid" value={formatMoney(totalPaid)} />
						<FinanceLine
							label="Outstanding"
							value={formatMoney(totalOutstanding)}
							danger={totalOutstanding > 0}
						/>
						<FinanceLine
							label="Players owing"
							value={playersOwingMoney}
							danger={playersOwingMoney > 0}
						/>
					</div>
				</section>
			</div>

			<div className="grid min-w-0 gap-6 xl:grid-cols-2">
				<section className="rounded-xl bg-white p-6 shadow">
					<div className="flex items-start justify-between gap-4">
						<div>
							<h2 className="text-lg font-bold text-blue-900">
								Next Fixtures
							</h2>

							<p className="text-sm text-gray-500">
								The next few matches in this season.
							</p>
						</div>

						<Link
							to="/matches"
							className="text-sm font-semibold text-blue-700 hover:text-blue-900"
						>
							View all
						</Link>
					</div>

					<div className="mt-4 space-y-3">
						{nextThreeMatches.map((match) => (
							<MatchListItem
								key={match.id}
								to={`/matches/${match.id}`}
								title={`vs ${match.opponent}`}
								meta={`${formatDisplayDateTime(match.date)} · ${match.venue} · ${getTeamLabel(match.team)}`}
								badge={match.isLineupLocked ? "Lineup saved" : "Needs team"}
								badgeTone={match.isLineupLocked ? "good" : "warning"}
							/>
						))}

						{nextThreeMatches.length === 0 && (
							<p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
								No upcoming fixtures.
							</p>
						)}
					</div>
				</section>

				<section className="rounded-xl bg-white p-6 shadow">
					<div className="flex items-start justify-between gap-4">
						<div>
							<h2 className="text-lg font-bold text-blue-900">
								Recent Results
							</h2>

							<p className="text-sm text-gray-500">
								Latest completed matches in this season.
							</p>
						</div>

						<Link
							to="/matches"
							className="text-sm font-semibold text-blue-700 hover:text-blue-900"
						>
							View all
						</Link>
					</div>

					<div className="mt-4 space-y-3">
						{latestThreeResults.map((match) => (
							<Link
								key={match.id}
								to={`/matches/${match.id}`}
								className="block rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="truncate font-semibold text-slate-900">
											vs {match.opponent}
										</p>

										<p className="text-sm text-slate-500">
											{formatDisplayDateTime(match.date)} ·{" "}
											{getTeamLabel(match.team)}
										</p>
									</div>

									<div className="shrink-0 text-right">
										{match.result && (
											<p className="text-lg font-bold text-slate-900">
												{match.result.homeGoals} -{" "}
												{match.result.awayGoals}
											</p>
										)}

										<ResultBadge state={match.state} />
									</div>
								</div>
							</Link>
						))}

						{latestThreeResults.length === 0 && (
							<p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
								No completed matches yet.
							</p>
						)}
					</div>
				</section>
			</div>

			<DevToolsCard />
		</div>
	);
}

function PriorityCard({
	title,
	to,
	tone,
	children,
}: {
	title: string;
	to: string;
	tone: "good" | "warning" | "danger" | "neutral";
	children: React.ReactNode;
}) {
	return (
		<Link
			to={to}
			className={`block rounded-xl border bg-white p-5 shadow transition hover:-translate-y-0.5 hover:shadow-md ${getPriorityCardClass(tone)}`}
		>
			<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
				{title}
			</p>

			<div className="mt-3">{children}</div>
		</Link>
	);
}

function DashboardStatCard({
	label,
	value,
	helper,
	to,
	warning = false,
}: {
	label: string;
	value: number;
	helper: string;
	to: string;
	warning?: boolean;
}) {
	return (
		<Link
			to={to}
			className="min-w-0 rounded-xl bg-white p-5 shadow transition hover:-translate-y-0.5 hover:shadow-md"
		>
			<p className="truncate text-sm font-medium text-gray-500">{label}</p>

			<p
				className={`mt-2 text-3xl font-bold ${
					warning ? "text-amber-700" : "text-blue-900"
				}`}
			>
				{value}
			</p>

			<p className="mt-1 text-sm text-gray-500">{helper}</p>
		</Link>
	);
}

function QuickAction({
	to,
	title,
	description,
}: {
	to: string;
	title: string;
	description: string;
}) {
	return (
		<Link
			to={to}
			className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
		>
			<p className="font-bold text-blue-900">{title}</p>
			<p className="mt-1 text-sm text-slate-500">{description}</p>
		</Link>
	);
}

function MatchListItem({
	to,
	title,
	meta,
	badge,
	badgeTone,
}: {
	to: string;
	title: string;
	meta: string;
	badge: string;
	badgeTone: "good" | "warning";
}) {
	return (
		<Link
			to={to}
			className="block rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="truncate font-semibold text-slate-900">{title}</p>
					<p className="text-sm text-slate-500">{meta}</p>
				</div>

				<span
					className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
						badgeTone === "good"
							? "bg-green-100 text-green-800"
							: "bg-amber-100 text-amber-800"
					}`}
				>
					{badge}
				</span>
			</div>
		</Link>
	);
}

function FinanceLine({
	label,
	value,
	danger = false,
}: {
	label: string;
	value: string | number;
	danger?: boolean;
}) {
	return (
		<div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
			<p className="text-sm font-medium text-slate-500">{label}</p>

			<p
				className={`text-lg font-bold ${
					danger ? "text-red-700" : "text-blue-900"
				}`}
			>
				{value}
			</p>
		</div>
	);
}

function SmallBadge({ label }: { label: string }) {
	return (
		<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
			{label}
		</span>
	);
}

function ResultBadge({ state }: { state: string }) {
	if (state === "won") {
		return (
			<span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase text-green-800">
				Won
			</span>
		);
	}

	if (state === "lost") {
		return (
			<span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold uppercase text-red-800">
				Lost
			</span>
		);
	}

	if (state === "draw") {
		return (
			<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700">
				Draw
			</span>
		);
	}

	return (
		<span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase text-blue-800">
			{state}
		</span>
	);
}

function getPriorityCardClass(tone: "good" | "warning" | "danger" | "neutral") {
	if (tone === "good") {
		return "border-green-200";
	}

	if (tone === "warning") {
		return "border-amber-200";
	}

	if (tone === "danger") {
		return "border-red-200";
	}

	return "border-slate-200";
}

function getTeamLabel(team: "first" | "second") {
	return team === "first" ? "First Team" : "Second Team";
}

function formatMoney(value: number) {
	return new Intl.NumberFormat("en-GB", {
		style: "currency",
		currency: "GBP",
	}).format(value);
}