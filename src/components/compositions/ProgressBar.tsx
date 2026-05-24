type ProgressBarTone = "default" | "success" | "warning" | "danger" | "neutral";

type ProgressBarProps = {
	value: number;
	max?: number;
	tone?: ProgressBarTone;
	heightClassName?: string;
	className?: string;
};

export default function ProgressBar({
	value,
	max = 100,
	tone = "default",
	heightClassName = "h-3",
	className = "",
}: ProgressBarProps) {
	const percentage = getPercentage(value, max);

	return (
		<div
			className={`${heightClassName} overflow-hidden rounded-full bg-slate-100 ${className}`}
		>
			<div
				className={`h-full rounded-full transition-all ${getToneClass(tone)}`}
				style={{ width: `${percentage}%` }}
			/>
		</div>
	);
}

function getPercentage(value: number, max: number) {
	if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
		return 0;
	}

	return Math.min(100, Math.max(0, Math.round((value / max) * 100)));
}

function getToneClass(tone: ProgressBarTone) {
	if (tone === "success") {
		return "bg-green-500";
	}

	if (tone === "warning") {
		return "bg-amber-500";
	}

	if (tone === "danger") {
		return "bg-red-500";
	}

	if (tone === "neutral") {
		return "bg-slate-400";
	}

	return "bg-blue-700";
}