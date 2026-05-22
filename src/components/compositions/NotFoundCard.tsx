import type { ReactNode } from "react";

interface NotFoundCardProps {
	title: string;
	message: string;
	action?: ReactNode;
}

export default function NotFoundCard({
	title,
	message,
	action,
}: NotFoundCardProps) {
	return (
		<div className="rounded-xl bg-white p-6 shadow">
			<div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
						Not found
					</p>

					<h1 className="mt-1 text-2xl font-bold text-blue-900">
						{title}
					</h1>

					<p className="mt-2 max-w-xl text-sm text-slate-500">
						{message}
					</p>
				</div>

				{action}
			</div>
		</div>
	);
}