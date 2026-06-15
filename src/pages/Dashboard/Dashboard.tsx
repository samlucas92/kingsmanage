import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import ConfirmationModal from "../../components/compositions/ConfirmationModal";
import { DEFAULT_SEASON_ID } from "../../data/seedSeasons";
import {
	buildFinanceRows,
	getFinanceSummary,
	getTopOutstandingRows,
} from "../../services/financeService";
import { useAuthStore } from "../../stores/auth";
import { useEventStore } from "../../stores/events";
import { useFinanceStore } from "../../stores/finance";
import { useMatchStore, type ClubTeam, type Match, type MatchState } from "../../stores/match";
import { usePlayerStore } from "../../stores/players";
import { usePostStore } from "../../stores/posts";
import { useSeasonStore } from "../../stores/seasons";
import type { ClubEvent, ClubEventAvailabilityStatus } from "../../types/events";
import type { UserRole } from "../../types/auth";
import type { ClubPost, ClubPostType } from "../../types/posts";
import { formatDisplayDateTime } from "../../utils/date";
import { formatCurrency } from "../../utils/format";
import DashboardEventCard from "./components/DashboardEventCard";
import EventFormModal from "./components/EventFormModal";
import PostFormModal from "./components/PostFormModal";

type DashboardTab = "overview" | "matches" | "finance" | "events" | "posts";

type DashboardTabDefinition = {
	id: DashboardTab;
	label: string;
	description: string;
	isFuture?: boolean;
	roles: UserRole[];
};

const dashboardTabs: DashboardTabDefinition[] = [
	{
		id: "overview",
		label: "Overview",
		description: "Season health, quick actions, and areas needing attention.",
		roles: ["Admin", "Coach", "Player"],
	},
	{
		id: "matches",
		label: "Matches",
		description: "Upcoming fixtures, recent results, and match actions.",
		roles: ["Admin", "Coach"],
	},
	{
		id: "finance",
		label: "Finance",
		description: "Outstanding balances and payment attention list.",
		roles: ["Admin"],
	},
	{
		id: "events",
		label: "Events",
		description: "Fixtures, training, socials, meetings, and availability tracking.",
		roles: ["Admin", "Coach", "Player"],
	},
	{
		id: "posts",
		label: "Posts",
		description: "Club updates, reminders, and player-facing announcements.",
		roles: ["Admin", "Coach", "Player"],
	},
];

