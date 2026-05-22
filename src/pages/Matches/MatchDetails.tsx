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

	if (!matchDetail.match) {
		return (
			<div className="space-y-6">
				<LinkButton to="/matches" variant="back" className="mb-4 inline-flex">
					← Back to matches
				</LinkButton>

				<NotFoundCard
					title="Match not found"
					message="This match may have been removed, or the link may be incorrect."
					action={
						<LinkButton to="/matches" variant="plain">
							View matches
						</LinkButton>
					}
				/>
			</div>
		);
	}

	const currentMatch = matchDetail.match;

	return (
		<div className="space-y-6">
			<LinkButton to="/matches" variant="back" className="mb-4 inline-flex">
				← Back to matches
			</LinkButton>

			<MatchHeaderCard
				opponent={currentMatch.opponent}
				date={currentMatch.date}
				venue={currentMatch.venue}
				state={currentMatch.state}
				isCompleted={currentMatch.isCompleted}
				onPostponeClick={() => matchDetail.setShowPostponeModal(true)}
			/>

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
				<TeamSelectionCard
					matchId={currentMatch.id}
					starterCount={matchDetail.starterCount}
					benchCount={matchDetail.benchCount}
					totalSelectedCount={matchDetail.totalSelectedCount}
					isLineupLocked={currentMatch.isLineupLocked}
					onSaveTeamClick={matchDetail.handleSaveTeamClick}
				/>

				<div className="space-y-6">
					<ResultCard
						homeTeamName={matchDetail.homeTeamName}
						awayTeamName={matchDetail.awayTeamName}
						result={currentMatch.result}
						state={currentMatch.state}
						isCompleted={currentMatch.isCompleted}
						onOpenResultModal={matchDetail.handleOpenResultModal}
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

					<PostponementAuditCard
						postponements={currentMatch.postponements}
					/>
				</div>
			</div>

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