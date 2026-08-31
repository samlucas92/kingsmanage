import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LinkButton from "../../components/compositions/LinkButton";
import NotFoundCard from "../../components/compositions/NotFoundCard";
import { TeamSelectionCard } from "./components/match-detail/TeamSelectionCard";
import { ResultCard } from "./components/match-detail/ResultCard";
import { MatchNotesCard } from "./components/match-detail/MatchNotesCard";
import { PostponementAuditCard } from "./components/match-detail/PostponementAuditCard";
import { ResultModal } from "./components/match-detail/ResultModal";
import { PostponeMatchModal } from "./components/match-detail/PostponeMatchModal";
import { IncompleteLineupModal } from "./components/match-detail/IncompleteLineupModal";
import { MatchHeaderCard } from "./components/match-detail/MatchHeaderCard";
import { MatchStatsCard } from "./components/match-detail/MatchStatsCard";
import { useMatchDetail } from "./hooks/useMatchDetails";
import { GeneratePostModal } from "./components/match-detail/GeneratePostModal";
import { usePlayerStore } from "../../stores/players";
import { getClubTeamLabel, useClubTeamStore } from "../../stores/clubTeams";
import { usePostStore } from "../../stores/posts";
import ConfirmationModal from "../../components/compositions/ConfirmationModal";
import { formsApi } from "../../services/formsApi";
import type { ClubForm } from "../../types/forms";
import { matchApi } from "../../services/matchApi";
import { useMatchStore } from "../../stores/match";
import { useEventStore } from "../../stores/events";
import { MatchdayWorkflowCard } from "./components/match-detail/MatchdayWorkflowCard";
import {
	getMatchdayWorkflow,
	type MatchdayActionId,
	type MatchdayStageId,
} from "../../utils/fixtureWorkflow";
import {
	MatchDetailSectionNav,
	type MatchDetailSectionId,
} from "./components/match-detail/MatchDetailSectionNav";

