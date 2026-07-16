type ReportMetricCardProps = {
	label: string;
	value: string | number;
	helper?: string;
	tone?: "default" | "success" | "warning" | "danger";
};

export default function ReportMetricCard({
	label,
	value,
	helper,
	tone = "default",
}: ReportMetricCardProps) {
	const valueClass =
		tone === "success"
			? "text-yepset-700"
			: tone === "warning"
				? "text-amber-600"
				: tone === "danger"
					? "text-red-700"
					: "text-slate-950";

	return (
		<div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
			<p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p>
			<p className={`mt-1 text-xl font-black tracking-[-.03em] ${valueClass}`}>{value}</p>
			{helper && <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>}
		</div>
	);
}
