import Modal from "../../../components/compositions/Modal";

interface MatchFormModalProps {
	isOpen: boolean;
	isEditing: boolean;
	opponent: string;
	date: string;
	venue: "home" | "away";
	error: string;
	onClose: () => void;
	onConfirm: () => void;
	onOpponentChange: (value: string) => void;
	onDateChange: (value: string) => void;
	onVenueChange: (value: "home" | "away") => void;
}

export function MatchFormModal({
	isOpen,
	isEditing,
	opponent,
	date,
	venue,
	error,
	onClose,
	onConfirm,
	onOpponentChange,
	onDateChange,
	onVenueChange,
}: MatchFormModalProps) {
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