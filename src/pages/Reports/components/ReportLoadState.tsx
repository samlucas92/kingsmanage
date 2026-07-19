export default function ReportLoadState({
	isLoading,
	error,
	loadingMessage = "Loading report data...",
}: {
	isLoading: boolean;
	error?: string;
	loadingMessage?: string;
}) {
	return (
		<>
			{error && (
				<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
					{error}
				</div>
			)}
			{isLoading && (
				<div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-500">
					{loadingMessage}
				</div>
			)}
		</>
	);
}
