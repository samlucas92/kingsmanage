export default function DevToolsCard() {
	const isDevelopment = import.meta.env.DEV;

	if (!isDevelopment) {
		return null;
	}

	function handleResetLocalData() {
		const confirmed = window.confirm(
			"Reset all local Kingsbridge Colts app data? This will clear persisted players, matches, lineups, notes and results."
		);

		if (!confirmed) {
			return;
		}

		localStorage.removeItem("kingsbridge-colts-player-store");
		localStorage.removeItem("kingsbridge-colts-match-store");

		window.location.reload();
	}

	return (
		<section className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h2 className="text-lg font-bold text-amber-900">Dev tools</h2>

					<p className="mt-1 text-sm text-amber-800">
						Reset persisted local data while building the app.
					</p>
				</div>

				<button
					type="button"
					onClick={handleResetLocalData}
					className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
				>
					Reset local data
				</button>
			</div>
		</section>
	);
}