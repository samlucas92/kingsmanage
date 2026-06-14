import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import SeasonSelector from "../../components/compositions/SeasonSelector";
import { DEFAULT_SEASON_ID } from "../../data/seedSeasons";
import {
	buildFinanceRows,
	getFinanceSummary,
	getTopOutstandingRows,
} from "../../services/financeService";
import { useFinanceStore } from "../../stores/finance";
import { useMatchStore, type ClubTeam, type Match, type MatchState } from "../../stores/match";
import { usePlayerStore } from "../../stores/players";
import { useSeasonStore } from "../../stores/seasons";
import { formatDisplayDateTime } from "../../utils/date";
import { formatCurrency } from "../../utils/format";

type DashboardTab = "overview" | "matches" | "finance" | "events" | "posts";

const dashboardTabs: Array<{
	id: DashboardTab;
	label: string;
	description: string;
	isFuture?: boolean;
}> = [
	{
		id: "overview",
		label: "Overview",
		description: "Season health, quick actions, and areas needing attention.",
	},
	{
		id: "matches",
		label: "Matches",
		description: "Upcoming fixtures, recent results, and match actions.",
	},
	{
		id: "finance",
		label: "Finance",
		description: "Outstanding balances and payment attention list.",
	},
	{
		id: "events",
		label: "Events",
		description: "Future player-facing events such as fixtures, socials, and presentation nights.",
		isFuture: true,
	},
	{
		id: "posts",
		label: "Posts",
		description: "Future club updates, reminders, and player-facing posts.",
		isFuture: true,
	},
];

