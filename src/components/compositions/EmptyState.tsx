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
		<div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
			<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow-sm">
				–
			</div>

			<h3 className="mt-3 text-sm font-bold text-slate-900">{title}</h3>

			<p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
				{message}
			</p>

			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}