export default function Dashboard() {
	const currentUser = useAuthStore((state) => state.currentUser);
	const currentRole = currentUser?.role ?? "Player";
	const isManagementRole = currentRole === "Admin" || currentRole === "Coach";
	const isAdmin = currentRole === "Admin";

	const availableTabs = useMemo(
		() => dashboardTabs.filter((tab) => tab.roles.includes(currentRole)),
		[currentRole]
	);

	const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
	const [hasAppliedDefaultTab, setHasAppliedDefaultTab] = useState(false);
	const [isEventModalOpen, setIsEventModalOpen] = useState(false);
	const [isPostModalOpen, setIsPostModalOpen] = useState(false);
	const [postToDelete, setPostToDelete] = useState<ClubPost | null>(null);
	const [isDeletingPost, setIsDeletingPost] = useState(false);

	useEffect(() => {
		if (!currentUser || hasAppliedDefaultTab) {
			return;
		}

		const defaultTab = currentRole === "Player" ? "events" : "overview";

		if (availableTabs.some((tab) => tab.id === defaultTab)) {
			setActiveTab(defaultTab);
		}

		setHasAppliedDefaultTab(true);
	}, [availableTabs, currentRole, currentUser, hasAppliedDefaultTab]);

	useEffect(() => {
		if (!availableTabs.some((tab) => tab.id === activeTab)) {
			setActiveTab(availableTabs[0]?.id ?? "overview");
		}
	}, [activeTab, availableTabs]);

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

	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const loadSeasons = useSeasonStore((state) => state.loadSeasons);
	const isLoadingSeasons = useSeasonStore((state) => state.isLoadingSeasons);
	const seasonLoadError = useSeasonStore((state) => state.seasonLoadError);

	const events = useEventStore((state) => state.events);
	const loadEvents = useEventStore((state) => state.loadEvents);
	const createEvent = useEventStore((state) => state.createEvent);
	const setEventAvailability = useEventStore((state) => state.setAvailability);
	const isLoadingEvents = useEventStore((state) => state.isLoadingEvents);
	const eventsLoadError = useEventStore((state) => state.eventsLoadError);

	const posts = usePostStore((state) => state.posts);
	const loadPosts = usePostStore((state) => state.loadPosts);
	const createPost = usePostStore((state) => state.createPost);
	const deletePost = usePostStore((state) => state.deletePost);
	const isLoadingPosts = usePostStore((state) => state.isLoadingPosts);
	const postsLoadError = usePostStore((state) => state.postsLoadError);

	useEffect(() => {
		void loadEvents();
		void loadPosts();

		if (!isManagementRole) {
			return;
		}

		void loadSeasons();
		void loadPlayers();
	}, [isManagementRole, loadEvents, loadPlayers, loadPosts, loadSeasons]);

	useEffect(() => {
		if (!isManagementRole || !activeSeasonId) {
			return;
		}

		void loadMatches(activeSeasonId);

		if (isAdmin) {
			void loadFinance(activeSeasonId);
		}
	}, [activeSeasonId, isAdmin, isManagementRole, loadFinance, loadMatches]);

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

	const upcomingEvents = useMemo(
		() =>
			events
				.filter((event) => new Date(event.startDateTime).getTime() >= startOfToday().getTime())
				.sort(sortEventsAscending),
		[events]
	);

	const recentEvents = useMemo(
		() =>
			events
				.filter((event) => new Date(event.startDateTime).getTime() < startOfToday().getTime())
				.sort(sortEventsDescending)
				.slice(0, 4),
		[events]
	);

	const postponedMatches = activeSeasonMatches.filter(
		(match) => match.state === "postponed"
	);
	const unlockedUpcomingMatches = upcomingMatches.filter(
		(match) => !match.isLineupLocked
	);

	const financeRows = useMemo(
		() =>
			isAdmin
				? buildFinanceRows({
						players,
						playerFinanceRecords,
						seasonId: activeSeasonId,
						includeInactive: false,
					})
				: [],
		[activeSeasonId, isAdmin, playerFinanceRecords, players]
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

	const isLoading =
		isLoadingEvents ||
		isLoadingPosts ||
		(isManagementRole &&
			(isLoadingSeasons ||
				isLoadingPlayers ||
				isLoadingMatches ||
				(isAdmin && isLoadingFinance)));

	const loadErrors = [
		eventsLoadError,
		postsLoadError,
		isManagementRole ? seasonLoadError : "",
		isManagementRole ? playerLoadError : "",
		isManagementRole ? matchLoadError : "",
		isAdmin ? financeLoadError : "",
	].filter(Boolean);

	const activeTabDefinition = availableTabs.find((tab) => tab.id === activeTab);
	async function handleCreateEvent(request: Parameters<typeof createEvent>[0]) {
		await createEvent(request);
		await loadEvents(true);

		if (isManagementRole && activeSeasonId) {
			await loadMatches(activeSeasonId, true);
		}
	}

	async function handleSetAvailability(
		eventId: string,
		status: ClubEventAvailabilityStatus
	) {
		await setEventAvailability(eventId, status);
	}

	async function handleCreatePost(request: Parameters<typeof createPost>[0]) {
		await createPost(request);
		await loadPosts(true);
	}

	async function handleDeletePost() {
		if (!postToDelete) {
			return;
		}

		setIsDeletingPost(true);

		try {
			await deletePost(postToDelete.id);
			setPostToDelete(null);
		} finally {
			setIsDeletingPost(false);
		}
	}

	return (
		<div className="space-y-6">
			<DashboardTabBar
				activeTab={activeTab}
				tabs={availableTabs}
				onTabChange={setActiveTab}
			/>

			<section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
					<div>
						<p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
							{currentRole === "Player" ? "Player landing point" : "Management landing point"}
						</p>

						<h1 className="mt-2 text-3xl font-bold text-slate-900">
							{activeTabDefinition?.label ?? "Dashboard"}
						</h1>

						<p className="mt-2 max-w-3xl text-sm text-slate-600">
							{activeTabDefinition?.description}
						</p>

						<div className="mt-4 flex flex-wrap gap-2">
							<span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
								{currentRole}
							</span>


							{isLoading && (
								<span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
									Loading dashboard data...
								</span>
							)}

							{loadErrors.length > 0 && (
								<span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
									Some dashboard data failed to load.
								</span>
							)}
						</div>
					</div>

				</div>
			</section>

			{loadErrors.length > 0 && (
				<section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
					<h2 className="font-bold">Dashboard loading issues</h2>

					<ul className="mt-2 list-disc space-y-1 pl-5">
						{loadErrors.map((error) => (
							<li key={error}>{error}</li>
						))}
					</ul>
				</section>
			)}

			{activeTab === "overview" && (
				currentRole === "Player" ? (
					<PlayerOverviewTab
						currentPlayerId={currentUser?.playerId}
						onSetAvailability={handleSetAvailability}
						upcomingEvents={upcomingEvents.slice(0, 3)}
					/>
				) : (
					<OverviewTab
						activePlayersCount={activePlayers.length}
						completedMatchesCount={completedMatches.length}
						financeOutstanding={isAdmin ? financeSummary.totalOutstanding : 0}
						financePaidPercentage={isAdmin ? financeSummary.paidPercentage : 0}
						inactivePlayersCount={inactivePlayers.length}
						isAdmin={isAdmin}
						latestCompletedMatch={latestCompletedMatch}
						nextMatch={nextMatch}
						playersOwingCount={isAdmin ? financeSummary.playersOwingCount : 0}
						postponedMatchesCount={postponedMatches.length}
						unlockedUpcomingMatchesCount={unlockedUpcomingMatches.length}
						upcomingEventsCount={upcomingEvents.length}
						upcomingMatchesCount={upcomingMatches.length}
					/>
				)
			)}

			{activeTab === "matches" && (
				<MatchesTab
					latestThreeResults={latestThreeResults}
					nextThreeMatches={nextThreeMatches}
					postponedMatchesCount={postponedMatches.length}
					unlockedUpcomingMatchesCount={unlockedUpcomingMatches.length}
				/>
			)}

			{activeTab === "finance" && isAdmin && (
				<FinanceTab
					financeOutstanding={financeSummary.totalOutstanding}
					financePaidPercentage={financeSummary.paidPercentage}
					financeWatchlist={financeWatchlist}
					playersOwingCount={financeSummary.playersOwingCount}
					totalExpected={financeSummary.totalExpected}
					totalPaid={financeSummary.totalPaid}
				/>
			)}

			{activeTab === "events" && (
				<EventsTab
					canManageEvents={isManagementRole}
					currentPlayerId={currentUser?.playerId}
					onCreateEvent={() => setIsEventModalOpen(true)}
					onSetAvailability={handleSetAvailability}
					recentEvents={recentEvents}
					upcomingEvents={upcomingEvents}
				/>
			)}

			{activeTab === "posts" && (
				<PostsTab
					canManagePosts={isManagementRole}
					isLoadingPosts={isLoadingPosts}
					onCreatePost={() => setIsPostModalOpen(true)}
					onDeletePost={setPostToDelete}
					posts={posts}
					postsLoadError={postsLoadError}
				/>
			)}

			<EventFormModal
				isOpen={isEventModalOpen}
				onClose={() => setIsEventModalOpen(false)}
				onCreateEvent={handleCreateEvent}
			/>

			<PostFormModal
				isOpen={isPostModalOpen}
				onClose={() => setIsPostModalOpen(false)}
				onCreatePost={handleCreatePost}
			/>

			<ConfirmationModal
				isOpen={Boolean(postToDelete)}
				title="Delete post"
				message={postToDelete ? `Delete “${postToDelete.title}”? This cannot be undone.` : undefined}
				confirmText="Delete post"
				isBusy={isDeletingPost}
				variant="danger"
				onCancel={() => setPostToDelete(null)}
				onConfirm={handleDeletePost}
			/>
		</div>
	);
}

function DashboardTabBar({
	activeTab,
	onTabChange,
	tabs,
}: {
	activeTab: DashboardTab;
	onTabChange: (tab: DashboardTab) => void;
	tabs: DashboardTabDefinition[];
}) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
			<div className="flex gap-2 overflow-x-auto">
				{tabs.map((tab) => {
					const isActive = activeTab === tab.id;

					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => onTabChange(tab.id)}
							className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
								isActive
									? "bg-blue-700 text-white shadow-sm"
									: "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
							}`}
							aria-current={isActive ? "page" : undefined}
						>
							<span>{tab.label}</span>

							{tab.isFuture && (
								<span
									className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
										isActive
											? "bg-white/20 text-white"
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
		</div>
	);
}

function PlayerOverviewTab({
	currentPlayerId,
	onSetAvailability,
	upcomingEvents,
}: {
	currentPlayerId?: string | null;
	onSetAvailability: (eventId: string, status: ClubEventAvailabilityStatus) => Promise<void>;
	upcomingEvents: ClubEvent[];
}) {
	return (
		<div className="grid gap-5 lg:grid-cols-3">
			<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
				<p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
					Player dashboard
				</p>

				<h2 className="mt-2 text-2xl font-bold text-slate-900">
					Your club events
				</h2>

				<p className="mt-2 text-sm text-slate-600">
					Update your availability for matches, training, and socials.
				</p>

				<div className="mt-5 space-y-3">
					{upcomingEvents.map((event) => (
						<DashboardEventCard
							key={event.id}
							currentPlayerId={currentPlayerId}
							event={event}
							onSetAvailability={onSetAvailability}
						/>
					))}

					{upcomingEvents.length === 0 && (
						<EmptyState message="No upcoming events are available yet." />
					)}
				</div>
			</section>

			<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<h2 className="text-lg font-bold text-slate-900">Available now</h2>

				<div className="mt-4 space-y-3">
					<QuickAction
						title="Account settings"
						description="Change your password and view your account details."
						to="/settings"
					/>

					<div className="rounded-xl border border-dashed border-slate-300 p-4">
						<p className="text-sm font-bold text-slate-900">Coming later</p>
						<p className="mt-1 text-sm text-slate-500">
							My stats, my finance, and posts will be added after their safe player APIs exist.
						</p>
					</div>
				</div>
			</section>
		</div>
	);
}

function OverviewTab({
	activePlayersCount,
	financeOutstanding,
	financePaidPercentage,
	inactivePlayersCount,
	isAdmin,
	latestCompletedMatch,
	nextMatch,
	playersOwingCount,
	unlockedUpcomingMatchesCount,
	upcomingEventsCount,
	upcomingMatchesCount,
}: {
	activePlayersCount: number;
	completedMatchesCount: number;
	financeOutstanding: number;
	financePaidPercentage: number;
	inactivePlayersCount: number;
	isAdmin: boolean;
	latestCompletedMatch?: Match;
	nextMatch?: Match;
	playersOwingCount: number;
	postponedMatchesCount: number;
	unlockedUpcomingMatchesCount: number;
	upcomingEventsCount: number;
	upcomingMatchesCount: number;
}) {
	return (
		<div className="space-y-6">
			<div className={`grid gap-5 ${isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
				<SummaryCard
					label="Active players"
					value={activePlayersCount}
					helper={`${inactivePlayersCount} inactive`}
				/>

				<SummaryCard
					label="Upcoming matches"
					value={upcomingMatchesCount}
					helper={`${unlockedUpcomingMatchesCount} lineups still unlocked`}
				/>

				<SummaryCard
					label="Upcoming events"
					value={upcomingEventsCount}
					helper="Events are season-agnostic"
				/>

				{isAdmin && (
					<SummaryCard
						label="Outstanding finance"
						value={formatCurrency(financeOutstanding)}
						helper={`${playersOwingCount} players owing · ${financePaidPercentage}% paid`}
						tone={financeOutstanding > 0 ? "danger" : "good"}
					/>
				)}
			</div>

			<div className="grid gap-5 lg:grid-cols-3">
				<AttentionCard title="Next fixture" tone={nextMatch ? "neutral" : "muted"}>
					{nextMatch ? (
						<MatchPreview match={nextMatch} />
					) : (
						<p className="text-sm text-slate-500">No upcoming fixtures in the active season.</p>
					)}
				</AttentionCard>

				<AttentionCard title="Latest result" tone={latestCompletedMatch ? "neutral" : "muted"}>
					{latestCompletedMatch ? (
						<MatchPreview match={latestCompletedMatch} showResult />
					) : (
						<p className="text-sm text-slate-500">No completed results in the active season.</p>
					)}
				</AttentionCard>

				{isAdmin ? (
					<AttentionCard
						title="Finance attention"
						tone={financeOutstanding > 0 ? "danger" : "good"}
					>
						<p className={`text-2xl font-bold ${financeOutstanding > 0 ? "text-red-700" : "text-green-700"}`}>
							{formatCurrency(financeOutstanding)}
						</p>

						<p className="mt-2 text-sm text-slate-600">
							Outstanding from {playersOwingCount} {playersOwingCount === 1 ? "player" : "players"}.
						</p>
					</AttentionCard>
				) : (
					<AttentionCard title="Coach focus" tone="neutral">
						<p className="text-sm text-slate-600">
							Finance and user administration are hidden from coach accounts.
						</p>
					</AttentionCard>
				)}
			</div>

			<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="mb-4">
					<h2 className="text-lg font-bold text-slate-900">Quick actions</h2>
					<p className="text-sm text-slate-500">Common management tasks.</p>
				</div>

				<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
					<QuickAction
						title="Open matches"
						description="Review fixtures, lineups, and results."
						to="/matches"
					/>

					<QuickAction
						title="Manage players"
						description="Update player details and active status."
						to="/players"
					/>

					<QuickAction
						title="View stats"
						description="Check season stats and totals."
						to="/stats"
					/>

					{isAdmin && (
						<QuickAction
							title="Open finance"
							description="Review balances and payments."
							to="/finance"
						/>
					)}
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
		<div className="grid gap-5 lg:grid-cols-2">
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
						<EmptyState message="No upcoming fixtures in the active season." />
					)}
				</div>
			</DashboardPanel>

			<DashboardPanel
				action={<LinkButton to="/matches">View results</LinkButton>}
				description={`${postponedMatchesCount} postponed matches in the active season.`}
				title="Recent results"
			>
				<div className="space-y-3">
					{latestThreeResults.map((match) => (
						<MatchListItem key={match.id} match={match} showResult />
					))}

					{latestThreeResults.length === 0 && (
						<EmptyState message="No completed results in the active season." />
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
		<div className="space-y-6">
			<div className="grid gap-5 lg:grid-cols-3">
				<SummaryCard
					label="Expected"
					value={formatCurrency(totalExpected)}
					helper="Current season charges"
				/>

				<SummaryCard
					label="Paid"
					value={formatCurrency(totalPaid)}
					helper={`${financePaidPercentage}% paid`}
					tone="good"
				/>

				<SummaryCard
					label="Outstanding"
					value={formatCurrency(financeOutstanding)}
					helper={`${playersOwingCount} players owing`}
					tone={financeOutstanding > 0 ? "danger" : "good"}
				/>
			</div>

			<DashboardPanel
				action={<LinkButton to="/finance">Open finance page</LinkButton>}
				description="Top active players with an outstanding balance."
				title="Finance watchlist"
			>
				<div className="space-y-3">
					{financeWatchlist.map((row) => (
						<div
							key={row.player.id}
							className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
						>
							<div>
								<p className="font-bold text-slate-900">{row.player.name}</p>
								<p className="text-sm text-slate-500">
									Paid {formatCurrency(row.totalPaid)} of {formatCurrency(row.amountOwed)}
								</p>
							</div>

							<p className="text-lg font-bold text-red-700">{formatCurrency(row.balance)}</p>
						</div>
					))}

					{financeWatchlist.length === 0 && (
						<EmptyState message="No active players have an outstanding balance." />
					)}
				</div>
			</DashboardPanel>
		</div>
	);
}

function EventsTab({
	canManageEvents,
	currentPlayerId,
	onCreateEvent,
	onSetAvailability,
	recentEvents,
	upcomingEvents,
}: {
	canManageEvents: boolean;
	currentPlayerId?: string | null;
	onCreateEvent: () => void;
	onSetAvailability: (eventId: string, status: ClubEventAvailabilityStatus) => Promise<void>;
	recentEvents: ClubEvent[];
	upcomingEvents: ClubEvent[];
}) {
	return (
		<div className="space-y-6">
			<DashboardPanel
				action={
					canManageEvents ? (
						<button
							type="button"
							onClick={onCreateEvent}
							className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
						>
							Create event
						</button>
					) : undefined
				}
				description={
					canManageEvents
						? "Create training, social, meeting, and match events. Events are season agnostic."
						: "Update your availability for upcoming club events."
				}
				title="Upcoming events"
			>
				<div className="space-y-3">
					{upcomingEvents.map((event) => (
						<DashboardEventCard
							key={event.id}
							currentPlayerId={currentPlayerId}
							event={event}
							onSetAvailability={currentPlayerId ? onSetAvailability : undefined}
						/>
					))}

					{upcomingEvents.length === 0 && (
						<EmptyState message="No upcoming events are available yet." />
					)}
				</div>
			</DashboardPanel>

			<DashboardPanel
				description="Most recent past events."
				title="Recent events"
			>
				<div className="space-y-3">
					{recentEvents.map((event) => (
						<DashboardEventCard
							key={event.id}
							currentPlayerId={currentPlayerId}
							event={event}
							onSetAvailability={currentPlayerId ? onSetAvailability : undefined}
						/>
					))}

					{recentEvents.length === 0 && (
						<EmptyState message="No recent events are available yet." />
					)}
				</div>
			</DashboardPanel>
		</div>
	);
}

function PostsTab({
	canManagePosts,
	isLoadingPosts,
	onCreatePost,
	onDeletePost,
	posts,
	postsLoadError,
}: {
	canManagePosts: boolean;
	isLoadingPosts: boolean;
	onCreatePost: () => void;
	onDeletePost: (post: ClubPost) => void;
	posts: ClubPost[];
	postsLoadError: string;
}) {
	return (
		<DashboardPanel
			action={
				canManagePosts ? (
					<button
						type="button"
						onClick={onCreatePost}
						className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
					>
						Create post
					</button>
				) : undefined
			}
			description={
				canManagePosts
					? "Create season-agnostic club updates for players, coaches, and admins."
					: "Read the latest club updates and reminders."
			}
			title="Club posts"
		>
			{postsLoadError && (
				<div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
					{postsLoadError}
				</div>
			)}

			{isLoadingPosts && (
				<div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
					Loading posts...
				</div>
			)}

			{!isLoadingPosts && posts.length === 0 && (
				<EmptyState message="No club posts have been added yet." />
			)}

			<div className="space-y-4">
				{posts.map((post) => (
					<PostCard
						key={post.id}
						canManagePosts={canManagePosts}
						onDeletePost={onDeletePost}
						post={post}
					/>
				))}
			</div>
		</DashboardPanel>
	);
}

function PostCard({
	canManagePosts,
	onDeletePost,
	post,
}: {
	canManagePosts: boolean;
	onDeletePost: (post: ClubPost) => void;
	post: ClubPost;
}) {
	return (
		<article className={`rounded-2xl border bg-white p-5 shadow-sm ${post.isPinned ? "border-amber-200" : "border-slate-200"}`}>
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
							{getPostTypeLabel(post.type)}
						</span>

						{post.isPinned && (
							<span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-800">
								Pinned
							</span>
						)}
					</div>

					<h3 className="mt-3 text-lg font-bold text-slate-900">{post.title}</h3>

					<p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
						{post.body}
					</p>

					<p className="mt-4 text-xs font-semibold text-slate-400">
						Posted {formatDisplayDateTime(post.createdAt)}
						{post.createdByUserEmail ? ` by ${post.createdByUserEmail}` : ""}
					</p>
				</div>

				{canManagePosts && (
					<button
						type="button"
						onClick={() => onDeletePost(post)}
						className="rounded-xl border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50"
					>
						Delete
					</button>
				)}
			</div>
		</article>
	);
}

function getPostTypeLabel(type: ClubPostType) {
	switch (type) {
		case "Announcement":
			return "Announcement";
		case "MatchInfo":
			return "Match info";
		case "Social":
			return "Social";
		case "General":
		default:
			return "General";
	}
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
		<div className={`rounded-2xl border bg-white p-5 shadow-sm ${getToneBorder(tone)}`}>
			<p className="text-sm font-bold uppercase tracking-wide text-slate-500">{label}</p>
			<p className={`mt-3 text-3xl font-bold ${getToneText(tone)}`}>{value}</p>
			<p className="mt-2 text-sm text-slate-500">{helper}</p>
		</div>
	);
}