export default function MatchDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const matchDetail = useMatchDetail(id);
	const [showGeneratePost, setShowGeneratePost] = useState(false);
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState("");
	const [isCreatingAwardsForm, setIsCreatingAwardsForm] = useState(false);
	const [awardsFormMessage, setAwardsFormMessage] = useState("");
	const [awardsFormError, setAwardsFormError] = useState("");
	const [matchAwardsForm, setMatchAwardsForm] = useState<ClubForm | null>(null);
	const [deleteLinkedEvent, setDeleteLinkedEvent] = useState(true);
	const [isLinkingEvent, setIsLinkingEvent] = useState(false);
	const [linkEventError, setLinkEventError] = useState("");
	const [pageOpenedAt] = useState(() => new Date());
	const [activeSection, setActiveSection] = useState<MatchDetailSectionId>("overview");
	const players = usePlayerStore((state) => state.players);
	const teamProfiles = useClubTeamStore((state) => state.profiles);
	const loadTeamProfiles = useClubTeamStore((state) => state.loadProfiles);
	const createPost = usePostStore((state) => state.createPost);
	const reloadMatch = useMatchStore((state) => state.loadMatch);
	const loadEvents = useEventStore((state) => state.loadEvents);

	useEffect(() => {
		void loadTeamProfiles();
	}, [loadTeamProfiles]);

	useEffect(() => {
		if (!id) {
			return;
		}

		let cancelled = false;
		void formsApi.getMatchAwardsForm(id)
			.then((form) => {
				if (!cancelled) {
					setMatchAwardsForm(form);
				}
			})
			.catch(() => {
				if (!cancelled) {
					setMatchAwardsForm(null);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [id]);

	if (matchDetail.isLoadingMatches && !matchDetail.match) {
		return (
			<div className="space-y-4">
				<LinkButton to="/matches">← Back to matches</LinkButton>
				<div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-medium text-slate-600 shadow-sm">
					Loading match...
				</div>
			</div>
		);
	}

	if (matchDetail.matchLoadError && !matchDetail.match) {
		return (
			<div className="space-y-4">
				<LinkButton to="/matches">← Back to matches</LinkButton>
				<div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-800 shadow-sm">
					{matchDetail.matchLoadError}
				</div>
			</div>
		);
	}

	if (!matchDetail.match) {
		return (
			<NotFoundCard
				title="Match not found"
				message="This match could not be found. It may have been deleted or the link may be wrong."
				action={<LinkButton to="/matches">View matches</LinkButton>}
			/>
		);
	}

	const currentMatch = matchDetail.match;
	const matchdayWorkflow = getMatchdayWorkflow(
		currentMatch,
		matchDetail.linkedEvent,
		players.filter((player) => player.isActive).map((player) => player.id),
		pageOpenedAt
	);

	async function handleCreateAwardsForm() {
		setIsCreatingAwardsForm(true);
		setAwardsFormError("");
		setAwardsFormMessage("");

		try {
			const form = await formsApi.createMatchAwardsForm(currentMatch.id);
			setMatchAwardsForm(form);
			const shareUrl = `${window.location.origin}/go/${form.goCode}`;

			try {
				await navigator.clipboard.writeText(shareUrl);
				setAwardsFormMessage("Awards form created and share link copied.");
			} catch {
				setAwardsFormMessage(`Awards form created: ${shareUrl}`);
			}
		} catch (error) {
			setAwardsFormError(
				error instanceof Error
					? error.message
					: "Could not create awards form."
			);
		} finally {
			setIsCreatingAwardsForm(false);
		}
	}

	async function handleCreateLinkedEvent() {
		setIsLinkingEvent(true);
		setLinkEventError("");
		try {
			await matchApi.createLinkedEvent(currentMatch.id);
			await Promise.all([reloadMatch(currentMatch.id, true), loadEvents(true)]);
		} catch (error) {
			setLinkEventError(error instanceof Error ? error.message : "Could not add this match to the calendar.");
		} finally {
			setIsLinkingEvent(false);
		}
	}

	function scrollToSection(sectionId: string) {
		document.getElementById(sectionId)?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	}

	function handleSectionSelect(sectionId: MatchDetailSectionId) {
		setActiveSection(sectionId);
		const sectionTargets: Record<MatchDetailSectionId, string> = {
			overview: "matchday-fixture",
			squad: "matchday-team-selection",
			stats: "matchday-stats",
			notes: "matchday-notes",
		};
		scrollToSection(sectionTargets[sectionId]);
	}

	function handleMatchdayStageSelect(stageId: MatchdayStageId) {
		if (stageId === "availability" && matchDetail.linkedEvent) {
			navigate(`/events/${matchDetail.linkedEvent.id}`);
			return;
		}

		if (stageId === "communications" && currentMatch.isLineupLocked) {
			setActiveSection("squad");
			setShowGeneratePost(true);
			return;
		}

		const sectionByStage: Record<Exclude<MatchdayStageId, "availability">, string> = {
			fixture: "matchday-fixture",
			squad: "matchday-team-selection",
			lineup: "matchday-team-selection",
			communications: "matchday-team-selection",
			result: "matchday-result",
		};

		if (stageId === "availability") {
			return;
		}

		setActiveSection(
			stageId === "fixture" || stageId === "result" ? "overview" : "squad"
		);

		scrollToSection(sectionByStage[stageId]);
	}

	function handleMatchdayNextAction(actionId: MatchdayActionId) {
		if (actionId === "link-event") {
			void handleCreateLinkedEvent();
			return;
		}

		if (actionId === "availability" && matchDetail.linkedEvent) {
			navigate(`/events/${matchDetail.linkedEvent.id}`);
			return;
		}

		if (actionId === "squad") {
			setActiveSection("squad");
			scrollToSection("matchday-team-selection");
			return;
		}

		if (actionId === "lineup") {
			setActiveSection("squad");
			matchDetail.handleSaveTeamClick();
			return;
		}

		if (actionId === "communications") {
			setActiveSection("squad");
			setShowGeneratePost(true);
			return;
		}

		if (actionId === "result") {
			setActiveSection("overview");
			matchDetail.handleOpenResultModal();
			return;
		}

		setActiveSection("stats");
		scrollToSection("matchday-stats");
	}

	return (
		<div className="space-y-3 lg:space-y-6">
			<div className="hidden items-center justify-between gap-3 lg:flex">
				<LinkButton to="/matches">← Back to matches</LinkButton>
				<button
					type="button"
					onClick={() => setShowDeleteConfirmation(true)}
					className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50"
				>
					Delete match
				</button>
			</div>

			{deleteError && (
				<div className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
					{deleteError}
				</div>
			)}

			{awardsFormMessage && (
				<div className="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800">
					{awardsFormMessage}
				</div>
			)}

			{awardsFormError && (
				<div className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
					{awardsFormError}
				</div>
			)}

			{matchDetail.playerLoadError && (
				<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 shadow-sm">
					{matchDetail.playerLoadError}
				</div>
			)}

			{matchDetail.isLoadingPlayers && (
				<div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-600 shadow-sm">
					Loading players...
				</div>
			)}

			<div id="matchday-fixture" className="scroll-mt-4">
				<MatchHeaderCard
					opponent={currentMatch.opponent}
					date={currentMatch.date}
					venue={currentMatch.venue}
					location={currentMatch.location}
					competition={currentMatch.competition}
					state={currentMatch.state}
					isCompleted={currentMatch.isCompleted}
					onPostponeClick={() => matchDetail.setShowPostponeModal(true)}
				/>
			</div>

			<MatchdayWorkflowCard
				workflow={matchdayWorkflow}
				isActionBusy={isLinkingEvent}
				actionError={linkEventError}
				onStageSelect={handleMatchdayStageSelect}
				onNextAction={handleMatchdayNextAction}
			/>

			<MatchDetailSectionNav
				activeSection={activeSection}
				onSectionSelect={handleSectionSelect}
			/>

			<div id="matchday-team-selection" className="scroll-mt-4">
				<TeamSelectionCard
					matchId={currentMatch.id}
					starterCount={matchDetail.starterCount}
					benchCount={matchDetail.benchCount}
					totalSelectedCount={matchDetail.totalSelectedCount}
					isLineupLocked={currentMatch.isLineupLocked}
					getPlayerAvailabilityStatus={
						matchDetail.getMatchPlayerAvailabilityStatus
					}
					getPlayerTrainingAvailability={
						matchDetail.getPlayerTrainingAvailability
					}
					onSaveTeamClick={matchDetail.handleSaveTeamClick}
					onGeneratePostClick={() => setShowGeneratePost(true)}
					onCreateAwardsFormClick={handleCreateAwardsForm}
					onGoToAwardsFormClick={() => matchAwardsForm && navigate(`/go/${matchAwardsForm.goCode}`)}
					onViewAwardsFormClick={() => matchAwardsForm && navigate(`/forms/${matchAwardsForm.id}/report`)}
					hasAwardsForm={Boolean(matchAwardsForm)}
					isCreatingAwardsForm={isCreatingAwardsForm}
				/>
			</div>

			<div id="matchday-result" className="scroll-mt-4">
				<ResultCard
					homeTeamName={matchDetail.homeTeamName}
					awayTeamName={matchDetail.awayTeamName}
					result={currentMatch.result}
					state={currentMatch.state}
					isCompleted={currentMatch.isCompleted}
					onOpenResultModal={matchDetail.handleOpenResultModal}
				/>
			</div>

			<div id="matchday-stats" className="scroll-mt-4">
				<MatchStatsCard
					selectedPlayers={currentMatch.selectedPlayers}
					playerStats={currentMatch.playerStats ?? []}
					isCompleted={currentMatch.isCompleted}
					getPlayerName={matchDetail.getPlayerName}
					onSavePlayerStats={matchDetail.handleSaveMatchPlayerStats}
				/>
			</div>

			<div id="matchday-notes" className="scroll-mt-4">
				<MatchNotesCard
					noteDraft={matchDetail.noteDraft}
					notesSaved={matchDetail.notesSaved}
					onUpdateNoteDraft={matchDetail.updateNoteDraft}
					onSaveNotes={matchDetail.handleSaveNotes}
				/>
			</div>

			<PostponementAuditCard postponements={currentMatch.postponements} />

			<button
				type="button"
				onClick={() => setShowDeleteConfirmation(true)}
				className="w-full rounded-xl border border-red-300 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50 lg:hidden"
			>
				Delete match
			</button>

			<ResultModal
				isOpen={matchDetail.showResultModal}
				homeTeamName={matchDetail.homeTeamName}
				awayTeamName={matchDetail.awayTeamName}
				homeGoals={matchDetail.homeGoals}
				awayGoals={matchDetail.awayGoals}
				resultPreview={matchDetail.resultPreview}
				onClose={() => matchDetail.setShowResultModal(false)}
				onConfirm={matchDetail.handleConfirmResult}
				onUpdateHomeGoals={matchDetail.updateHomeGoals}
				onUpdateAwayGoals={matchDetail.updateAwayGoals}
			/>

			<PostponeMatchModal
				isOpen={matchDetail.showPostponeModal}
				newDate={matchDetail.newDate}
				onClose={() => matchDetail.setShowPostponeModal(false)}
				onConfirm={matchDetail.handleConfirmPostpone}
				onUpdateNewDate={matchDetail.setNewDate}
			/>

			<IncompleteLineupModal
				isOpen={matchDetail.showIncompleteLineupModal}
				starterCount={matchDetail.starterCount}
				onClose={() => matchDetail.setShowIncompleteLineupModal(false)}
				onConfirm={matchDetail.handleConfirmIncompleteLineup}
			/>

			<GeneratePostModal
				isOpen={showGeneratePost}
				match={currentMatch}
				players={players}
				teamName={getClubTeamLabel(teamProfiles, currentMatch.team)}
				onClose={() => setShowGeneratePost(false)}
				onPublish={async (request) => {
					await createPost(request);
				}}
			/>

			<ConfirmationModal
				isOpen={showDeleteConfirmation}
				title="Delete this match?"
				message={currentMatch.clubEventId ? "Choose what happens to the linked calendar event." : `This permanently removes the fixture against ${currentMatch.opponent}, including its selection, notes, result and statistics.`}
				confirmText="Delete match"
				variant="danger"
				isBusy={isDeleting}
				onCancel={() => setShowDeleteConfirmation(false)}
				onConfirm={async () => {
					setIsDeleting(true);
					setDeleteError("");
					try {
						await matchDetail.deleteMatch(currentMatch.id, deleteLinkedEvent ? "delete" : "detach");
						navigate("/matches", { replace: true });
					} catch (reason) {
						setDeleteError(
							reason instanceof Error
								? reason.message
								: "Could not delete match."
						);
						setIsDeleting(false);
						setShowDeleteConfirmation(false);
					}
				}}
			>
				{currentMatch.clubEventId && (
					<div className="space-y-2">
						<label className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3"><input type="radio" checked={deleteLinkedEvent} onChange={() => setDeleteLinkedEvent(true)} /><span><strong className="block text-sm text-red-900">Delete match and event</strong><span className="text-xs text-red-700">Removes the complete fixture from matches and the calendar.</span></span></label>
						<label className="flex gap-3 rounded-xl border border-slate-200 p-3"><input type="radio" checked={!deleteLinkedEvent} onChange={() => setDeleteLinkedEvent(false)} /><span><strong className="block text-sm text-slate-900">Delete match only</strong><span className="text-xs text-slate-600">Keeps the event and removes its match link.</span></span></label>
					</div>
				)}
			</ConfirmationModal>
		</div>
	);
}
