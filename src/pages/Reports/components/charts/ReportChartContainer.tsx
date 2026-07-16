import type { ReactNode } from "react";
import ReportEmptyState from "../ReportEmptyState";

type ReportChartContainerProps = {
	title: string;
	description?: string;
	action?: ReactNode;
	isEmpty?: boolean;
	emptyTitle?: string;
	emptyMessage?: string;
	children: ReactNode;
};

export default function ReportChartContainer({
	title,
	description,
	action,
	isEmpty,
	emptyTitle = "No chart data",
	emptyMessage = "There is not enough data for this chart yet.",
	children,
}: ReportChartContainerProps) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
			<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h3 className="text-sm font-black text-slate-950">{title}</h3>
					{description && <p className="mt-1 text-xs font-semibold text-slate-500">{description}</p>}
				</div>
				{action && <div className="shrink-0">{action}</div>}
			</div>
			{isEmpty ? (
				<ReportEmptyState title={emptyTitle} message={emptyMessage} />
			) : (
				children
			)}
		</div>
	);
}
