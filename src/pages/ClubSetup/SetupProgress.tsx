import { setupSteps, type SetupCheck } from "./setupModel";

export function SetupProgress({
	step,
	checklist,
	onStepChange,
}: {
	step: number;
	checklist: SetupCheck[];
	onStepChange: (step: number) => void;
}) {
	return (
		<aside className="surface-card h-fit p-5 lg:sticky lg:top-28">
			<p className="text-xs font-black uppercase tracking-[.14em] text-yepset-600">
				Setup progress
			</p>
			<ol className="mt-4 space-y-2">
				{setupSteps.map((label, index) => (
					<li key={label}>
						<button
							type="button"
							onClick={() => onStepChange(index)}
							aria-current={index === step ? "step" : undefined}
							className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold transition hover:bg-slate-100 ${
								index === step
									? "bg-yepset-100 text-yepset-900"
									: index < step
										? "text-emerald-700"
										: "text-slate-500"
							}`}
						>
							<span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-current">
								{index < step ? "✓" : index + 1}
							</span>
							{label}
						</button>
					</li>
				))}
			</ol>

			<div className="mt-5 border-t border-slate-200 pt-4">
				<p className="text-sm font-black text-slate-900">Essential checklist</p>
				<ul className="mt-3 space-y-2">
					{checklist.map((item) => (
						<li
							key={item.label}
							className={`flex gap-2 text-sm ${
								item.complete ? "text-emerald-700" : "text-slate-500"
							}`}
						>
							<span aria-hidden="true">{item.complete ? "✓" : "○"}</span>
							{item.label}
						</li>
					))}
				</ul>
			</div>
		</aside>
	);
}
