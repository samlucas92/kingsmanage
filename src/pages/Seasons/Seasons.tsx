import { useEffect, useMemo, useState, type SyntheticEvent } from "react";
import { useSeasonStore } from "../../stores/seasons";
import { usePlayerStore } from "../../stores/players";
import { useFinanceStore } from "../../stores/finance";
import DataTable from "../../components/compositions/DataTable";
import StatusBadge from "../../components/compositions/StatusBadge";
import { formatDisplayDate } from "../../utils/date";
import { formatCurrency } from "../../utils/format";

export default function Seasons() {
	const players = usePlayerStore((state) => state.players);
	const setPlayerAmountOwed = useFinanceStore(
		(state) => state.setPlayerAmountOwed
	);

	const seasons = useSeasonStore((state) => state.seasons);
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const isLoadingSeasons = useSeasonStore((state) => state.isLoadingSeasons);
	const seasonLoadError = useSeasonStore((state) => state.seasonLoadError);
	const loadSeasons = useSeasonStore((state) => state.loadSeasons);
	const setActiveSeason = useSeasonStore((state) => state.setActiveSeason);
	const addSeason = useSeasonStore((state) => state.addSeason);

	const [name, setName] = useState("2026-2027");
	const [startDate, setStartDate] = useState("2026-07-01");
	const [endDate, setEndDate] = useState("2027-06-30");
	const [activateImmediately, setActivateImmediately] = useState(false);
	const [formError, setFormError] = useState("");
	const [isSavingSeason, setIsSavingSeason] = useState(false);

	const [setupName, setSetupName] = useState("2026-2027");
	const [setupStartDate, setSetupStartDate] = useState("2026-07-01");
	const [setupEndDate, setSetupEndDate] = useState("2027-06-30");
	const [setupMakeActive, setSetupMakeActive] = useState(true);
	const [setupSetFinance, setSetupSetFinance] = useState(false);
	const [setupFinanceAmount, setSetupFinanceAmount] = useState("");
	const [setupError, setSetupError] = useState("");
	const [isRunningSetup, setIsRunningSetup] = useState(false);

	useEffect(() => {
		void loadSeasons();
	}, [loadSeasons]);

	const sortedSeasons = useMemo(() => {
		return [...seasons].sort(
			(firstSeason, secondSeason) =>
				new Date(secondSeason.startDate).getTime() -
				new Date(firstSeason.startDate).getTime()
		);
	}, [seasons]);

	const activeSeason = seasons.find((season) => season.id === activeSeasonId);
	const activePlayers = players.filter((player) => player.isActive);

	async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
		event.preventDefault();

		if (isSavingSeason) {
			return;
		}

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

		try {
			setIsSavingSeason(true);
			setFormError("");

			const newSeasonId = await addSeason(
				{
					name: name.trim(),
					startDate,
					endDate,
				},
				activateImmediately
			);

			if (!newSeasonId) {
				setFormError("That season already exists, or the name is invalid.");
				return;
			}

			setName("");
			setStartDate("");
			setEndDate("");
			setActivateImmediately(false);
		} catch (error) {
			setFormError(
				error instanceof Error
					? error.message
					: "Season could not be created."
			);
		} finally {
			setIsSavingSeason(false);
		}
	}

	async function handleSeasonSetup(event: SyntheticEvent<HTMLFormElement>) {
		event.preventDefault();

		if (isRunningSetup) {
			return;
		}

		if (!setupName.trim()) {
			setSetupError("Season name is required.");
			return;
		}

		if (!setupStartDate) {
			setSetupError("Start date is required.");
			return;
		}

		if (!setupEndDate) {
			setSetupError("End date is required.");
			return;
		}

		if (new Date(setupStartDate).getTime() > new Date(setupEndDate).getTime()) {
			setSetupError("Start date must be before the end date.");
			return;
		}

		const financeAmount = Number(setupFinanceAmount);

		if (
			setupSetFinance &&
			(!Number.isFinite(financeAmount) || financeAmount < 0)
		) {
			setSetupError("Finance amount must be 0 or above.");
			return;
		}

		const trimmedSetupName = setupName.trim();

		const existingSeason = seasons.find(
			(season) =>
				normaliseSeasonName(season.name) ===
				normaliseSeasonName(trimmedSetupName)
		);

		const confirmed = window.confirm(
			buildSetupConfirmationMessage({
				seasonName: trimmedSetupName,
				existingSeason: Boolean(existingSeason),
				makeActive: setupMakeActive,
				setFinance: setupSetFinance,
				financeAmount,
				activePlayerCount: activePlayers.length,
			})
		);

		if (!confirmed) {
			return;
		}

		try {
			setIsRunningSetup(true);
			setSetupError("");

			let seasonId = existingSeason?.id;

			if (!seasonId) {
				seasonId =
					(await addSeason(
						{
							name: trimmedSetupName,
							startDate: setupStartDate,
							endDate: setupEndDate,
						},
						setupMakeActive
					)) ?? undefined;
			}

			if (!seasonId) {
				setSetupError("Could not create that season.");
				return;
			}

			if (setupMakeActive && existingSeason) {
				await setActiveSeason(seasonId);
			}

			if (setupSetFinance) {
				activePlayers.forEach((player) => {
					setPlayerAmountOwed(player.id, financeAmount, seasonId);
				});
			}
		} catch (error) {
			setSetupError(
				error instanceof Error
					? error.message
					: "Season setup could not be completed."
			);
		} finally {
			setIsRunningSetup(false);
		}
	}

	async function handleSetActiveSeason(seasonId: string) {
		try {
			await setActiveSeason(seasonId);
		} catch (error) {
			setFormError(
				error instanceof Error
					? error.message
					: "Could not set active season."
			);
		}
	}

	return (
		<div className="w-full min-w-0 space-y-6 overflow-hidden">
			<div>
				<h1 className="text-2xl font-bold text-blue-900">Seasons</h1>

				<p className="text-gray-600">
					Create and manage club seasons. The active season controls which
					matches, stats and finance records are shown by default.
				</p>
			</div>

			{seasonLoadError && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
					{seasonLoadError}
				</div>
			)}

			{isLoadingSeasons && (
				<div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
					Loading seasons...
				</div>
			)}

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

					<StatusBadge label="Used by Matches, Stats and Finance" tone="warning" />
				</div>
			</section>

			<section className="rounded-xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<p className="text-xs font-bold uppercase tracking-wide text-blue-700">
							Season rollover helper
						</p>

						<h2 className="mt-1 text-xl font-bold text-blue-950">
							Set up next season
						</h2>

						<p className="mt-1 max-w-3xl text-sm text-blue-800">
							Use this when you are ready to start a new season. It creates the
							season, can make it active, and can set the same starting finance
							amount for all active players.
						</p>
					</div>

					<span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-800">
						{activePlayers.length} active players
					</span>
				</div>

				<form
					onSubmit={handleSeasonSetup}
					className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr_1fr]"
				>
					{setupError && (
						<div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 xl:col-span-3">
							{setupError}
						</div>
					)}

					{isRunningSetup && (
						<div className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-800 xl:col-span-3">
							Running season setup...
						</div>
					)}

					<label className="block">
						<span className="mb-1 block text-sm font-semibold text-blue-900">
							Season name
						</span>

						<input
							value={setupName}
							disabled={isRunningSetup}
							onChange={(event) => {
								setSetupName(event.target.value);
								setSetupError("");
							}}
							className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm disabled:bg-blue-100 disabled:text-blue-400"
							placeholder="e.g. 2026-2027"
						/>
					</label>

					<label className="block">
						<span className="mb-1 block text-sm font-semibold text-blue-900">
							Start date
						</span>

						<input
							type="date"
							value={setupStartDate}
							disabled={isRunningSetup}
							onChange={(event) => {
								setSetupStartDate(event.target.value);
								setSetupError("");
							}}
							className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm disabled:bg-blue-100 disabled:text-blue-400"
						/>
					</label>

					<label className="block">
						<span className="mb-1 block text-sm font-semibold text-blue-900">
							End date
						</span>

						<input
							type="date"
							value={setupEndDate}
							disabled={isRunningSetup}
							onChange={(event) => {
								setSetupEndDate(event.target.value);
								setSetupError("");
							}}
							className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm disabled:bg-blue-100 disabled:text-blue-400"
						/>
					</label>

					<label className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-blue-900">
						<input
							type="checkbox"
							checked={setupMakeActive}
							disabled={isRunningSetup}
							onChange={(event) => setSetupMakeActive(event.target.checked)}
						/>
						Make this the active season
					</label>

					<label className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-blue-900">
						<input
							type="checkbox"
							checked={setupSetFinance}
							disabled={isRunningSetup}
							onChange={(event) => setSetupSetFinance(event.target.checked)}
						/>
						Set starting finance amount
					</label>

					<label className="block">
						<span className="mb-1 block text-sm font-semibold text-blue-900">
							Finance amount
						</span>

						<input
							type="number"
							min={0}
							step="0.01"
							value={setupFinanceAmount}
							onChange={(event) => {
								setSetupFinanceAmount(event.target.value);
								setSetupError("");
							}}
							disabled={!setupSetFinance || isRunningSetup}
							className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm disabled:bg-blue-100 disabled:text-blue-400"
							placeholder="0.00"
						/>
					</label>

					<div className="rounded-lg bg-white p-4 text-sm text-blue-900 xl:col-span-2">
						<p className="font-bold">What this will do</p>

						<ul className="mt-2 list-disc space-y-1 pl-5">
							<li>Create the season if it does not already exist.</li>
							<li>
								{setupMakeActive
									? "Switch the app to this season."
									: "Leave the current active season unchanged."}
							</li>
							<li>
								{setupSetFinance
									? `Set the finance amount for ${activePlayers.length} active players.`
									: "Leave finance records untouched."}
							</li>
							<li>Players remain global and are not copied or removed.</li>
						</ul>
					</div>

					<div className="flex items-end">
						<button
							type="submit"
							disabled={isRunningSetup}
							className="w-full rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-400"
						>
							{isRunningSetup ? "Running..." : "Run Season Setup"}
						</button>
					</div>
				</form>
			</section>

			<div className="grid min-w-0 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
				<section className="min-w-0 rounded-xl bg-white p-6 shadow">
					<h2 className="text-lg font-bold text-blue-900">Add season</h2>

					<p className="mt-1 text-sm text-slate-500">
						Create a season manually without running the rollover helper.
					</p>

					<form onSubmit={handleSubmit} className="mt-5 space-y-4">
						{formError && (
							<div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
								{formError}
							</div>
						)}

						{isSavingSeason && (
							<div className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
								Saving season...
							</div>
						)}

						<label className="block">
							<span className="mb-1 block text-sm font-semibold text-slate-700">
								Season name
							</span>

							<input
								value={name}
								disabled={isSavingSeason}
								onChange={(event) => {
									setName(event.target.value);
									setFormError("");
								}}
								className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
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
								disabled={isSavingSeason}
								onChange={(event) => {
									setStartDate(event.target.value);
									setFormError("");
								}}
								className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
							/>
						</label>

						<label className="block">
							<span className="mb-1 block text-sm font-semibold text-slate-700">
								End date
							</span>

							<input
								type="date"
								value={endDate}
								disabled={isSavingSeason}
								onChange={(event) => {
									setEndDate(event.target.value);
									setFormError("");
								}}
								className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
							/>
						</label>

						<label className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
							<input
								type="checkbox"
								checked={activateImmediately}
								disabled={isSavingSeason}
								onChange={(event) =>
									setActivateImmediately(event.target.checked)
								}
							/>
							Make this the active season now
						</label>

						<button
							type="submit"
							disabled={isSavingSeason}
							className="w-full rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-400"
						>
							{isSavingSeason ? "Saving..." : "Add Season"}
						</button>
					</form>
				</section>

				<section className="min-w-0 rounded-xl bg-white p-6 shadow">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h2 className="text-lg font-bold text-blue-900">
								Season history
							</h2>

							<p className="mt-1 text-sm text-slate-500">
								Switching season changes the default season used across the app.
							</p>
						</div>

						<StatusBadge
							label={`${seasons.length} ${
								seasons.length === 1 ? "season" : "seasons"
							}`}
							tone="neutral"
						/>
					</div>

					<div className="mt-5 min-w-0 overflow-hidden rounded-xl border border-slate-200">
						<DataTable
							empty={sortedSeasons.length === 0}
							emptyTitle="No seasons found"
							emptyMessage="Create your first season to start tracking matches, stats and finance by season."
							minWidthClassName="min-w-0"
							tableClassName="table-fixed"
						>
							<thead className="bg-slate-50 text-left">
								<tr>
									<th className="w-[22%] p-3 font-semibold text-slate-600">
										Season
									</th>
									<th className="w-[34%] p-3 font-semibold text-slate-600">
										Dates
									</th>
									<th className="w-[20%] p-3 font-semibold text-slate-600">
										Status
									</th>
									<th className="w-[24%] p-3 text-right font-semibold text-slate-600">
										Action
									</th>
								</tr>
							</thead>

							<tbody>
								{sortedSeasons.map((season) => {
									const isActive = season.id === activeSeasonId;

									return (
										<tr key={season.id} className="border-t border-slate-100">
											<td className="truncate p-3 font-semibold text-slate-900">
												{season.name}
											</td>

											<td className="truncate p-3 text-slate-600">
												{formatDisplayDate(season.startDate)} -{" "}
												{formatDisplayDate(season.endDate)}
											</td>

											<td className="p-3">
												<StatusBadge
													label={isActive ? "Active" : "Historical"}
													tone={isActive ? "success" : "neutral"}
												/>
											</td>

											<td className="p-3 text-right">
												<button
													type="button"
													disabled={isActive}
													onClick={() => {
														void handleSetActiveSeason(season.id);
													}}
													className="inline-flex rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
												>
													{isActive ? "Selected" : "Set active"}
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</DataTable>
					</div>
				</section>
			</div>
		</div>
	);
}

function normaliseSeasonName(name: string) {
	return name.trim().toLowerCase();
}

function buildSetupConfirmationMessage({
	seasonName,
	existingSeason,
	makeActive,
	setFinance,
	financeAmount,
	activePlayerCount,
}: {
	seasonName: string;
	existingSeason: boolean;
	makeActive: boolean;
	setFinance: boolean;
	financeAmount: number;
	activePlayerCount: number;
}) {
	const actions = [
		existingSeason
			? `Use existing season ${seasonName}.`
			: `Create season ${seasonName}.`,
		makeActive
			? "Make it the active season."
			: "Leave the current active season unchanged.",
		setFinance
			? `Set amount owed to ${formatCurrency(
					financeAmount
				)} for ${activePlayerCount} active players.`
			: "Do not change finance records.",
	];

	return `Run season setup?\n\n${actions.join("\n")}`;
}