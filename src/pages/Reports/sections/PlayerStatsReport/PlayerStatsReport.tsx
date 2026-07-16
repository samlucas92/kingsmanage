import { useEffect, useState } from "react";
import Stats from "../../../Stats/Stats";
import ReportBarChart from "../../components/charts/ReportBarChart";
import ReportChartContainer from "../../components/charts/ReportChartContainer";
import ReportMetricCard from "../../components/ReportMetricCard";
import ReportPageHeader from "../../components/ReportPageHeader";
import { useReportsContext } from "../../ReportsContext";
import { reportsApi, type PlayerReportsResponse } from "../../../../services/reportsApi";

export default function PlayerStatsReport() {
	const { selectedSeasonId, setSelectedSeasonId, selectedTeamId, selectedPlayerId } = useReportsContext();
	const [report, setReport] = useState<PlayerReportsResponse | null>(null);
	const [isLoadingReport, setIsLoadingReport] = useState(false);
	const [reportError, setReportError] = useState("");
	const topContributors = report?.topContributors ?? [];

	useEffect(() => {
		if (!selectedSeasonId) {
			setReport(null);
			return;
		}

		let isCurrent = true;
		setIsLoadingReport(true);
		setReportError("");

		reportsApi.getPlayerReports({
			seasonId: selectedSeasonId,
			teamId: selectedTeamId,
			playerId: selectedPlayerId,
		})
			.then((response) => {
				if (isCurrent) setReport(response);
			})
			.catch((error) => {
				if (isCurrent) {
					setReportError(error instanceof Error ? error.message : "Failed to load player reports.");
					setReport(null);
				}
			})
			.finally(() => {
				if (isCurrent) setIsLoadingReport(false);
			});

		return () => {
			isCurrent = false;
		};
	}, [selectedPlayerId, selectedSeasonId, selectedTeamId]);

	return (
		<div className="space-y-5">
			<ReportPageHeader
				title="Player Stats"
				description="Goals, assists, appearances and match records."
				showTeamFilter
				showPlayerFilter
			/>
			{reportError && (
				<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
					{reportError}
				</div>
			)}
			{isLoadingReport && (
				<div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-500">
					Loading player reports...
				</div>
			)}
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<ReportMetricCard label="Active players" value={report?.summary.activePlayers ?? 0} />
				<ReportMetricCard label="Appearances" value={report?.summary.appearances ?? 0} />
				<ReportMetricCard label="Goals" value={report?.summary.goals ?? 0} tone={(report?.summary.goals ?? 0) > 0 ? "success" : "default"} />
				<ReportMetricCard label="Goal contributions" value={report?.summary.contributions ?? 0} helper={`${report?.summary.assists ?? 0} assists`} />
			</div>
			<ReportChartContainer
				title="Top player contributions"
				description="Goals and assists for the selected player filter."
				isEmpty={topContributors.length === 0}
			>
				<ReportBarChart
					ariaLabel="Top player goals and assists"
					labels={topContributors.map((playerStats) => shortName(playerStats.playerName))}
					series={[
						{
							label: "Goals",
							colour: "#147764",
							values: topContributors.map((playerStats) => playerStats.goals),
						},
						{
							label: "Assists",
							colour: "#2563eb",
							values: topContributors.map((playerStats) => playerStats.assists),
						},
					]}
				/>
			</ReportChartContainer>
			<Stats
				variant="report"
				selectedSeasonId={selectedSeasonId}
				onSeasonChange={setSelectedSeasonId}
				selectedPlayerId={selectedPlayerId}
				rowsOverride={report?.players}
				hideHeader
			/>
		</div>
	);
}

function shortName(name: string) {
	const [firstName, ...rest] = name.split(" ");
	const lastName = rest.at(-1);

	return lastName ? `${firstName[0]}. ${lastName}` : name;
}
