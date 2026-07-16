type ReportEmptyStateProps = {
	title: string;
	message: string;
};

export default function ReportEmptyState({ title, message }: ReportEmptyStateProps) {
	return (
		<div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
			<p className="text-sm font-black text-slate-800">{title}</p>
			<p className="mt-1 text-sm font-medium text-slate-500">{message}</p>
		</div>
	);
}
