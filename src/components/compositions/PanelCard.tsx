import type { ReactNode } from "react";

type PanelCardProps = {
	title?: string;
	description?: string;
	action?: ReactNode;
	children: ReactNode;
	className?: string;
	contentClassName?: string;
	tone?: "default" | "info";
};

export default function PanelCard({
	title,
	description,
	action,
	children,
	className = "",
	contentClassName = "",
	tone = "default",
}: PanelCardProps) {
	return (
		<section
			className={`rounded-xl p-5 shadow ${
				tone === "info"
					? "border border-blue-100 bg-blue-50 shadow-sm"
					: "bg-white"
			} ${className}`}
		>
			{(title || description || action) && (
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="min-w-0">
						{title && (
							<h2
								className={`text-lg font-bold ${
									tone === "info" ? "text-blue-950" : "text-blue-900"
								}`}
							>
								{title}
							</h2>
						)}

						{description && (
							<p
								className={`mt-1 text-sm ${
									tone === "info" ? "text-blue-800" : "text-slate-500"
								}`}
							>
								{description}
							</p>
						)}
					</div>

					{action && <div className="shrink-0">{action}</div>}
				</div>
			)}

			<div className={title || description || action ? `mt-5 ${contentClassName}` : contentClassName}>
				{children}
			</div>
		</section>
	);
}