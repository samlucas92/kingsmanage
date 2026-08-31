import { Link } from "react-router-dom";
import ReportLoadState from "../../components/ReportLoadState";
import ReportAnswerCard from "../../components/ReportAnswerCard";
import ReportPageHeader from "../../components/ReportPageHeader";
import ReportPanel from "../../components/ReportPanel";
import { useReportResource } from "../../hooks/useReportResource";
import { useReportsContext } from "../../useReportsContext";
import { reportsApi, type PlayerAwardCount, type PlayerReportsResponse } from "../../../../services/reportsApi";

export default function PlayerAwardsReport() {
	const { selectedSeasonId, selectedTeamId, selectedPlayerId, includeFriendlies } = useReportsContext();
	const { report, isLoadingReport, reportError } = useReportResource<PlayerReportsResponse>({
		canLoad: Boolean(selectedSeasonId),
		errorMessage: "Failed to load player awards.",
		dependencies: [includeFriendlies, selectedPlayerId, selectedSeasonId, selectedTeamId],
		load: () =>
			reportsApi.getPlayerReports({
				seasonId: selectedSeasonId,
				teamId: selectedTeamId,
				playerId: selectedPlayerId,
				includeFriendlies,
			}),
	});
	const motmRows = report?.awards.manOfTheMatch ?? [];
	const dotdRows = report?.awards.dickOfTheDay ?? [];
	const leadingMotm = motmRows[0];

	return (
		<div className="space-y-5">
			<ReportPageHeader
				title="Player Awards"
				description="Man of the match and dick of the day totals from closed player-award forms."
				showTeamFilter
				showPlayerFilter
			/>
			<ReportLoadState
				error={reportError}
				isLoading={isLoadingReport}
				loadingMessage="Loading player awards..."
			/>
			<ReportAnswerCard
				eyebrow="Award leader"
				value={leadingMotm?.playerName ?? "No awards yet"}
				description={leadingMotm ? `${leadingMotm.count} man of the match ${leadingMotm.count === 1 ? "award" : "awards"} from closed player-award forms.` : "Close a linked match-awards form to add the first result."}
				tone={leadingMotm ? "success" : "default"}
				stats={[
					{ label: "MOTM awards", value: motmRows.reduce((total, row) => total + row.count, 0), tone: "success" },
					{ label: "Other awards", value: dotdRows.reduce((total, row) => total + row.count, 0) },
				]}
			/>
			<div className="grid gap-4 xl:grid-cols-2">
				<AwardTable title="Man of the match" rows={motmRows} emptyMessage="No man of the match awards yet." />
				<AwardTable title="Dick of the day" rows={dotdRows} emptyMessage="No dick of the day awards yet." />
			</div>
		</div>
	);
}

function AwardTable({
	title,
	rows,
	emptyMessage,
}: {
	title: string;
	rows: PlayerAwardCount[];
	emptyMessage: string;
}) {
	return (
		<ReportPanel title={title} description="Counts are based on the top answer once each linked form is closed.">
			{rows.length === 0 ? (
				<p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
					{emptyMessage}
				</p>
			) : (
				<div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
					{rows.map((row, index) => (
						<div key={row.playerId} className="grid grid-cols-[2.5rem_1fr_4rem] items-center gap-2 px-4 py-3 text-sm">
							<span className="font-black text-slate-400">{index + 1}</span>
							<Link to={`/players/${row.playerId}`} className="min-w-0 truncate font-black text-slate-950 hover:text-yepset-700">
								{row.playerName}
							</Link>
							<span className="text-right text-lg font-black text-yepset-700">{row.count}</span>
						</div>
					))}
				</div>
			)}
		</ReportPanel>
	);
}
