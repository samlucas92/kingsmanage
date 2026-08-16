import type { ReactNode } from "react";

export default function ReportDetails({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: ReactNode;
}) {
	return (
		<details className="rounded-2xl border border-slate-200 bg-white shadow-sm">
			<summary className="cursor-pointer list-none p-4 sm:p-5">
				<span className="flex items-center justify-between gap-3">
					<span>
						<span className="block text-base font-black text-slate-950">{title}</span>
						{description && <span className="mt-1 block text-sm font-medium text-slate-500">{description}</span>}
					</span>
					<span className="text-xl font-black text-slate-400">⌄</span>
				</span>
			</summary>
			<div className="border-t border-slate-100 p-4 sm:p-5">{children}</div>
		</details>
	);
}