function AttentionCard({
	children,
	title,
	tone,
}: {
	children: ReactNode;
	title: string;
	tone: "neutral" | "good" | "danger" | "muted";
}) {
	return (
		<section className={`rounded-2xl border bg-white p-5 shadow-sm ${getToneBorder(tone)}`}>
			<h2 className="text-base font-bold text-slate-700">{title}</h2>

			<div className="mt-4">{children}</div>
		</section>
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
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h2 className="text-lg font-bold text-slate-900">{title}</h2>
					<p className="mt-1 text-sm text-slate-500">{description}</p>
				</div>

				{action}
			</div>

			{children}
		</section>
	);
}

function MatchPreview({ match, showResult = false }: { match: Match; showResult?: boolean }) {
	return (
		<div>
			<div className="flex flex-wrap items-center gap-2">
				<p className="text-lg font-bold text-slate-900">vs {match.opponent}</p>
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
		<div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
			<div>
				<p className="font-bold text-slate-900">vs {match.opponent}</p>
				<p className="mt-1 text-sm text-slate-500">
					{formatDisplayDateTime(match.date)} · {getVenueLabel(match.venue)} · {getTeamLabel(match.team)}
				</p>
			</div>

			<div className="flex shrink-0 items-center gap-2">
				<StatusPill state={match.state} />
				{showResult && match.result && <ResultPill match={match} />}
			</div>
		</div>
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
			className="block rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"
		>
			<p className="font-bold text-slate-900">{title}</p>
			<p className="mt-1 text-sm text-slate-500">{description}</p>
		</Link>
	);
}


