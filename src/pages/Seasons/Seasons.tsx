import { useMemo, useState, type SyntheticEvent } from "react";
import { useSeasonStore } from "../../stores/seasons";
import { formatDisplayDate } from "../../utils/date";

export default function Seasons() {
	const seasons = useSeasonStore((state) => state.seasons);
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const setActiveSeason = useSeasonStore((state) => state.setActiveSeason);
	const addSeason = useSeasonStore((state) => state.addSeason);

	const [name, setName] = useState("2026-2027");
	const [startDate, setStartDate] = useState("2026-07-01");
	const [endDate, setEndDate] = useState("2027-06-30");
	const [activateImmediately, setActivateImmediately] = useState(false);
	const [formError, setFormError] = useState("");

	const sortedSeasons = useMemo(() => {
		return [...seasons].sort(
			(firstSeason, secondSeason) =>
				new Date(secondSeason.startDate).getTime() -
				new Date(firstSeason.startDate).getTime()
		);
	}, [seasons]);

	const activeSeason = seasons.find((season) => season.id === activeSeasonId);

	function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!name.trim()) {
			setFormError("Season name is required.");
			return;
		}

		if (!startDate) {
			setFormError("Start date is required.");
			return;
		}

		if (!endDate) {
			setFormError("End date is required.");
			return;
		}

		if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
			setFormError("Start date must be before the end date.");
			return;
		}

		const newSeasonId = addSeason({
			name,
			startDate,
			endDate,
		});

		if (!newSeasonId) {
			setFormError("That season already exists, or the name is invalid.");
			return;
		}

		if (activateImmediately) {
			setActiveSeason(newSeasonId);
		}

		setFormError("");
		setName("");
		setStartDate("");
		setEndDate("");
		setActivateImmediately(false);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-blue-900">Seasons</h1>

				<p className="text-gray-600">
					Create and manage club seasons. The active season controls which
					matches, stats and finance records are shown by default.
				</p>
			</div>

			<section className="rounded-xl bg-white p-6 shadow">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-xs font-bold uppercase tracking-wide text-slate-500">
							Current active season
						</p>

						<h2 className="mt-1 text-xl font-bold text-slate-900">
							{activeSeason?.name ?? "No active season"}
						</h2>

						{activeSeason && (
							<p className="mt-1 text-sm text-slate-500">
								{formatDisplayDate(activeSeason.startDate)} to{" "}
								{formatDisplayDate(activeSeason.endDate)}
							</p>
						)}
					</div>

					<span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-900">
						Used by Matches
					</span>
				</div>
			</section>

			<div className="grid gap-6 xl:grid-cols-[380px_1fr]">
				<section className="rounded-xl bg-white p-6 shadow">
					<h2 className="text-lg font-bold text-blue-900">Add season</h2>

					<p className="mt-1 text-sm text-slate-500">
						Create the next season when you are ready to start fresh fixtures
						and seasonal reporting.
					</p>

					<form onSubmit={handleSubmit} className="mt-5 space-y-4">
						{formError && (
							<div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
								{formError}
							</div>
						)}

						<label className="block">
							<span className="mb-1 block text-sm font-semibold text-slate-700">
								Season name
							</span>

							<input
								value={name}
								onChange={(event) => {
									setName(event.target.value);
									setFormError("");
								}}
								className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
								placeholder="e.g. 2026-2027"
							/>
						</label>

						<label className="block">
							<span className="mb-1 block text-sm font-semibold text-slate-700">
								Start date
							</span>

							<input
								type="date"
								value={startDate}
								onChange={(event) => {
									setStartDate(event.target.value);
									setFormError("");
								}}
								className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
							/>
						</label>

						<label className="block">
							<span className="mb-1 block text-sm font-semibold text-slate-700">
								End date
							</span>

							<input
								type="date"
								value={endDate}
								onChange={(event) => {
									setEndDate(event.target.value);
									setFormError("");
								}}
								className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
							/>
						</label>

						<label className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
							<input
								type="checkbox"
								checked={activateImmediately}
								onChange={(event) =>
									setActivateImmediately(event.target.checked)
								}
							/>
							Make this the active season now
						</label>

						<button
							type="submit"
							className="w-full rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
						>
							Add Season
						</button>
					</form>
				</section>

				<section className="rounded-xl bg-white p-6 shadow">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h2 className="text-lg font-bold text-blue-900">
								Season history
							</h2>

							<p className="mt-1 text-sm text-slate-500">
								Switching season changes the default season used across the app.
							</p>
						</div>

						<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
							{seasons.length} {seasons.length === 1 ? "season" : "seasons"}
						</span>
					</div>

					<div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
						<table className="w-full text-sm">
							<thead className="bg-slate-50 text-left">
								<tr>
									<th className="p-3 font-semibold text-slate-600">Season</th>
									<th className="p-3 font-semibold text-slate-600">Dates</th>
									<th className="p-3 font-semibold text-slate-600">Status</th>
									<th className="p-3 text-right font-semibold text-slate-600">
										Action
									</th>
								</tr>
							</thead>

							<tbody>
								{sortedSeasons.map((season) => {
									const isActive = season.id === activeSeasonId;

									return (
										<tr key={season.id} className="border-t border-slate-100">
											<td className="p-3 font-semibold text-slate-900">
												{season.name}
											</td>

											<td className="p-3 text-slate-600">
												{formatDisplayDate(season.startDate)} -{" "}
												{formatDisplayDate(season.endDate)}
											</td>

											<td className="p-3">
												{isActive ? (
													<span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-800">
														Active
													</span>
												) : (
													<span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
														Historical
													</span>
												)}
											</td>

											<td className="p-3 text-right">
												<button
													type="button"
													disabled={isActive}
													onClick={() => setActiveSeason(season.id)}
													className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
												>
													{isActive ? "Selected" : "Set active"}
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</section>
			</div>
		</div>
	);
}