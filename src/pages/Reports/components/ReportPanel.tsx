import type { ReactNode } from "react";

type ReportPanelProps = {
	title: string;
	description?: string;
	action?: ReactNode;
	children: ReactNode;
	className?: string;
};

export default function ReportPanel({
	title,
	description,
	action,
	children,
	className = "",
}: ReportPanelProps) {
	return (
		<section className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
			<div className="mb-4 flex items-start justify-between gap-3">
				<div className="min-w-0">
					<h2 className="text-base font-black text-slate-950">{title}</h2>
					{description && <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>}
				</div>
				{action}
			</div>
			{children}
		</section>
	);
}
