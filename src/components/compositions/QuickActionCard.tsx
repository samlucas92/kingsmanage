import { Link } from "react-router-dom";

type QuickActionCardProps = {
	description: string;
	title: string;
	to: string;
};

export default function QuickActionCard({
	description,
	title,
	to,
}: QuickActionCardProps) {
	return (
		<Link
			to={to}
			className="block rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50"
		>
			<p className="font-bold text-slate-900">{title}</p>
			<p className="mt-1 text-sm text-slate-500">{description}</p>
		</Link>
	);
}
