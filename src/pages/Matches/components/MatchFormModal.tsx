import Modal from "../../../components/compositions/Modal";
import type { ClubTeam } from "../../../stores/match";
import { useClubTeamStore } from "../../../stores/clubTeams";

interface MatchFormModalProps {
	isOpen: boolean;
	isEditing: boolean;
	team: ClubTeam;
	opponent: string;
	date: string;
	venue: "home" | "away";
	error: string;
	onClose: () => void;
	onConfirm: () => void;
	onTeamChange: (value: ClubTeam) => void;
	onOpponentChange: (value: string) => void;
	onDateChange: (value: string) => void;
	onVenueChange: (value: "home" | "away") => void;
}

export function MatchFormModal({
	isOpen,
	isEditing,
	team,
	opponent,
	date,
	venue,
	error,
	onClose,
	onConfirm,
	onTeamChange,
	onOpponentChange,
	onDateChange,
	onVenueChange,
}: MatchFormModalProps) {
	const profiles = useClubTeamStore((state) => state.profiles);
	const selectableProfiles = profiles.filter((profile) => profile.isActive || profile.id === team);

	return (
		<Modal
			isOpen={isOpen}
			title={isEditing ? "Edit match" : "Add match"}
			confirmText={isEditing ? "Save Changes" : "Add Match"}
			onClose={onClose}
			onConfirm={onConfirm}
		>
			<div className="space-y-4">
				{error && (
					<div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
						{error}
					</div>
				)}

				<label className="block space-y-1">
					<span className="text-sm font-semibold text-slate-700">
						Team
					</span>

					<select
						value={team}
						onChange={(event) => onTeamChange(event.target.value as ClubTeam)}
						className="w-full rounded-lg border px-3 py-2"
					>
						{selectableProfiles.map((profile) => (
							<option key={profile.id} value={profile.id}>{profile.displayName}</option>
						))}
					</select>
				</label>

				<label className="block space-y-1">
					<span className="text-sm font-semibold text-slate-700">
						Opponent
					</span>

					<input
						value={opponent}
						onChange={(event) => onOpponentChange(event.target.value)}
						className="w-full rounded-lg border px-3 py-2"
						placeholder="e.g. Murton"
					/>
				</label>

				<label className="block space-y-1">
					<span className="text-sm font-semibold text-slate-700">
						Date and time
					</span>

					<input
						type="datetime-local"
						value={date}
						onChange={(event) => onDateChange(event.target.value)}
						className="w-full rounded-lg border px-3 py-2"
					/>
				</label>

				<label className="block space-y-1">
					<span className="text-sm font-semibold text-slate-700">
						Venue
					</span>

					<select
						value={venue}
						onChange={(event) =>
							onVenueChange(event.target.value as "home" | "away")
						}
						className="w-full rounded-lg border px-3 py-2"
					>
						<option value="home">Home</option>
						<option value="away">Away</option>
					</select>
				</label>

				{isEditing && (
					<p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
						Completed matches cannot be edited.
					</p>
				)}
			</div>
		</Modal>
	);
}
