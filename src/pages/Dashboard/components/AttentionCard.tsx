import type { ReactNode } from "react";

export default function AttentionCard({
	children,
	title,
	tone,
}: {
	children: ReactNode;
	title: string;
	tone: "neutral" | "good" | "danger" | "muted";
}) {
	return (
		<section className={`rounded-2xl border bg-white p-5 shadow-sm ${getToneBorder(tone)}`}>
			<h2 className="text-base font-bold text-slate-700">{title}</h2>

			<div className="mt-4">{children}</div>
		</section>
	);
}

function getToneBorder(tone: "neutral" | "good" | "danger" | "muted") {
	if (tone === "good") {
		return "border-green-200";
	}

	if (tone === "danger") {
		return "border-red-200";
	}

	if (tone === "muted") {
		return "border-slate-200 opacity-90";
	}

	return "border-slate-200";
}
