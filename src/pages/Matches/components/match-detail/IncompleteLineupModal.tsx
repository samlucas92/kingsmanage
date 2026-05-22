import Modal from "../../../../components/compositions/Modal";

interface IncompleteLineupModalProps {
	isOpen: boolean;
	starterCount: number;
	onClose: () => void;
	onConfirm: () => void;
}

export function IncompleteLineupModal({
	isOpen,
	starterCount,
	onClose,
	onConfirm,
}: IncompleteLineupModalProps) {
	return (
		<Modal
			isOpen={isOpen}
			title="Save incomplete team?"
			message={`You only have ${starterCount} starter${
				starterCount === 1 ? "" : "s"
			} selected. A full starting lineup usually needs 11 players. Do you want to save anyway?`}
			confirmText="Save anyway"
			onClose={onClose}
			onConfirm={onConfirm}
		/>
	);
}