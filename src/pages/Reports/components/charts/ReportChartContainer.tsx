import type { ReactNode } from "react";
import ReportEmptyState from "../ReportEmptyState";

type ReportChartContainerProps = {
	title: string;
	description?: string;
	isEmpty?: boolean;
	emptyTitle?: string;
	emptyMessage?: string;
	children: ReactNode;
};

export default function ReportChartContainer({
	title,
	description,
	isEmpty,
	emptyTitle = "No chart data",
	emptyMessage = "There is not enough data for this chart yet.",
	children,
}: ReportChartContainerProps) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
			<div className="mb-4">
				<h3 className="text-sm font-black text-slate-950">{title}</h3>
				{description && <p className="mt-1 text-xs font-semibold text-slate-500">{description}</p>}
			</div>
			{isEmpty ? (
				<ReportEmptyState title={emptyTitle} message={emptyMessage} />
			) : (
				children
			)}
		</div>
	);
}
