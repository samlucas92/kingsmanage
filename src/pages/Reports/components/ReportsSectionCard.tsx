import { Link } from "react-router-dom";

type ReportsSectionCardProps = {
	to: string;
	icon: string;
	title: string;
	description: string;
	tone?: "green" | "blue" | "amber" | "purple";
};

export default function ReportsSectionCard({
	to,
	icon,
	title,
	description,
	tone = "green",
}: ReportsSectionCardProps) {
	const toneClass =
		tone === "blue"
			? "bg-blue-50 text-blue-700"
			: tone === "amber"
				? "bg-amber-50 text-amber-700"
				: tone === "purple"
					? "bg-purple-50 text-purple-700"
					: "bg-yepset-50 text-yepset-700";

	return (
		<Link
			to={to}
			className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-yepset-200 hover:shadow-md"
		>
			<span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl ${toneClass}`}>
				{icon}
			</span>
			<span className="min-w-0 flex-1">
				<span className="block text-sm font-black text-slate-950">{title}</span>
				<span className="mt-1 block text-xs font-semibold text-slate-500">{description}</span>
			</span>
			<span className="text-xl font-black text-slate-400 transition group-hover:translate-x-1 group-hover:text-yepset-700">›</span>
		</Link>
	);
}
