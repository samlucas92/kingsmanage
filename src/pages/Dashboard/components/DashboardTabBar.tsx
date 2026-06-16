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
		<div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
			<div className="flex gap-2 overflow-x-auto">
				{tabs.map((tab) => {
					const isActive = activeTab === tab.id;

					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => onTabChange(tab.id)}
							className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
								isActive
									? "bg-blue-700 text-white shadow-sm"
									: "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
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
