import Modal from "../../../../components/compositions/Modal";

interface PostponeMatchModalProps {
	isOpen: boolean;
	newDate: string;
	onClose: () => void;
	onConfirm: () => void;
	onUpdateNewDate: (value: string) => void;
}

export function PostponeMatchModal({
	isOpen,
	newDate,
	onClose,
	onConfirm,
	onUpdateNewDate,
}: PostponeMatchModalProps) {
	return (
		<Modal
			isOpen={isOpen}
			title="Postpone match"
			confirmText="Postpone"
			onClose={onClose}
			onConfirm={onConfirm}
		>
			<div className="space-y-3">
				<p className="text-sm text-slate-600">
					Mark this fixture as postponed. Add a new date and time only if
					they are already known.
				</p>

				<label className="block text-sm font-semibold text-slate-700">
					New date and time <span className="font-normal text-slate-500">(optional)</span>
					<input
						type="datetime-local"
						value={newDate}
						onChange={(event) => onUpdateNewDate(event.target.value)}
						className="mt-1.5 w-full rounded-lg border px-3 py-2"
					/>
				</label>
			</div>
		</Modal>
	);
}
