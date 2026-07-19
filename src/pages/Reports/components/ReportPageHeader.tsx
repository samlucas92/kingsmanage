import { Link } from "react-router-dom";
import ReportsFilterBar from "./ReportsFilterBar";

type ReportPageHeaderProps = {
	title: string;
	description: string;
	showTeamFilter?: boolean;
	showCompetitionFilter?: boolean;
	showVenueFilter?: boolean;
	showPlayerFilter?: boolean;
	showDateRangeFilter?: boolean;
	showFriendliesFilter?: boolean;
	children?: React.ReactNode;
};

export default function ReportPageHeader({
	title,
	description,
	showTeamFilter = true,
	showCompetitionFilter = false,
	showVenueFilter = false,
	showPlayerFilter = false,
	showDateRangeFilter = false,
	showFriendliesFilter = true,
	children,
}: ReportPageHeaderProps) {
	return (
		<div className="rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm lg:p-5">
			<div className="min-w-0">
				<Link
					to="/reports"
					className="mb-2 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wide text-yepset-700 hover:text-yepset-900"
				>
					‹ Back to reports
				</Link>
				<div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<p className="text-[11px] font-black uppercase tracking-wide text-yepset-700">Reports</p>
						<h1 className="text-xl font-black tracking-[-.03em] text-slate-950 sm:text-2xl">{title}</h1>
						<p className="max-w-xl text-sm font-semibold text-slate-500">{description}</p>
					</div>
					{children ?? (
						<ReportsFilterBar
							showTeamFilter={showTeamFilter}
							showCompetitionFilter={showCompetitionFilter}
							showVenueFilter={showVenueFilter}
							showPlayerFilter={showPlayerFilter}
							showDateRangeFilter={showDateRangeFilter}
							showFriendliesFilter={showFriendliesFilter}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
