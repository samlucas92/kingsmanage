import SeasonSelector from "../../../components/compositions/SeasonSelector";
import { useClubTeamStore } from "../../../stores/clubTeams";
import { useMatchStore } from "../../../stores/match";
import { usePlayerStore } from "../../../stores/players";
import { useReportsContext } from "../useReportsContext";

type ReportsFilterBarProps = {
	showTeamFilter?: boolean;
	showCompetitionFilter?: boolean;
	showVenueFilter?: boolean;
	showPlayerFilter?: boolean;
	showDateRangeFilter?: boolean;
	showFriendliesFilter?: boolean;
};

export default function ReportsFilterBar({
	showTeamFilter = true,
	showCompetitionFilter = false,
	showVenueFilter = false,
	showPlayerFilter = false,
	showDateRangeFilter = false,
	showFriendliesFilter = true,
}: ReportsFilterBarProps) {
	const clubTeams = useClubTeamStore((state) => state.profiles);
	const matches = useMatchStore((state) => state.matches);
	const players = usePlayerStore((state) => state.players);
	const {
		selectedSeasonId,
		setSelectedSeasonId,
		selectedTeamId,
		setSelectedTeamId,
		selectedCompetition,
		setSelectedCompetition,
		selectedVenue,
		setSelectedVenue,
		selectedPlayerId,
		setSelectedPlayerId,
		dateFrom,
		setDateFrom,
		dateTo,
		setDateTo,
		includeFriendlies,
		setIncludeFriendlies,
	} = useReportsContext();
	const competitionOptions = [...new Set(
		matches
			.filter((match) => {
				if (selectedSeasonId && match.seasonId !== selectedSeasonId) {
					return false;
				}

				return selectedTeamId === "all" || match.team === selectedTeamId;
			})
			.map((match) => match.competition?.trim() || "No competition")
	)].sort((firstCompetition, secondCompetition) =>
		firstCompetition.localeCompare(secondCompetition)
	);
	const activePlayers = players
		.filter((player) => player.isActive)
		.sort((firstPlayer, secondPlayer) => firstPlayer.name.localeCompare(secondPlayer.name));

	const filterControls = (
		<>
			<SeasonSelector
				label="Season"
				selectedSeasonId={selectedSeasonId}
				onSeasonChange={setSelectedSeasonId}
				showActiveLabel
				className="min-w-[10rem]"
				selectClassName="min-w-[10rem] rounded-xl border-slate-200 px-3 py-2 text-xs"
			/>

			{showTeamFilter && (
				<label className="flex min-w-[10rem] flex-col gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
					Team
					<select
						value={selectedTeamId}
						onChange={(event) => setSelectedTeamId(event.target.value)}
						className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold normal-case tracking-normal text-slate-800 shadow-sm outline-none transition focus:border-yepset-600 focus:ring-2 focus:ring-yepset-600/15"
					>
						<option value="all">Both teams</option>
						{clubTeams.map((team) => (
							<option key={team.id} value={team.id}>
								{team.displayName}
							</option>
						))}
					</select>
				</label>
			)}

			{showCompetitionFilter && (
				<label className="flex min-w-[11rem] flex-col gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
					Competition
					<select
						value={selectedCompetition}
						onChange={(event) => setSelectedCompetition(event.target.value)}
						className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold normal-case tracking-normal text-slate-800 shadow-sm outline-none transition focus:border-yepset-600 focus:ring-2 focus:ring-yepset-600/15"
					>
						<option value="all">All competitions</option>
						{competitionOptions.map((competition) => (
							<option key={competition} value={competition}>
								{competition}
							</option>
						))}
					</select>
				</label>
			)}

			{showVenueFilter && (
				<label className="flex min-w-[9rem] flex-col gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
					Venue
					<select
						value={selectedVenue}
						onChange={(event) => setSelectedVenue(event.target.value as typeof selectedVenue)}
						className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold normal-case tracking-normal text-slate-800 shadow-sm outline-none transition focus:border-yepset-600 focus:ring-2 focus:ring-yepset-600/15"
					>
						<option value="all">Home & away</option>
						<option value="home">Home</option>
						<option value="away">Away</option>
					</select>
				</label>
			)}

			{showPlayerFilter && (
				<label className="flex min-w-[11rem] flex-col gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
					Player
					<select
						value={selectedPlayerId}
						onChange={(event) => setSelectedPlayerId(event.target.value)}
						className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold normal-case tracking-normal text-slate-800 shadow-sm outline-none transition focus:border-yepset-600 focus:ring-2 focus:ring-yepset-600/15"
					>
						<option value="all">All players</option>
						{activePlayers.map((player) => (
							<option key={player.id} value={player.id}>
								{player.name}
							</option>
						))}
					</select>
				</label>
			)}

			{showDateRangeFilter && (
				<div className="flex flex-wrap items-end gap-2">
					<label className="flex min-w-[8.5rem] flex-col gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
						From
						<input
							type="date"
							value={dateFrom}
							onChange={(event) => setDateFrom(event.target.value)}
							className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold normal-case tracking-normal text-slate-800 shadow-sm outline-none transition focus:border-yepset-600 focus:ring-2 focus:ring-yepset-600/15"
						/>
					</label>
					<label className="flex min-w-[8.5rem] flex-col gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
						To
						<input
							type="date"
							value={dateTo}
							onChange={(event) => setDateTo(event.target.value)}
							className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold normal-case tracking-normal text-slate-800 shadow-sm outline-none transition focus:border-yepset-600 focus:ring-2 focus:ring-yepset-600/15"
						/>
					</label>
				</div>
			)}

			{showFriendliesFilter && (
				<label className="inline-flex min-h-[2.4rem] items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm">
					<span>Include friendlies</span>
					<input
						type="checkbox"
						checked={includeFriendlies}
						onChange={(event) => setIncludeFriendlies(event.target.checked)}
						className="h-4 w-4 rounded border-slate-300 text-yepset-700 focus:ring-yepset-600"
					/>
				</label>
			)}
		</>
	);

	return (
		<>
			<details className="w-full rounded-xl border border-slate-200 bg-white sm:hidden">
				<summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-black text-slate-700">Report filters</summary>
				<div className="flex flex-col items-stretch gap-2 border-t border-slate-100 p-3 [&>*]:min-w-0">{filterControls}</div>
			</details>
			<div className="hidden flex-wrap items-end gap-2 sm:flex">{filterControls}</div>
		</>
	);
}
