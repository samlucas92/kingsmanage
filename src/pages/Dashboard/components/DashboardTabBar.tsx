import type { DashboardTab, DashboardTabDefinition } from "../dashboardConfig";

export default function DashboardTabBar({
	activeTab,
	onTabChange,
	tabs,
}: {
	activeTab: DashboardTab;
	onTabChange: (tab: DashboardTab) => void;
	tabs: DashboardTabDefinition[];
}) {
	return (
		<div className="surface-card p-1.5">
			<div className="flex gap-2 overflow-x-auto">
				{tabs.map((tab) => {
					const isActive = activeTab === tab.id;

					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => onTabChange(tab.id)}
							className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
								isActive
									? "bg-yepset-700 text-white shadow-[0_6px_16px_rgba(23,105,95,.18)]"
									: "text-slate-600 hover:bg-yepset-50 hover:text-yepset-800"
							}`}
							aria-current={isActive ? "page" : undefined}
						>
							<span>{tab.label}</span>

							{tab.isFuture && (
								<span
									className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
										isActive
											? "bg-white/20 text-white"
											: "bg-amber-100 text-amber-800"
									}`}
								>
									Future
								</span>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
