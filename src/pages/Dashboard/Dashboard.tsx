import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

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
import { useMatchStore } from "../../stores/match";
import { useMessageStore } from "../../stores/messages";
import { useRealtimeStore } from "../../stores/realtime";
import { usePlayerStore } from "../../stores/players";
import { usePostStore } from "../../stores/posts";
import { useSeasonStore } from "../../stores/seasons";
import type { ClubEventAvailabilityStatus } from "../../types/events";
import type { ClubPost } from "../../types/posts";
import DashboardLoadingIssues from "./components/DashboardLoadingIssues";
import DashboardTabBar from "./components/DashboardTabBar";
import EventFormModal from "./components/EventFormModal";
import PostFormModal from "../Posts/components/PostFormModal";
import {
	dashboardTabs,
	getDashboardTabFromSearch,
	type DashboardTab,
} from "./dashboardConfig";
import { startOfToday } from "../../utils/date";
import { sortEventsAscending, sortEventsDescending } from "../../utils/events";
import { sortMatchesAscending, sortMatchesDescending } from "../../utils/matches";
import EventsTab from "./tabs/EventsTab";
import FinanceTab from "./tabs/FinanceTab";
import MatchesTab from "./tabs/MatchesTab";
import OverviewTab from "./tabs/OverviewTab";
import PlayerOverviewTab from "./tabs/PlayerOverviewTab";
import PostsTab from "./tabs/PostsTab";
import Messages from "../Messages/Messages";

const MESSAGE_LIST_POLL_INTERVAL_MS = 60_000;

