export default function DashboardLoadingIssues({ loadErrors }: { loadErrors: string[] }) {
	if (loadErrors.length === 0) {
		return null;
	}

	return (
		<section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
			<h2 className="font-bold">Dashboard loading issues</h2>

			<ul className="mt-2 list-disc space-y-1 pl-5">
				{loadErrors.map((error) => (
					<li key={error}>{error}</li>
				))}
			</ul>
		</section>
	);
}
