export type StatusBadgeTone =
	| "default"
	| "success"
	| "warning"
	| "danger"
	| "info"
	| "neutral"
	| string;

type StatusBadgeProps = {
	label: string;
	tone?: StatusBadgeTone;
	className?: string;
};

export default function StatusBadge({
	label,
	tone = "default",
	className = "",
}: StatusBadgeProps) {
	return (
		<span
			className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getToneClass(
				tone
			)} ${className}`}
		>
			{label}
		</span>
	);
}

function getToneClass(tone: StatusBadgeTone) {
	if (tone === "success") {
		return "bg-green-100 text-green-800";
	}

	if (tone === "warning") {
		return "bg-amber-100 text-amber-800";
	}

	if (tone === "danger") {
		return "bg-red-100 text-red-800";
	}

	if (tone === "info") {
		return "bg-blue-100 text-blue-800";
	}

	if (tone === "neutral") {
		return "bg-slate-100 text-slate-700";
	}

	return "bg-slate-100 text-slate-700";
}