import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type MetricCardTone = "default" | "success" | "warning" | "danger";

type MetricCardSize = "default" | "compact";

type MetricCardProps = {
	label: string;
	value: string | number;
	helper?: string;
	tone?: MetricCardTone;
	size?: MetricCardSize;
	to?: string;
	icon?: ReactNode;
	className?: string;
};

export default function MetricCard({
	label,
	value,
	helper,
	tone = "default",
	size = "default",
	to,
	icon,
	className = "",
}: MetricCardProps) {
	const content = (
		<div
			className={`surface-card min-w-0 ${
				size === "compact" ? "p-3 sm:p-4" : "p-4 sm:p-5"
			} ${to ? "transition hover:-translate-y-0.5 hover:border-yepset-200 hover:shadow-[0_16px_40px_rgba(15,42,40,.09)]" : ""} ${className}`}
		>
			<div className="flex min-w-0 items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="truncate text-xs font-bold uppercase tracking-[.08em] text-slate-500">
						{label}
					</p>

					<p
						className={`mt-2 font-bold ${
							size === "compact" ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
						} ${getValueToneClass(tone)}`}
					>
						{value}
					</p>

					{helper && (
						<p className="mt-1 truncate text-xs text-slate-500">
							{helper}
						</p>
					)}
				</div>

				{icon && <div className="shrink-0 text-slate-400">{icon}</div>}
			</div>
		</div>
	);

	if (to) {
		return (
			<Link to={to} className="block min-w-0">
				{content}
			</Link>
		);
	}

	return content;
}

function getValueToneClass(tone: MetricCardTone) {
	if (tone === "success") {
		return "text-green-700";
	}

	if (tone === "warning") {
		return "text-amber-700";
	}

	if (tone === "danger") {
		return "text-red-700";
	}

	return "text-yepset-800";
}
