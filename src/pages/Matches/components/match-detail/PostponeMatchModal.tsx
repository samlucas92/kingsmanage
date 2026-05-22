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
					Choose the new date and time for this fixture.
				</p>

				<input
					type="datetime-local"
					value={newDate}
					onChange={(event) => onUpdateNewDate(event.target.value)}
					className="w-full rounded-lg border px-3 py-2"
				/>
			</div>
		</Modal>
	);
}