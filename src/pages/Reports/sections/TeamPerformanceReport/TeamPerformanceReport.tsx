import ReportAnswerCard from "../../components/ReportAnswerCard";
import ReportDetails from "../../components/ReportDetails";
import ReportPanel from "../../components/ReportPanel";
import ReportEmptyState from "../../components/ReportEmptyState";
import ReportPageHeader from "../../components/ReportPageHeader";
import ReportChartContainer from "../../components/charts/ReportChartContainer";
import ReportBarChart from "../../components/charts/ReportBarChart";
import ReportLineChart from "../../components/charts/ReportLineChart";
import ReportLoadState from "../../components/ReportLoadState";
import { useReportsContext } from "../../ReportsContext";
import { useReportResource } from "../../hooks/useReportResource";
import {
	reportsApi,
	type ResultBreakdown,
	type TeamPerformanceReportResponse,
} from "../../../../services/reportsApi";

const emptySummary: ResultBreakdown = {
	played: 0,
	won: 0,
	drawn: 0,
	lost: 0,
	goalsFor: 0,
	goalsAgainst: 0,
	goalDifference: 0,
	winPercentage: 0,
	averageGoalsFor: 0,
	averageGoalsAgainst: 0,
};

export default function TeamPerformanceReport() {
	const {
		selectedSeasonId,
		selectedTeamId,
		selectedCompetition,
		selectedVenue,
		dateFrom,
		dateTo,
		includeFriendlies,
		isLoading,
		loadError,
	} = useReportsContext();
	const { report, isLoadingReport, reportError } = useReportResource<TeamPerformanceReportResponse>({
		canLoad: Boolean(selectedSeasonId),
		errorMessage: "Failed to load team performance report.",
		dependencies: [dateFrom, dateTo, includeFriendlies, selectedCompetition, selectedSeasonId, selectedTeamId, selectedVenue],
		load: () =>
			reportsApi.getTeamPerformanceReport({
				seasonId: selectedSeasonId,
				teamId: selectedTeamId,
				competition: selectedCompetition,
				venue: selectedVenue,
				dateFrom,
				dateTo,
				includeFriendlies,
			}),
	});
	const summary = report?.summary ?? emptySummary;
	const homeAway = report?.homeAway ?? { home: emptySummary, away: emptySummary };
	const monthlyBreakdown = report?.months ?? [];
	const recentForm = report?.recentForm ?? [];
	const competitions = report?.competitions ?? [];

	return (
		<div className="space-y-5">
			<ReportPageHeader
				title="Team Performance"
				description="Results and performance breakdown."
				showCompetitionFilter
				showVenueFilter
			/>

			<ReportLoadState
				error={loadError || reportError}
				isLoading={isLoading || isLoadingReport}
			/>

			<ReportAnswerCard
				eyebrow="Overall record"
				value={`${summary.won}W · ${summary.drawn}D · ${summary.lost}L`}
				description={`${summary.winPercentage}% win rate from ${summary.played} completed matches.`}
				tone={summary.won > summary.lost ? "success" : summary.lost > summary.won ? "danger" : "default"}
				stats={[
					{ label: "Goals for", value: summary.goalsFor, tone: "success" },
					{ label: "Goals against", value: summary.goalsAgainst, tone: summary.goalsAgainst > summary.goalsFor ? "danger" : "default" },
					{ label: "Goal difference", value: formatSigned(summary.goalDifference), tone: summary.goalDifference >= 0 ? "success" : "danger" },
					{ label: "Clean sheets", value: report?.cleanSheets ?? 0 },
				]}
			/>

			<div className="grid gap-5 xl:grid-cols-2">
				<ReportChartContainer
					title="Results over time"
					description="Wins, draws and losses by month."
					isEmpty={monthlyBreakdown.length === 0}
				>
					<ReportBarChart
						ariaLabel="Wins draws and losses by month"
						labels={monthlyBreakdown.map((month) => month.label)}
						series={[
							{ label: "Wins", colour: "#147764", values: monthlyBreakdown.map((month) => month.wins) },
							{ label: "Draws", colour: "#f59e0b", values: monthlyBreakdown.map((month) => month.draws) },
							{ label: "Losses", colour: "#dc2626", values: monthlyBreakdown.map((month) => month.losses) },
						]}
					/>
				</ReportChartContainer>

				<ReportChartContainer
					title="Goals for vs goals against"
					description="Monthly scoring and concession trend."
					isEmpty={monthlyBreakdown.length === 0}
				>
					<ReportLineChart
						ariaLabel="Goals for versus goals against by month"
						labels={monthlyBreakdown.map((month) => month.label)}
						series={[
							{ label: "Goals For", colour: "#147764", values: monthlyBreakdown.map((month) => month.goalsFor) },
							{ label: "Goals Against", colour: "#dc2626", values: monthlyBreakdown.map((month) => month.goalsAgainst) },
						]}
					/>
				</ReportChartContainer>
			</div>

			<div className="grid gap-5 xl:grid-cols-2">
				<ReportPanel title="Home vs away">
					<div className="grid gap-3 sm:grid-cols-2">
						<RecordCard label="Home" summary={homeAway.home} />
						<RecordCard label="Away" summary={homeAway.away} />
					</div>
				</ReportPanel>

				<ReportPanel title="Form" description="Last 10 completed matches.">
					{recentForm.length === 0 ? (
						<ReportEmptyState title="No completed matches" message="Form will appear after completed results." />
					) : (
						<div className="flex flex-wrap gap-2">
							{recentForm.map((result, index) => (
								<span
									key={`${result}-${index}`}
									className={`grid h-9 w-9 place-items-center rounded-full text-sm font-black text-white ${getFormClass(result)}`}
								>
									{result}
								</span>
							))}
						</div>
					)}
				</ReportPanel>
			</div>

			<ReportDetails title="More performance detail" description="Biggest results and the record in each competition.">
			<div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
				<ReportPanel title="Match highlights" description="Biggest result swings in the selected filters.">
					<div className="grid gap-3 sm:grid-cols-2">
						<HighlightCard title="Biggest win" highlight={report?.biggestWin} tone="success" />
						<HighlightCard title="Biggest loss" highlight={report?.biggestLoss} tone="danger" />
					</div>
				</ReportPanel>

				<ReportPanel title="Competition breakdown" description="Record split by competition.">
					{competitions.length === 0 ? (
						<ReportEmptyState title="No competition data" message="Competition breakdown will appear after completed results." />
					) : (
						<div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
							{competitions.map((item) => (
								<div key={item.competition} className="px-4 py-3 text-sm">
									<div className="flex items-center justify-between gap-3">
										<span className="min-w-0 truncate font-black text-slate-950">{item.competition}</span>
										<span className="text-xs font-bold text-slate-500">{item.summary.played} played</span>
									</div>
									<div className="mt-2 flex gap-3 text-xs font-black">
										<span className="text-yepset-700">{item.summary.won} wins</span>
										<span className="text-amber-600">{item.summary.drawn} draws</span>
										<span className="text-red-700">{item.summary.lost} losses</span>
									</div>
								</div>
							))}
						</div>
					)}
				</ReportPanel>
			</div>
				<p className="mt-4 text-sm font-semibold text-slate-500">Failed to score in {report?.failedToScore ?? 0} matches · {summary.averageGoalsFor} scored and {summary.averageGoalsAgainst} conceded per match.</p>
			</ReportDetails>
		</div>
	);
}

