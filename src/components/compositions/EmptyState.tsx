import type { ReactNode } from "react";

interface EmptyStateProps {
	title: string;
	message: string;
	action?: ReactNode;
}

export default function EmptyState({
	title,
	message,
	action,
}: EmptyStateProps) {
	return (
		<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-7 text-center">
			<div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-yepset-100 text-yepset-700 ring-1 ring-yepset-200">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" aria-hidden="true">
					<path d="M5 7h14v12H5zM8 4h8v3M9 11h6m-6 4h4" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</div>

			<h3 className="mt-3 text-sm font-bold text-slate-900">{title}</h3>

			<p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
				{message}
			</p>

			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}
