import Modal from "../../../../components/compositions/Modal";
import StatusBadge from "../../../../components/compositions/StatusBadge";

interface ResultModalProps {
	isOpen: boolean;
	homeTeamName: string;
	awayTeamName: string;
	homeGoals: number;
	awayGoals: number;
	resultPreview: string;
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
	const safeHomeGoals = getSafeGoalValue(homeGoals);
	const safeAwayGoals = getSafeGoalValue(awayGoals);

	function updateHomeGoals(value: number) {
		onUpdateHomeGoals(String(getSafeGoalValue(value)));
	}

	function updateAwayGoals(value: number) {
		onUpdateAwayGoals(String(getSafeGoalValue(value)));
	}

	return (
		<Modal
			isOpen={isOpen}
			title="Enter Result"
			confirmText="Save Result"
			onClose={onClose}
			onConfirm={onConfirm}
		>
			<div className="space-y-5">
				<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
					<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
						<ResultPreviewTeam
							name={homeTeamName}
							score={safeHomeGoals}
							align="left"
						/>

						<div className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-400 shadow-sm">
							vs
						</div>

						<ResultPreviewTeam
							name={awayTeamName}
							score={safeAwayGoals}
							align="right"
						/>
					</div>

					<div className="mt-4 flex justify-center">
						<StatusBadge
							label={getPreviewLabel(resultPreview)}
							tone={getPreviewTone(resultPreview)}
						/>
					</div>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<ScoreControl
						label={homeTeamName}
						value={safeHomeGoals}
						onChange={updateHomeGoals}
					/>

					<ScoreControl
						label={awayTeamName}
						value={safeAwayGoals}
						onChange={updateAwayGoals}
					/>
				</div>

				<div className="rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-800">
					Saving the result will mark the match as completed and unlock player
					stats for this fixture.
				</div>
			</div>
		</Modal>
	);
}

function ScoreControl({
	label,
	value,
	onChange,
}: {
	label: string;
	value: number;
	onChange: (value: number) => void;
}) {
	return (
		<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<p className="truncate text-center text-sm font-bold text-slate-700">
				{label}
			</p>

			<div className="mt-3 flex items-center justify-center gap-3">
				<button
					type="button"
					onClick={() => onChange(value - 1)}
					className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-xl font-bold text-slate-700 hover:bg-slate-50"
					aria-label={`Decrease ${label} score`}
				>
					−
				</button>

				<input
					type="text"
					inputMode="numeric"
					pattern="[0-9]*"
					value={String(value)}
					onChange={(event) =>
						onChange(getSafeGoalValue(event.target.value))
					}
					className="h-16 w-20 rounded-xl border border-slate-300 bg-white text-center text-3xl font-black text-blue-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
					aria-label={`${label} goals`}
				/>

				<button
					type="button"
					onClick={() => onChange(value + 1)}
					className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-xl font-bold text-slate-700 hover:bg-slate-50"
					aria-label={`Increase ${label} score`}
				>
					+
				</button>
			</div>

			<div className="mt-3 grid grid-cols-4 gap-2">
				{[0, 1, 2, 3].map((quickScore) => (
					<button
						key={quickScore}
						type="button"
						onClick={() => onChange(quickScore)}
						className={`rounded-lg border px-2 py-2 text-sm font-bold ${
							value === quickScore
								? "border-blue-700 bg-blue-700 text-white"
								: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
						}`}
					>
						{quickScore}
					</button>
				))}
			</div>
		</div>
	);
}

function ResultPreviewTeam({
	name,
	score,
	align,
}: {
	name: string;
	score: number;
	align: "left" | "right";
}) {
	return (
		<div className={align === "right" ? "text-right" : "text-left"}>
			<p className="truncate text-sm font-semibold text-slate-700">{name}</p>

			<p className="mt-1 text-4xl font-black text-blue-900">{score}</p>
		</div>
	);
}

function getSafeGoalValue(value: string | number) {
	if (typeof value === "number") {
		if (!Number.isFinite(value) || value < 0) {
			return 0;
		}

		return Math.floor(value);
	}

	const numericValue = Number(value.replace(/\D/g, ""));

	if (!Number.isFinite(numericValue) || numericValue < 0) {
		return 0;
	}

	return numericValue;
}

function getPreviewLabel(resultPreview: string) {
	if (resultPreview === "won") {
		return "Win";
	}

	if (resultPreview === "lost") {
		return "Loss";
	}

	if (resultPreview === "draw") {
		return "Draw";
	}

	return "Result preview";
}

function getPreviewTone(
	resultPreview: string
): "success" | "danger" | "neutral" | "info" {
	if (resultPreview === "won") {
		return "success";
	}

	if (resultPreview === "lost") {
		return "danger";
	}

	if (resultPreview === "draw") {
		return "neutral";
	}

	return "info";
}