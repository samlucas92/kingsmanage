import { useParams } from "react-router-dom";
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

export default function MatchDetail() {
	const { id } = useParams();
	const matchDetail = useMatchDetail(id);

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
		<div className="space-y-6">
			<LinkButton to="/matches">← Back to matches</LinkButton>

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
				onSaveTeamClick={matchDetail.handleSaveTeamClick}
			/>

			<MatchStatsCard
				selectedPlayers={currentMatch.selectedPlayers}
				playerStats={currentMatch.playerStats ?? []}
				isCompleted={currentMatch.isCompleted}
				getPlayerName={matchDetail.getPlayerName}
				onUpdatePlayerStat={matchDetail.handleUpdateMatchPlayerStat}
			/>

			<MatchNotesCard
				noteDraft={matchDetail.noteDraft}
				notesSaved={matchDetail.notesSaved}
				onUpdateNoteDraft={matchDetail.updateNoteDraft}
				onSaveNotes={matchDetail.handleSaveNotes}
			/>

			<PostponementAuditCard postponements={currentMatch.postponements} />

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
		</div>
	);
}
