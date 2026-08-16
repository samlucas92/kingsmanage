import type { ReactNode } from "react";

export type ReportAnswerStat = {
	label: string;
	value: ReactNode;
	tone?: "default" | "success" | "warning" | "danger";
};

export default function ReportAnswerCard({
	eyebrow,
	value,
	description,
	tone = "default",
	stats = [],
	children,
}: {
	eyebrow: string;
	value: ReactNode;
	description?: ReactNode;
	tone?: "default" | "success" | "warning" | "danger";
	stats?: ReportAnswerStat[];
	children?: ReactNode;
}) {
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
			<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
				<div className="min-w-0">
					<p className="text-xs font-black uppercase tracking-[.12em] text-slate-500">{eyebrow}</p>
					<p className={`mt-1 text-3xl font-black tracking-[-.04em] sm:text-4xl ${getToneClass(tone)}`}>{value}</p>
					{description && <div className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">{description}</div>}
					{children && <div className="mt-4">{children}</div>}
				</div>
				{stats.length > 0 && (
					<div className={`grid gap-2 ${stats.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
						{stats.map((stat) => (
							<div key={stat.label} className="min-w-28 rounded-xl bg-slate-50 px-3 py-2.5">
								<p className={`text-lg font-black ${getToneClass(stat.tone ?? "default")}`}>{stat.value}</p>
								<p className="mt-0.5 text-[11px] font-bold text-slate-500">{stat.label}</p>
							</div>
						))}
					</div>
				)}
			</div>
		</section>
	);
}

function getToneClass(tone: "default" | "success" | "warning" | "danger") {
	if (tone === "success") return "text-yepset-700";
	if (tone === "warning") return "text-amber-600";
	if (tone === "danger") return "text-red-700";
	return "text-slate-950";
}