export default function Dashboard() {
	const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

	const players = usePlayerStore((state) => state.players);
	const loadPlayers = usePlayerStore((state) => state.loadPlayers);
	const isLoadingPlayers = usePlayerStore((state) => state.isLoadingPlayers);
	const playerLoadError = usePlayerStore((state) => state.playerLoadError);

	const matches = useMatchStore((state) => state.matches);
	const loadMatches = useMatchStore((state) => state.loadMatches);
	const isLoadingMatches = useMatchStore((state) => state.isLoadingMatches);
	const matchLoadError = useMatchStore((state) => state.matchLoadError);

	const playerFinanceRecords = useFinanceStore((state) => state.playerFinanceRecords);
	const loadFinance = useFinanceStore((state) => state.loadFinance);
	const isLoadingFinance = useFinanceStore((state) => state.isLoadingFinance);
	const financeLoadError = useFinanceStore((state) => state.financeLoadError);

	const seasons = useSeasonStore((state) => state.seasons);
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const loadSeasons = useSeasonStore((state) => state.loadSeasons);
	const isLoadingSeasons = useSeasonStore((state) => state.isLoadingSeasons);
	const seasonLoadError = useSeasonStore((state) => state.seasonLoadError);

	useEffect(() => {
		void loadSeasons();
		void loadPlayers();
	}, [loadPlayers, loadSeasons]);

	useEffect(() => {
		if (!activeSeasonId) {
			return;
		}

		void loadMatches(activeSeasonId);
		void loadFinance(activeSeasonId);
	}, [activeSeasonId, loadFinance, loadMatches]);

	const activeSeason = seasons.find((season) => season.id === activeSeasonId);
	const activePlayers = players.filter((player) => player.isActive);
	const inactivePlayers = players.filter((player) => !player.isActive);

	const activeSeasonMatches = useMemo(
		() =>
			matches.filter(
				(match) => (match.seasonId ?? DEFAULT_SEASON_ID) === activeSeasonId
			),
		[activeSeasonId, matches]
	);

	const upcomingMatches = useMemo(
		() =>
			[...activeSeasonMatches]
				.filter((match) => !match.isCompleted && match.state !== "postponed")
				.sort(sortMatchesAscending),
		[activeSeasonMatches]
	);

	const completedMatches = useMemo(
		() =>
			[...activeSeasonMatches]
				.filter((match) => match.isCompleted)
				.sort(sortMatchesDescending),
		[activeSeasonMatches]
	);

	const postponedMatches = activeSeasonMatches.filter(
		(match) => match.state === "postponed"
	);

	const unlockedUpcomingMatches = upcomingMatches.filter(
		(match) => !match.isLineupLocked
	);

	const financeRows = useMemo(
		() =>
			buildFinanceRows({
				players,
				playerFinanceRecords,
				seasonId: activeSeasonId,
				includeInactive: false,
			}),
		[activeSeasonId, playerFinanceRecords, players]
	);

	const financeSummary = useMemo(
		() => getFinanceSummary(financeRows),
		[financeRows]
	);

	const financeWatchlist = useMemo(
		() => getTopOutstandingRows(financeRows, 6),
		[financeRows]
	);

	const nextMatch = upcomingMatches[0];
	const latestCompletedMatch = completedMatches[0];
	const nextThreeMatches = upcomingMatches.slice(0, 3);
	const latestThreeResults = completedMatches.slice(0, 3);
	const isLoading = isLoadingSeasons || isLoadingPlayers || isLoadingMatches || isLoadingFinance;
	const loadErrors = [seasonLoadError, playerLoadError, matchLoadError, financeLoadError].filter(Boolean);

	return (
		<div className="space-y-6">
			<DashboardTabBar activeTab={activeTab} onTabChange={setActiveTab} />

			<section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
							Standard landing point
						</p>
						<h1 className="mt-1 text-2xl font-bold text-slate-950">
							{dashboardTabs.find((tab) => tab.id === activeTab)?.label ?? "Dashboard"}
						</h1>
						<p className="mt-2 max-w-3xl text-sm text-slate-600">
							{dashboardTabs.find((tab) => tab.id === activeTab)?.description}
						</p>
					</div>

					<div className="w-full lg:w-72">
						<SeasonSelector />
					</div>
				</div>

				<div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
					<span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
						{activeSeason?.name ?? "No active season"}
					</span>
					{isLoading && <span>Loading dashboard data...</span>}
					{loadErrors.length > 0 && (
						<span className="font-medium text-red-700">
							Some dashboard data failed to load.
						</span>
					)}
				</div>
			</section>

			{loadErrors.length > 0 && (
				<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
					<p className="font-semibold">Dashboard loading issues</p>
					<ul className="mt-2 list-disc space-y-1 pl-5">
						{loadErrors.map((error) => (
							<li key={error}>{error}</li>
						))}
					</ul>
				</div>
			)}

			{activeTab === "overview" && (
				<OverviewTab
					activePlayersCount={activePlayers.length}
					inactivePlayersCount={inactivePlayers.length}
					completedMatchesCount={completedMatches.length}
					financeOutstanding={financeSummary.totalOutstanding}
					financePaidPercentage={financeSummary.paidPercentage}
					latestCompletedMatch={latestCompletedMatch}
					nextMatch={nextMatch}
					playersOwingCount={financeSummary.playersOwingMoney.length}
					postponedMatchesCount={postponedMatches.length}
					unlockedUpcomingMatchesCount={unlockedUpcomingMatches.length}
					upcomingMatchesCount={upcomingMatches.length}
				/>
			)}

			{activeTab === "matches" && (
				<MatchesTab
					latestThreeResults={latestThreeResults}
					nextThreeMatches={nextThreeMatches}
					postponedMatchesCount={postponedMatches.length}
					unlockedUpcomingMatchesCount={unlockedUpcomingMatches.length}
				/>
			)}

			{activeTab === "finance" && (
				<FinanceTab
					financeOutstanding={financeSummary.totalOutstanding}
					financePaidPercentage={financeSummary.paidPercentage}
					financeWatchlist={financeWatchlist}
					playersOwingCount={financeSummary.playersOwingMoney.length}
					totalExpected={financeSummary.totalExpected}
					totalPaid={financeSummary.totalPaid}
				/>
			)}

			{activeTab === "events" && <EventsTab nextThreeMatches={nextThreeMatches} />}

			{activeTab === "posts" && <PostsTab />}
		</div>
	);
}


