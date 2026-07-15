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

export default function MatchDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const matchDetail = useMatchDetail(id);
	const [showGeneratePost, setShowGeneratePost] = useState(false);
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState("");
	const players = usePlayerStore((state) => state.players);
	const teamProfiles = useClubTeamStore((state) => state.profiles);
	const loadTeamProfiles = useClubTeamStore((state) => state.loadProfiles);
	const createPost = usePostStore((state) => state.createPost);

	useEffect(() => {
		void loadTeamProfiles();
	}, [loadTeamProfiles]);

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

			<ResultCard
				homeTeamName={matchDetail.homeTeamName}
				awayTeamName={matchDetail.awayTeamName}
				result={currentMatch.result}
				state={currentMatch.state}
				isCompleted={currentMatch.isCompleted}
				onOpenResultModal={matchDetail.handleOpenResultModal}
			/>

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
			/>

			<MatchStatsCard
				selectedPlayers={currentMatch.selectedPlayers}
				playerStats={currentMatch.playerStats ?? []}
				isCompleted={currentMatch.isCompleted}
				getPlayerName={matchDetail.getPlayerName}
				onSavePlayerStats={matchDetail.handleSaveMatchPlayerStats}
			/>

			<MatchNotesCard
				noteDraft={matchDetail.noteDraft}
				notesSaved={matchDetail.notesSaved}
				onUpdateNoteDraft={matchDetail.updateNoteDraft}
				onSaveNotes={matchDetail.handleSaveNotes}
			/>

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
				message={`This permanently removes the fixture against ${currentMatch.opponent}, including its selection, notes, result and statistics.`}
				confirmText="Delete match"
				variant="danger"
				isBusy={isDeleting}
				onCancel={() => setShowDeleteConfirmation(false)}
				onConfirm={async () => {
					setIsDeleting(true);
					setDeleteError("");
					try {
						await matchDetail.deleteMatch(currentMatch.id);
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
			/>
		</div>
	);
}