function HighlightCard({
	title,
	highlight,
	tone,
}: {
	title: string;
	highlight?: TeamPerformanceReportResponse["biggestWin"];
	tone: "success" | "danger";
}) {
	const scoreClass = tone === "success" ? "text-yepset-700" : "text-red-700";

	return (
		<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
			<p className="text-xs font-black uppercase tracking-wide text-slate-500">{title}</p>
			{highlight ? (
				<>
					<p className={`mt-2 text-xl font-black ${scoreClass}`}>
						{highlight.goalsFor} - {highlight.goalsAgainst}
					</p>
					<p className="mt-1 truncate text-sm font-black text-slate-950">{highlight.opponent}</p>
					<p className="mt-1 text-xs font-semibold text-slate-500">
						{new Date(highlight.date).toLocaleDateString("en-GB", {
							day: "2-digit",
							month: "short",
							year: "numeric",
						})}
					</p>
				</>
			) : (
				<p className="mt-2 text-sm font-semibold text-slate-500">No result yet</p>
			)}
		</div>
	);
}

function RecordCard({
	label,
	summary,
}: {
	label: string;
	summary: ResultBreakdown;
}) {
	return (
		<div className="rounded-2xl border border-yepset-100 bg-yepset-50/60 p-4 text-center">
			<p className="text-sm font-black text-yepset-800">{label}</p>
			<div className="mt-3 grid grid-cols-2 gap-3 text-xs font-bold text-slate-500">
				<div><p className="text-xl font-black text-slate-950">{summary.played}</p>Played</div>
				<div><p className="text-xl font-black text-slate-950">{summary.won}</p>Won</div>
				<div><p className="text-xl font-black text-slate-950">{summary.drawn}</p>Drawn</div>
				<div><p className="text-xl font-black text-slate-950">{summary.lost}</p>Lost</div>
			</div>
		</div>
	);
}

function getFormClass(result: "W" | "D" | "L") {
	if (result === "W") {
		return "bg-yepset-600";
	}

	return result === "D" ? "bg-amber-500" : "bg-red-600";
}

function formatSigned(value: number) {
	return value > 0 ? `+${value}` : value;
}