function DashboardTabBar({
	activeTab,
	onTabChange,
}: {
	activeTab: DashboardTab;
	onTabChange: (tab: DashboardTab) => void;
}) {
	return (
		<nav
			aria-label="Dashboard sections"
			className="overflow-x-auto border-b border-slate-200 bg-white"
		>
			<div className="flex min-w-max items-end gap-6 px-1 sm:px-0">
				{dashboardTabs.map((tab) => {
					const isActive = activeTab === tab.id;

					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => onTabChange(tab.id)}
							className={`relative -mb-px flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-semibold transition ${
								isActive
									? "border-blue-600 text-blue-700"
									: "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900"
							}`}
							aria-current={isActive ? "page" : undefined}
						>
							<span>{tab.label}</span>
							{tab.isFuture && (
								<span
									className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
										isActive
											? "bg-blue-100 text-blue-800"
											: "bg-amber-100 text-amber-800"
									}`}
								>
									Future
								</span>
							)}
						</button>
					);
				})}
			</div>
		</nav>
	);
}

function OverviewTab({
	activePlayersCount,
	completedMatchesCount,
	financeOutstanding,
	financePaidPercentage,
	inactivePlayersCount,
	latestCompletedMatch,
	nextMatch,
	playersOwingCount,
	postponedMatchesCount,
	unlockedUpcomingMatchesCount,
	upcomingMatchesCount,
}: {
	activePlayersCount: number;
	completedMatchesCount: number;
	financeOutstanding: number;
	financePaidPercentage: number;
	inactivePlayersCount: number;
	latestCompletedMatch?: Match;
	nextMatch?: Match;
	playersOwingCount: number;
	postponedMatchesCount: number;
	unlockedUpcomingMatchesCount: number;
	upcomingMatchesCount: number;
}) {
	return (
		<div className="space-y-6">
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<SummaryCard label="Active players" value={activePlayersCount} helper={`${inactivePlayersCount} inactive`} />
				<SummaryCard label="Upcoming matches" value={upcomingMatchesCount} helper={`${unlockedUpcomingMatchesCount} lineups still unlocked`} />
				<SummaryCard label="Completed matches" value={completedMatchesCount} helper={`${postponedMatchesCount} postponed`} />
				<SummaryCard label="Outstanding finance" value={formatCurrency(financeOutstanding)} helper={`${playersOwingCount} players owing · ${financePaidPercentage}% paid`} tone={financeOutstanding > 0 ? "danger" : "good"} />
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<AttentionCard title="Next fixture" to={nextMatch ? `/matches/${nextMatch.id}` : "/matches"} tone={nextMatch ? "neutral" : "muted"}>
					{nextMatch ? (
						<MatchPreview match={nextMatch} />
					) : (
						<p className="text-sm text-slate-500">No upcoming fixtures in this season.</p>
					)}
				</AttentionCard>

				<AttentionCard title="Latest result" to={latestCompletedMatch ? `/matches/${latestCompletedMatch.id}` : "/matches"} tone="neutral">
					{latestCompletedMatch ? (
						<MatchPreview match={latestCompletedMatch} showResult />
					) : (
						<p className="text-sm text-slate-500">No completed results in this season.</p>
					)}
				</AttentionCard>

				<AttentionCard title="Finance attention" to="/finances" tone={financeOutstanding > 0 ? "danger" : "good"}>
					<p className={`text-2xl font-bold ${financeOutstanding > 0 ? "text-red-700" : "text-green-700"}`}>
						{formatCurrency(financeOutstanding)}
					</p>
					<p className="mt-2 text-sm text-slate-600">
						Outstanding from {playersOwingCount} {playersOwingCount === 1 ? "player" : "players"}.
					</p>
				</AttentionCard>
			</div>

			<section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 className="text-lg font-bold text-slate-950">Quick actions</h2>
						<p className="text-sm text-slate-500">Common management tasks for the current season.</p>
					</div>
				</div>

				<div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<QuickAction to="/matches" title="Manage matches" description="Add fixtures, update results, and manage lineups." />
					<QuickAction to="/players" title="Manage players" description="Add players, edit details, and handle active status." />
					<QuickAction to="/finances" title="Review finances" description="Check outstanding balances and transactions." />
					<QuickAction to="/stats" title="View stats" description="Check stored season and career stats." />
				</div>
			</section>
		</div>
	);
}

function MatchesTab({
	latestThreeResults,
	nextThreeMatches,
	postponedMatchesCount,
	unlockedUpcomingMatchesCount,
}: {
	latestThreeResults: Match[];
	nextThreeMatches: Match[];
	postponedMatchesCount: number;
	unlockedUpcomingMatchesCount: number;
}) {
	return (
		<div className="grid gap-4 xl:grid-cols-2">
			<DashboardPanel
				action={<LinkButton to="/matches">View all matches</LinkButton>}
				description={`${unlockedUpcomingMatchesCount} upcoming lineups still unlocked.`}
				title="Upcoming fixtures"
			>
				<div className="space-y-3">
					{nextThreeMatches.map((match) => (
						<MatchListItem key={match.id} match={match} />
					))}

					{nextThreeMatches.length === 0 && (
						<EmptyState message="No upcoming fixtures in this season." />
					)}
				</div>
			</DashboardPanel>

			<DashboardPanel
				action={<LinkButton to="/matches">View results</LinkButton>}
				description={`${postponedMatchesCount} postponed matches in this season.`}
				title="Recent results"
			>
				<div className="space-y-3">
					{latestThreeResults.map((match) => (
						<MatchListItem key={match.id} match={match} showResult />
					))}

					{latestThreeResults.length === 0 && (
						<EmptyState message="No completed results in this season." />
					)}
				</div>
			</DashboardPanel>
		</div>
	);
}

function FinanceTab({
	financeOutstanding,
	financePaidPercentage,
	financeWatchlist,
	playersOwingCount,
	totalExpected,
	totalPaid,
}: {
	financeOutstanding: number;
	financePaidPercentage: number;
	financeWatchlist: ReturnType<typeof getTopOutstandingRows>;
	playersOwingCount: number;
	totalExpected: number;
	totalPaid: number;
}) {
	return (
		<div className="space-y-4">
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<SummaryCard label="Total charged" value={formatCurrency(totalExpected)} helper="Current season active players" />
				<SummaryCard label="Total paid" value={formatCurrency(totalPaid)} helper={`${financePaidPercentage}% of charges paid`} tone="good" />
				<SummaryCard label="Outstanding" value={formatCurrency(financeOutstanding)} helper={`${playersOwingCount} players owing`} tone={financeOutstanding > 0 ? "danger" : "good"} />
				<SummaryCard label="Finance status" value={financeOutstanding > 0 ? "Attention" : "Clear"} helper="Based on current season balances" tone={financeOutstanding > 0 ? "warning" : "good"} />
			</div>

			<DashboardPanel
				action={<LinkButton to="/finances">Open finance page</LinkButton>}
				description="Top active players with an outstanding balance."
				title="Finance watchlist"
			>
				<div className="space-y-3">
					{financeWatchlist.map((row) => (
						<Link
							key={row.player.id}
							to={`/players/${row.player.id}`}
							className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50"
						>
							<div>
								<p className="font-semibold text-slate-950">{row.player.name}</p>
								<p className="text-xs text-slate-500">Paid {formatCurrency(row.totalPaid)} of {formatCurrency(row.amountOwed)}</p>
							</div>
							<p className="font-bold text-red-700">{formatCurrency(row.balance)}</p>
						</Link>
					))}

					{financeWatchlist.length === 0 && (
						<EmptyState message="No active players currently owe money." />
					)}
				</div>
			</DashboardPanel>
		</div>
	);
}

function EventsTab({ nextThreeMatches }: { nextThreeMatches: Match[] }) {
	return (
		<div className="grid gap-4 xl:grid-cols-2">
			<DashboardPanel
				description="For now, upcoming fixtures are surfaced from Matches. Later this tab can include presentation nights, player socials, fundraisers, and other club events."
				title="Events plan"
			>
				<div className="space-y-3 text-sm text-slate-600">
					<p>
						This tab is a placeholder for the future player-facing Events area. It keeps Dashboard as the standard landing point while leaving room for role-aware content later.
					</p>
					<div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
						<p className="font-semibold text-slate-800">Future event types</p>
						<p className="mt-1">Fixtures, training, presentation nights, player socials, meetings, fundraisers, and other club events.</p>
					</div>
				</div>
			</DashboardPanel>

			<DashboardPanel
				action={<LinkButton to="/matches">Manage fixtures</LinkButton>}
				description="Current fixture data that will eventually feed player events."
				title="Upcoming fixture events"
			>
				<div className="space-y-3">
					{nextThreeMatches.map((match) => (
						<MatchListItem key={match.id} match={match} />
					))}

					{nextThreeMatches.length === 0 && (
						<EmptyState message="No upcoming fixtures to show as events yet." />
					)}
				</div>
			</DashboardPanel>
		</div>
	);
}

function PostsTab() {
	return (
		<DashboardPanel
			description="Posts will make more sense after login and role-aware navigation exist."
			title="Posts plan"
		>
			<div className="grid gap-3 md:grid-cols-3">
				<FutureCard title="Club updates" description="General reminders, notices, and announcements for players." />
				<FutureCard title="Matchday posts" description="Squad news, fixture reminders, and post-match updates." />
				<FutureCard title="Event posts" description="Presentation night, socials, fundraisers, and club nights." />
			</div>
		</DashboardPanel>
	);
}

function SummaryCard({
	helper,
	label,
	tone = "neutral",
	value,
}: {
	helper: string;
	label: string;
	tone?: "neutral" | "good" | "warning" | "danger";
	value: ReactNode;
}) {
	return (
		<div className={`rounded-2xl border bg-white p-4 shadow-sm ${getToneBorder(tone)}`}>
			<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
			<p className={`mt-2 text-2xl font-bold ${getToneText(tone)}`}>{value}</p>
			<p className="mt-1 text-sm text-slate-500">{helper}</p>
		</div>
	);
}

function AttentionCard({
	children,
	title,
	to,
	tone,
}: {
	children: ReactNode;
	title: string;
	to: string;
	tone: "neutral" | "good" | "danger" | "muted";
}) {
	return (
		<Link
			to={to}
			className={`block rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${getToneBorder(tone)}`}
		>
			<p className="text-sm font-semibold text-slate-500">{title}</p>
			<div className="mt-3">{children}</div>
		</Link>
	);
}

function DashboardPanel({
	action,
	children,
	description,
	title,
}: {
	action?: ReactNode;
	children: ReactNode;
	description: string;
	title: string;
}) {
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h2 className="text-lg font-bold text-slate-950">{title}</h2>
					<p className="mt-1 text-sm text-slate-500">{description}</p>
				</div>
				{action}
			</div>
			<div className="mt-4">{children}</div>
		</section>
	);
}

function MatchPreview({ match, showResult = false }: { match: Match; showResult?: boolean }) {
	return (
		<div>
			<div className="flex flex-wrap items-center gap-2">
				<p className="text-lg font-bold text-slate-950">vs {match.opponent}</p>
				<StatusPill state={match.state} />
				{showResult && match.result && <ResultPill match={match} />}
			</div>
			<p className="mt-2 text-sm text-slate-600">
				{formatDisplayDateTime(match.date)} · {getVenueLabel(match.venue)} · {getTeamLabel(match.team)}
			</p>
		</div>
	);
}

function MatchListItem({ match, showResult = false }: { match: Match; showResult?: boolean }) {
	return (
		<Link
			to={`/matches/${match.id}`}
			className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50"
		>
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="font-semibold text-slate-950">vs {match.opponent}</p>
					<p className="mt-1 text-xs text-slate-500">
						{formatDisplayDateTime(match.date)} · {getVenueLabel(match.venue)} · {getTeamLabel(match.team)}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<StatusPill state={match.state} />
					{showResult && match.result && <ResultPill match={match} />}
				</div>
			</div>
		</Link>
	);
}

function QuickAction({
	description,
	title,
	to,
}: {
	description: string;
	title: string;
	to: string;
}) {
	return (
		<Link
			to={to}
			className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
		>
			<p className="font-semibold text-slate-950">{title}</p>
			<p className="mt-1 text-sm text-slate-500">{description}</p>
		</Link>
	);
}

function FutureCard({ description, title }: { description: string; title: string }) {
	return (
		<div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
			<p className="font-semibold text-slate-900">{title}</p>
			<p className="mt-1 text-sm text-slate-500">{description}</p>
		</div>
	);
}

function EmptyState({ message }: { message: string }) {
	return (
		<div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
			{message}
		</div>
	);
}

function LinkButton({ children, to }: { children: ReactNode; to: string }) {
	return (
		<Link
			to={to}
			className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
		>
			{children}
		</Link>
	);
}

function StatusPill({ state }: { state: MatchState }) {
	return (
		<span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(state)}`}>
			{getStatusLabel(state)}
		</span>
	);
}

function ResultPill({ match }: { match: Match }) {
	if (!match.result) {
		return null;
	}

	return (
		<span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-800 ring-1 ring-slate-200">
			{match.result.homeGoals} - {match.result.awayGoals}
		</span>
	);
}

function sortMatchesAscending(firstMatch: Match, secondMatch: Match) {
	return new Date(firstMatch.date).getTime() - new Date(secondMatch.date).getTime();
}

function sortMatchesDescending(firstMatch: Match, secondMatch: Match) {
	return new Date(secondMatch.date).getTime() - new Date(firstMatch.date).getTime();
}

function getTeamLabel(team: ClubTeam) {
	return team === "first" ? "First Team" : "Second Team";
}

function getVenueLabel(venue: Match["venue"]) {
	return venue === "home" ? "Home" : "Away";
}

function getStatusLabel(state: MatchState) {
	if (state === "won") {
		return "Won";
	}

	if (state === "lost") {
		return "Lost";
	}

	if (state === "draw") {
		return "Draw";
	}

	if (state === "postponed") {
		return "Postponed";
	}

	return "Upcoming";
}

function getStatusClass(state: MatchState) {
	if (state === "won") {
		return "bg-green-100 text-green-800";
	}

	if (state === "lost") {
		return "bg-red-100 text-red-800";
	}

	if (state === "draw") {
		return "bg-amber-100 text-amber-800";
	}

	if (state === "postponed") {
		return "bg-slate-200 text-slate-700";
	}

	return "bg-blue-100 text-blue-800";
}

function getToneBorder(tone: "neutral" | "good" | "warning" | "danger" | "muted") {
	if (tone === "good") {
		return "border-green-200";
	}

	if (tone === "warning") {
		return "border-amber-200";
	}

	if (tone === "danger") {
		return "border-red-200";
	}

	if (tone === "muted") {
		return "border-slate-200 opacity-90";
	}

	return "border-slate-200";
}

function getToneText(tone: "neutral" | "good" | "warning" | "danger") {
	if (tone === "good") {
		return "text-green-700";
	}

	if (tone === "warning") {
		return "text-amber-700";
	}

	if (tone === "danger") {
		return "text-red-700";
	}

	return "text-slate-950";
}
