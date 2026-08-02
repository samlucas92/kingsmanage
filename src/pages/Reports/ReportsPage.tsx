import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ReportsProvider, useReportsContext } from "./ReportsContext";
import ReportsHome from "./ReportsHome";

const AvailabilityReport = lazy(() => import("./sections/AvailabilityReport/AvailabilityReport"));
const DisciplineReport = lazy(() => import("./sections/DisciplineReport/DisciplineReport"));
const FinanceReport = lazy(() => import("./sections/FinanceReport/FinanceReport"));
const OverviewReport = lazy(() => import("./sections/OverviewReport/OverviewReport"));
const PlayerAwardsReport = lazy(() => import("./sections/PlayerAwardsReport/PlayerAwardsReport"));
const PlayerStatsReport = lazy(() => import("./sections/PlayerStatsReport/PlayerStatsReport"));
const SquadUsageReport = lazy(() => import("./sections/SquadUsageReport/SquadUsageReport"));
const TeamPerformanceReport = lazy(() => import("./sections/TeamPerformanceReport/TeamPerformanceReport"));
const TrainingDevelopmentReport = lazy(() => import("./sections/TrainingDevelopmentReport/TrainingDevelopmentReport"));

export default function ReportsPage() {
	return (
		<ReportsProvider>
			<Suspense fallback={<ReportsLoadingFallback />}>
				<Routes>
					<Route index element={<ReportsHome />} />
					<Route path="overview" element={<OverviewReport />} />
					<Route path="team-performance" element={<TeamPerformanceReport />} />
					<Route path="player-stats" element={<PlayerStatsReport />} />
					<Route path="player-awards" element={<PlayerAwardsReport />} />
					<Route path="squad-usage" element={<SquadUsageReport />} />
					<Route path="availability" element={<AvailabilityReport />} />
					<Route path="discipline" element={<DisciplineReport />} />
					<Route path="finance" element={<FinanceReportRoute />} />
					<Route path="training-development" element={<TrainingDevelopmentReport />} />
					<Route path="*" element={<Navigate to="/reports" replace />} />
				</Routes>
			</Suspense>
		</ReportsProvider>
	);
}

function FinanceReportRoute() {
	const { canViewFinance } = useReportsContext();

	if (!canViewFinance) {
		return <Navigate to="/access-denied" replace />;
	}

	return <FinanceReport />;
}

function ReportsLoadingFallback() {
	return (
		<div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-500">
			Loading report...
		</div>
	);
}