export default function Dashboard() {
	const currentUser = useAuthStore((state) => state.currentUser);
	const currentRole = currentUser?.role ?? "Player";
	const isManagementRole = currentRole === "Admin" || currentRole === "Coach";
	const isAdmin = currentRole === "Admin";

	const availableTabs = useMemo(
		() => dashboardTabs.filter((tab) => tab.roles.includes(currentRole)),
		[currentRole]
	);

	const [searchParams, setSearchParams] = useSearchParams();
	const requestedTab = getDashboardTabFromSearch(searchParams.get("tab"));
	const requestedThreadId = searchParams.get("threadId");

	const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
	const [hasAppliedDefaultTab, setHasAppliedDefaultTab] = useState(false);
	const [isEventModalOpen, setIsEventModalOpen] = useState(false);
	const [isPostModalOpen, setIsPostModalOpen] = useState(false);
	const [postToEdit, setPostToEdit] = useState<ClubPost | null>(null);
	const [postToDelete, setPostToDelete] = useState<ClubPost | null>(null);
	const [isDeletingPost, setIsDeletingPost] = useState(false);

	useEffect(() => {
		if (!currentUser || hasAppliedDefaultTab) {
			return;
		}

		const defaultTab =
			requestedTab && availableTabs.some((tab) => tab.id === requestedTab)
				? requestedTab
				: "overview";

		if (availableTabs.some((tab) => tab.id === defaultTab)) {
			setActiveTab(defaultTab);
		}

		setHasAppliedDefaultTab(true);
	}, [availableTabs, currentUser, hasAppliedDefaultTab, requestedTab]);

	useEffect(() => {
		if (!availableTabs.some((tab) => tab.id === activeTab)) {
			setActiveTab(availableTabs[0]?.id ?? "overview");
		}
	}, [activeTab, availableTabs]);

	useEffect(() => {
		if (!currentUser || !hasAppliedDefaultTab || !requestedTab) {
			return;
		}

		if (!availableTabs.some((tab) => tab.id === requestedTab)) {
			return;
		}

		if (activeTab !== requestedTab) {
			setActiveTab(requestedTab);
		}
	}, [activeTab, availableTabs, currentUser, hasAppliedDefaultTab, requestedTab]);

	const players = usePlayerStore((state) => state.players);
	const loadPlayers = usePlayerStore((state) => state.loadPlayers);
	const playerLoadError = usePlayerStore((state) => state.playerLoadError);

	const matches = useMatchStore((state) => state.matches);
	const loadMatches = useMatchStore((state) => state.loadMatches);
	const matchLoadError = useMatchStore((state) => state.matchLoadError);

	const playerFinanceRecords = useFinanceStore((state) => state.playerFinanceRecords);
	const loadFinance = useFinanceStore((state) => state.loadFinance);
	const financeLoadError = useFinanceStore((state) => state.financeLoadError);

	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const loadSeasons = useSeasonStore((state) => state.loadSeasons);
	const seasonLoadError = useSeasonStore((state) => state.seasonLoadError);

	const events = useEventStore((state) => state.events);
	const loadEvents = useEventStore((state) => state.loadEvents);
	const createEvent = useEventStore((state) => state.createEvent);
	const setEventAvailability = useEventStore((state) => state.setAvailability);
	const eventsLoadError = useEventStore((state) => state.eventsLoadError);

	const posts = usePostStore((state) => state.posts);
	const loadPosts = usePostStore((state) => state.loadPosts);
	const createPost = usePostStore((state) => state.createPost);
	const updatePost = usePostStore((state) => state.updatePost);
	const deletePost = usePostStore((state) => state.deletePost);
	const isLoadingPosts = usePostStore((state) => state.isLoadingPosts);
	const postsLoadError = usePostStore((state) => state.postsLoadError);
	const loadMessageThreads = useMessageStore((state) => state.loadThreads);
	const loadMessageUsers = useMessageStore((state) => state.loadUsers);
	const resetMessages = useMessageStore((state) => state.reset);
	const messagesError = useMessageStore((state) => state.error);
	const realtimeStatus = useRealtimeStore((state) => state.status);

	useEffect(() => {
		if (!currentUser) {
			resetMessages();
			return;
		}

		void loadMessageThreads();
		void loadMessageUsers();

		if (realtimeStatus === "connected") {
			return;
		}

		const intervalId = window.setInterval(() => {
			void loadMessageThreads();
		}, MESSAGE_LIST_POLL_INTERVAL_MS);

		return () => window.clearInterval(intervalId);
	}, [currentUser, loadMessageThreads, loadMessageUsers, realtimeStatus, resetMessages]);

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

	const latestPost = useMemo(
		() =>
			[...posts].sort(
				(first, second) =>
					new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
			)[0],
		[posts]
	);

	const loadErrors = [
		eventsLoadError,
		postsLoadError,
		isManagementRole ? seasonLoadError : "",
		isManagementRole ? playerLoadError : "",
		isManagementRole ? matchLoadError : "",
		isAdmin ? financeLoadError : "",
		messagesError,
	].filter((error): error is string => Boolean(error));

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

	async function handleSavePost(request: Parameters<typeof createPost>[0]) {
		if (postToEdit) {
			await updatePost(postToEdit.id, request);
		} else {
			await createPost(request);
		}

		await loadPosts(true);
		setPostToEdit(null);
	}

	function handleOpenCreatePostModal() {
		setPostToEdit(null);
		setIsPostModalOpen(true);
	}

	function handleOpenEditPostModal(post: ClubPost) {
		setPostToEdit(post);
		setIsPostModalOpen(true);
	}

	function handleClosePostModal() {
		setIsPostModalOpen(false);
		setPostToEdit(null);
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

	function handleTabChange(tab: DashboardTab) {
		setActiveTab(tab);
		setSearchParams(tab === "overview" ? {} : { tab });
	}

	return (
		<div className="space-y-6">
			<DashboardTabBar
				activeTab={activeTab}
				tabs={availableTabs}
				onTabChange={handleTabChange}
			/>

			<DashboardLoadingIssues loadErrors={loadErrors} />

			{activeTab === "overview" && (
				currentRole === "Player" ? (
					<PlayerOverviewTab
						currentPlayerId={currentUser?.playerId}
						latestPost={latestPost}
						onSetAvailability={handleSetAvailability}
						upcomingEvents={upcomingEvents}
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
					onCreatePost={handleOpenCreatePostModal}
					onDeletePost={setPostToDelete}
					onEditPost={handleOpenEditPostModal}
					posts={posts}
					postsLoadError={postsLoadError}
				/>
			)}

			{activeTab === "messages" && (
				<Messages requestedThreadId={requestedThreadId} />
			)}

			<EventFormModal
				isOpen={isEventModalOpen}
				onClose={() => setIsEventModalOpen(false)}
				onCreateEvent={handleCreateEvent}
			/>

			<PostFormModal
				isOpen={isPostModalOpen}
				onClose={handleClosePostModal}
				onSavePost={handleSavePost}
				post={postToEdit}
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