function EmptyState({ message }: { message: string }) {
	return (
		<div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm font-semibold text-slate-500">
			{message}
		</div>
	);
}

function LinkButton({ children, to }: { children: ReactNode; to: string }) {
	return (
		<Link
			to={to}
			className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
		>
			{children}
		</Link>
	);
}

function StatusPill({ state }: { state: MatchState }) {
	return (
		<span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusClass(state)}`}>
			{getStatusLabel(state)}
		</span>
	);
}

function ResultPill({ match }: { match: Match }) {
	if (!match.result) {
		return null;
	}

	return (
		<span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-900">
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

function sortEventsAscending(firstEvent: ClubEvent, secondEvent: ClubEvent) {
	return new Date(firstEvent.startDateTime).getTime() - new Date(secondEvent.startDateTime).getTime();
}

function sortEventsDescending(firstEvent: ClubEvent, secondEvent: ClubEvent) {
	return new Date(secondEvent.startDateTime).getTime() - new Date(firstEvent.startDateTime).getTime();
}

function startOfToday() {
	const date = new Date();
	date.setHours(0, 0, 0, 0);
	return date;
}

function getTeamLabel(team: ClubTeam | string) {
	if (team === "First" || team === "first") {
		return "First Team";
	}

	if (team === "Second" || team === "second") {
		return "Second Team";
	}

	return "Team";
}

function getVenueLabel(venue: Match["venue"] | string) {
	if (venue === "Home" || venue === "home") {
		return "Home";
	}

	return "Away";
}

function getStatusLabel(state: MatchState | string) {
	if (state === "won" || state === "Won") {
		return "Won";
	}

	if (state === "lost" || state === "Lost") {
		return "Lost";
	}

	if (state === "draw" || state === "Draw") {
		return "Draw";
	}

	if (state === "postponed" || state === "Postponed") {
		return "Postponed";
	}

	return "Upcoming";
}

function getStatusClass(state: MatchState | string) {
	if (state === "won" || state === "Won") {
		return "bg-green-100 text-green-800";
	}

	if (state === "lost" || state === "Lost") {
		return "bg-red-100 text-red-800";
	}

	if (state === "draw" || state === "Draw") {
		return "bg-amber-100 text-amber-800";
	}

	if (state === "postponed" || state === "Postponed") {
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
