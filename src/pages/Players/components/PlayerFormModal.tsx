import Modal from "../../../components/compositions/Modal";
import { PLAYER_POSITIONS } from "../../../constants/positions";
import type { PlayerFormState } from "../hooks/usePlayerForm";

interface PlayerFormModalProps {
	isOpen: boolean;
	isEditing: boolean;
	isSaving: boolean;
	playerForm: PlayerFormState;
	formError: string;
	onClose: () => void;
	onConfirm: () => Promise<void>;
	onUpdatePlayerForm: (
		field: keyof PlayerFormState,
		value: string | boolean
	) => void;
	onTogglePosition: (position: string) => void;
}

export function PlayerFormModal({
	isOpen,
	isEditing,
	isSaving,
	playerForm,
	formError,
	onClose,
	onConfirm,
	onUpdatePlayerForm,
	onTogglePosition,
}: PlayerFormModalProps) {
	return (
		<Modal
			isOpen={isOpen}
			title={isEditing ? "Edit player" : "Add player"}
			confirmText={
				isSaving
					? "Saving..."
					: isEditing
						? "Save Changes"
						: "Add Player"
			}
			onClose={onClose}
			onConfirm={onConfirm}
		>
			<div className="space-y-4">
				{formError && (
					<div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
						{formError}
					</div>
				)}

				{isSaving && (
					<div className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
						Saving player...
					</div>
				)}

				<label className="block space-y-1">
					<span className="text-sm font-semibold text-slate-700">
						Name
					</span>

					<input
						value={playerForm.name}
						disabled={isSaving}
						onChange={(event) =>
							onUpdatePlayerForm("name", event.target.value)
						}
						className="w-full rounded-lg border px-3 py-2 disabled:bg-slate-100"
						placeholder="Player name"
					/>
				</label>

				<div className="grid grid-cols-2 gap-3">
					<label className="block space-y-1">
						<span className="text-sm font-semibold text-slate-700">
							Shirt number
						</span>

						<input
							type="number"
							min={1}
							value={playerForm.number}
							disabled={isSaving}
							onChange={(event) =>
								onUpdatePlayerForm("number", event.target.value)
							}
							className="w-full rounded-lg border px-3 py-2 disabled:bg-slate-100"
						/>
					</label>

					<label className="block space-y-1">
						<span className="text-sm font-semibold text-slate-700">
							Appearances
						</span>

						<input
							type="number"
							min={0}
							value={playerForm.appearances}
							disabled={isSaving}
							onChange={(event) =>
								onUpdatePlayerForm("appearances", event.target.value)
							}
							className="w-full rounded-lg border px-3 py-2 disabled:bg-slate-100"
						/>
					</label>
				</div>

				<div className="space-y-2">
					<p className="text-sm font-semibold text-slate-700">
						Positions
					</p>

					<div className="flex flex-wrap gap-2">
						{PLAYER_POSITIONS.map((position) => {
							const selected = playerForm.positions.includes(position);

							return (
								<button
									key={position}
									type="button"
									disabled={isSaving}
									onClick={() => onTogglePosition(position)}
									className={`rounded-full border px-3 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
										selected
											? "border-blue-700 bg-blue-700 text-white"
											: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
									}`}
								>
									{position}
								</button>
							);
						})}
					</div>
				</div>

				<label className="flex items-center gap-2 text-sm font-medium text-slate-700">
					<input
						type="checkbox"
						checked={playerForm.isActive}
						disabled={isSaving}
						onChange={(event) =>
							onUpdatePlayerForm("isActive", event.target.checked)
						}
					/>
					Player is active
				</label>
			</div>
		</Modal>
	);
}