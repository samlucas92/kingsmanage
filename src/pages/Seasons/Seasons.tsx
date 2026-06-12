import { useEffect, useMemo, useState, type SyntheticEvent } from "react";
import { useSeasonStore } from "../../stores/seasons";
import { usePlayerStore } from "../../stores/players";
import { useFinanceStore } from "../../stores/finance";
import StatusBadge from "../../components/compositions/StatusBadge";
import { formatDisplayDate } from "../../utils/date";
import { formatCurrency } from "../../utils/format";

export default function Seasons() {
	const players = usePlayerStore((state) => state.players);
	const isLoadingPlayers = usePlayerStore((state) => state.isLoadingPlayers);
	const playerLoadError = usePlayerStore((state) => state.playerLoadError);
	const loadPlayers = usePlayerStore((state) => state.loadPlayers);
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

	useEffect(() => {
		void loadPlayers();
	}, [loadPlayers]);

	const sortedSeasons = useMemo(() => {
		return [...seasons].sort(
			(firstSeason, secondSeason) =>
				new Date(secondSeason.startDate).getTime() -
				new Date(firstSeason.startDate).getTime()
		);
	}, [seasons]);

	const activeSeason = seasons.find((season) => season.id === activeSeasonId);
	const activePlayers = players.filter((player) => player.isActive);

	async function handleSubmit(event: SyntheticEvent) {
		event.preventDefault();

		if (isSavingSeason) {
			return;
		}

		const validationError = validateSeasonForm(name, startDate, endDate);

		if (validationError) {
			setFormError(validationError);
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
				error instanceof Error ? error.message : "Season could not be created."
			);
		} finally {
			setIsSavingSeason(false);
		}
	}

	async function handleSeasonSetup(event: SyntheticEvent) {
		event.preventDefault();

		if (isRunningSetup) {
			return;
		}

		const validationError = validateSeasonForm(
			setupName,
			setupStartDate,
			setupEndDate
		);

		if (validationError) {
			setSetupError(validationError);
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
				normaliseSeasonName(season.name) === normaliseSeasonName(trimmedSetupName)
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
			setFormError("");
			await setActiveSeason(seasonId);
		} catch (error) {
			setFormError(
				error instanceof Error ? error.message : "Could not set active season."
			);
		}
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-slate-900">Seasons</h1>
				<p className="mt-1 text-sm text-slate-600">
					Create and manage club seasons. The active season controls which
					matches, stats and finance records are shown by default.
				</p>
			</div>

			{seasonLoadError && (
				<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<span>{seasonLoadError}</span>
						<button
							type="button"
							onClick={() => void loadSeasons(true)}
							className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100"
						>
							Retry
						</button>
					</div>
				</div>
			)}

			{playerLoadError && (
				<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 shadow-sm">
					{playerLoadError}
				</div>
			)}

			{isLoadingSeasons && seasons.length === 0 && (
				<div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-600 shadow-sm">
					Loading seasons...
				</div>
			)}

			<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
							Current active season
						</p>
						<h2 className="mt-1 text-xl font-bold text-slate-900">
							{activeSeason?.name ?? "No active season"}
						</h2>
						{activeSeason && (
							<p className="mt-1 text-sm text-slate-600">
								{formatDisplayDate(activeSeason.startDate)} to{" "}
								{formatDisplayDate(activeSeason.endDate)}
							</p>
						)}
					</div>

					{activeSeason && <StatusBadge label="Active" tone="success" />}
				</div>
			</section>

			<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="mb-4">
					<h2 className="text-lg font-bold text-slate-900">Set up next season</h2>
					<p className="mt-1 text-sm text-slate-600">
						Use this when you are ready to start a new season. It creates the
						season, can make it active, and can set the same starting finance
						amount for all active players.
					</p>
					<p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
						{isLoadingPlayers ? "Loading players..." : `${activePlayers.length} active players`}
					</p>
				</div>

				{setupError && (
					<div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
						{setupError}
					</div>
				)}

				<form onSubmit={handleSeasonSetup} className="space-y-4">
					<div className="grid gap-4 md:grid-cols-3">
						<TextInput
							label="Season name"
							value={setupName}
							onChange={setSetupName}
						/>
						<TextInput
							label="Start date"
							type="date"
							value={setupStartDate}
							onChange={setSetupStartDate}
						/>
						<TextInput
							label="End date"
							type="date"
							value={setupEndDate}
							onChange={setSetupEndDate}
						/>
					</div>

					<label className="flex items-center gap-2 text-sm font-medium text-slate-700">
						<input
							type="checkbox"
							checked={setupMakeActive}
							onChange={(event) => setSetupMakeActive(event.target.checked)}
						/>
						Make this the active season
					</label>

					<div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-end">
						<label className="flex items-center gap-2 text-sm font-medium text-slate-700">
							<input
								type="checkbox"
								checked={setupSetFinance}
								onChange={(event) =>
									setSetupSetFinance(event.target.checked)
								}
							/>
							Set starting finance amount
						</label>

						<TextInput
							label="Amount owed"
							type="number"
							value={setupFinanceAmount}
							onChange={setSetupFinanceAmount}
							disabled={!setupSetFinance}
							placeholder="0"
						/>
					</div>

					<button
						type="submit"
						disabled={isRunningSetup || isLoadingSeasons || isLoadingPlayers}
						className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
					>
						{isRunningSetup ? "Running..." : "Run Season Setup"}
					</button>
				</form>
			</section>

			<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="mb-4">
					<h2 className="text-lg font-bold text-slate-900">Add season</h2>
					<p className="mt-1 text-sm text-slate-600">
						Create a season manually without running the rollover helper.
					</p>
				</div>

				{formError && (
					<div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
						{formError}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid gap-4 md:grid-cols-3">
						<TextInput label="Season name" value={name} onChange={setName} />
						<TextInput
							label="Start date"
							type="date"
							value={startDate}
							onChange={setStartDate}
						/>
						<TextInput
							label="End date"
							type="date"
							value={endDate}
							onChange={setEndDate}
						/>
					</div>

					<label className="flex items-center gap-2 text-sm font-medium text-slate-700">
						<input
							type="checkbox"
							checked={activateImmediately}
							onChange={(event) =>
								setActivateImmediately(event.target.checked)
							}
						/>
						Make active
					</label>

					<button
						type="submit"
						disabled={isSavingSeason || isLoadingSeasons}
						className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
					>
						{isSavingSeason ? "Saving..." : "Add Season"}
					</button>
				</form>
			</section>

			<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="mb-4">
					<h2 className="text-lg font-bold text-slate-900">Season history</h2>
					<p className="mt-1 text-sm text-slate-600">
						Switching season changes the default season used across the app.
					</p>
				</div>

				<div className="space-y-3">
					{sortedSeasons.length === 0 && !isLoadingSeasons ? (
						<div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
							No seasons found. Add a season or run the setup helper to get started.
						</div>
					) : null}

					{sortedSeasons.map((season) => {
						const isActive = season.id === activeSeasonId;

						return (
							<div
								key={season.id}
								className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
							>
								<div>
									<div className="flex items-center gap-2">
										<h3 className="font-semibold text-slate-900">
											{season.name}
										</h3>
										{isActive && <StatusBadge label="Active" tone="success" />}
									</div>
									<p className="mt-1 text-sm text-slate-600">
										{formatDisplayDate(season.startDate)} -{" "}
										{formatDisplayDate(season.endDate)}
									</p>
								</div>

								<button
									type="button"
									disabled={isActive || isSavingSeason || isRunningSetup}
									onClick={() => void handleSetActiveSeason(season.id)}
									className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
								>
									{isActive ? "Selected" : "Set active"}
								</button>
							</div>
						);
					})}
				</div>
			</section>
		</div>
	);
}

function TextInput({
	label,
	type = "text",
	value,
	onChange,
	disabled,
	placeholder,
}: {
	label: string;
	type?: string;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	placeholder?: string;
}) {
	return (
		<label className="block">
			<span className="mb-1 block text-sm font-semibold text-slate-700">
				{label}
			</span>
			<input
				type={type}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				disabled={disabled}
				placeholder={placeholder}
				className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
			/>
		</label>
	);
}

function validateSeasonForm(name: string, startDate: string, endDate: string) {
	if (!name.trim()) {
		return "Season name is required.";
	}

	if (!startDate) {
		return "Start date is required.";
	}

	if (!endDate) {
		return "End date is required.";
	}

	if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
		return "Start date must be before the end date.";
	}

	return "";
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
