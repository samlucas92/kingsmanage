type ReportMobileRankedListItem = {
	id: string;
	label: string;
	value: number | string;
	helper?: string;
};

export default function ReportMobileRankedList({
	title,
	items,
	emptyMessage = "No data yet.",
}: {
	title?: string;
	items: ReportMobileRankedListItem[];
	emptyMessage?: string;
}) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-white">
			{title && (
				<div className="border-b border-slate-100 px-4 py-3">
					<h4 className="text-xs font-black uppercase tracking-wide text-slate-500">{title}</h4>
				</div>
			)}
			{items.length === 0 ? (
				<p className="px-4 py-3 text-sm font-semibold text-slate-500">{emptyMessage}</p>
			) : (
				<div className="divide-y divide-slate-100">
					{items.map((item, index) => (
						<div key={item.id} className="flex items-center gap-3 px-4 py-3">
							<span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-500">
								{index + 1}
							</span>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-black text-slate-950">{item.label}</p>
								{item.helper && <p className="text-xs font-semibold text-slate-500">{item.helper}</p>}
							</div>
							<span className="shrink-0 text-sm font-black text-yepset-700">{item.value}</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
