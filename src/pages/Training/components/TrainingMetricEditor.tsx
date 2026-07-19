import type { TrainingMetricRating } from "../../../types/training";

type TrainingMetricEditorProps = {
	metrics: TrainingMetricRating[];
	onMetricRatingChange: (metricKey: string, rating: number) => void;
	onCategoryRatingChange: (metricKey: string, categoryKey: string, rating: number) => void;
};

export default function TrainingMetricEditor({
	metrics,
	onMetricRatingChange,
	onCategoryRatingChange,
}: TrainingMetricEditorProps) {
	return (
		<div className="space-y-3">
			{metrics.map((metric) => (
				<div key={metric.key} className="rounded-2xl border border-slate-200 bg-white p-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h3 className="text-base font-black text-slate-950">{metric.label}</h3>
							<p className="text-xs font-semibold text-slate-500">
								Top-level score follows the micro-category average unless changed directly.
							</p>
						</div>
						<RatingControl
							label={`${metric.label} rating`}
							value={metric.rating}
							onChange={(rating) => onMetricRatingChange(metric.key, rating)}
						/>
					</div>

					<div className="mt-4 grid gap-3 sm:grid-cols-2">
						{metric.categories.map((category) => (
							<div key={category.key} className="rounded-xl bg-slate-50 p-3">
								<RatingControl
									label={category.label}
									value={category.rating}
									onChange={(rating) => onCategoryRatingChange(metric.key, category.key, rating)}
								/>
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

function RatingControl({
	label,
	value,
	onChange,
}: {
	label: string;
	value: number;
	onChange: (rating: number) => void;
}) {
	return (
		<label className="block">
			<div className="mb-1 flex items-center justify-between gap-3">
				<span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
				<span className="rounded-full bg-yepset-100 px-2 py-1 text-xs font-black text-yepset-900">{value}/5</span>
			</div>
			<input
				type="range"
				min={1}
				max={5}
				step={1}
				value={value}
				onChange={(event) => onChange(Number(event.target.value))}
				className="h-2 w-full accent-yepset-700"
			/>
			<div className="mt-1 flex justify-between text-[10px] font-bold text-slate-400">
				<span>Needs work</span>
				<span>Excellent</span>
			</div>
		</label>
	);
}
