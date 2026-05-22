import Modal from "../../../../components/compositions/Modal";

interface ResultModalProps {
	isOpen: boolean;
	homeTeamName: string;
	awayTeamName: string;
	homeGoals: number;
	awayGoals: number;
	resultPreview: "Won" | "Lost" | "Draw";
	onClose: () => void;
	onConfirm: () => void;
	onUpdateHomeGoals: (value: string) => void;
	onUpdateAwayGoals: (value: string) => void;
}

export function ResultModal({
	isOpen,
	homeTeamName,
	awayTeamName,
	homeGoals,
	awayGoals,
	resultPreview,
	onClose,
	onConfirm,
	onUpdateHomeGoals,
	onUpdateAwayGoals,
}: ResultModalProps) {
	return (
		<Modal
			isOpen={isOpen}
			title="Confirm match result"
			confirmText="Save Result"
			onClose={onClose}
			onConfirm={onConfirm}
		>
			<div className="space-y-4">
				<div className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
					Once saved, this match will be marked as completed and the result
					will be locked.
				</div>

				<div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
					<label className="space-y-1">
						<span className="block text-sm font-semibold text-slate-700">
							{homeTeamName}
						</span>

						<input
							type="number"
							min={0}
							value={homeGoals}
							onChange={(event) => onUpdateHomeGoals(event.target.value)}
							className="w-full rounded-lg border px-3 py-2 text-center text-lg font-bold"
						/>
					</label>

					<span className="pb-2 text-lg font-bold text-slate-500">-</span>

					<label className="space-y-1">
						<span className="block text-right text-sm font-semibold text-slate-700">
							{awayTeamName}
						</span>

						<input
							type="number"
							min={0}
							value={awayGoals}
							onChange={(event) => onUpdateAwayGoals(event.target.value)}
							className="w-full rounded-lg border px-3 py-2 text-center text-lg font-bold"
						/>
					</label>
				</div>

				<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
					<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
						Outcome preview
					</p>

					<p
						className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-bold ${
							resultPreview === "Won"
								? "bg-green-100 text-green-800"
								: resultPreview === "Lost"
									? "bg-red-100 text-red-800"
									: "bg-slate-200 text-slate-700"
						}`}
					>
						{resultPreview}
					</p>
				</div>
			</div>
		</Modal>
	);
}