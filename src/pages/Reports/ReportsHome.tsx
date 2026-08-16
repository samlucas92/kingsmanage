import ReportsFilterBar from "./components/ReportsFilterBar";
import ReportsSectionCard from "./components/ReportsSectionCard";
import { useReportsContext } from "./ReportsContext";

export default function ReportsHome() {
	const { canViewFinance, isLoading, loadError } = useReportsContext();

	const reportCards = [
		{
			to: "/reports/overview",
			icon: "↗",
			title: "Club overview",
			description: "How the club is doing at a glance",
			tone: "green" as const,
			visible: true,
		},
		{
			to: "/reports/team-performance",
			icon: "🛡",
			title: "Team Performance",
			description: "Are results and scoring moving in the right direction?",
			tone: "green" as const,
			visible: true,
		},
		{
			to: "/reports/player-stats",
			icon: "☻",
			title: "Player Stats",
			description: "Who is contributing most on the pitch?",
			tone: "green" as const,
			visible: true,
		},
		{
			to: "/reports/player-awards",
			icon: "★",
			title: "Player Awards",
			description: "Who is leading the match-award totals?",
			tone: "green" as const,
			visible: true,
		},
		{
			to: "/reports/training-development",
			icon: "◎",
			title: "Training and Development",
			description: "Are players responding and available for training?",
			tone: "blue" as const,
			visible: true,
		},
		{
			to: "/reports/finance",
			icon: "£",
			title: "Finance insights",
			description: "How much is collected and are payments on pace?",
			tone: "purple" as const,
			visible: canViewFinance,
		},
		{
			to: "/reports/squad-usage",
			icon: "▣",
			title: "Squad Usage",
			description: "Who is playing most and who needs opportunities?",
			tone: "amber" as const,
			visible: true,
		},
		{
			to: "/reports/availability",
			icon: "✓",
			title: "Availability",
			description: "Are players responding and available for events?",
			tone: "blue" as const,
			visible: true,
		},
		{
			to: "/reports/discipline",
			icon: "!",
			title: "Discipline",
			description: "Where are the discipline issues?",
			tone: "amber" as const,
			visible: true,
		},
	];

	return (
		<div className="space-y-5">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<h1 className="hidden text-3xl font-black tracking-[-.03em] text-slate-950 lg:block">Reports</h1>
					<p className="text-sm font-semibold text-slate-500">Insights and data across your club.</p>
				</div>
				<ReportsFilterBar />
			</div>

			{loadError && (
				<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
					{loadError}
				</div>
			)}

			{isLoading && (
				<div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-500">
					Loading report data...
				</div>
			)}

			<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{reportCards
					.filter((card) => card.visible)
					.map((card) => (
						<ReportsSectionCard
							key={card.title}
							to={card.to}
							icon={card.icon}
							title={card.title}
							description={card.description}
							tone={card.tone}
						/>
					))}
			</div>
		</div>
	);
}
