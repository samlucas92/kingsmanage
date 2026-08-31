export type MatchDetailSectionId = "overview" | "squad" | "stats" | "notes";

type MatchDetailSectionNavProps = {
	activeSection: MatchDetailSectionId;
	onSectionSelect: (sectionId: MatchDetailSectionId) => void;
};

const sections: Array<{ id: MatchDetailSectionId; label: string }> = [
	{ id: "overview", label: "Overview" },
	{ id: "squad", label: "Squad & lineup" },
	{ id: "stats", label: "Match stats" },
	{ id: "notes", label: "Notes" },
];

export function MatchDetailSectionNav({
	activeSection,
	onSectionSelect,
}: MatchDetailSectionNavProps) {
	return (
		<nav className="surface-card overflow-hidden px-2" aria-label="Match sections">
			<div className="flex gap-1 overflow-x-auto" role="tablist">
				{sections.map((section) => {
					const isActive = activeSection === section.id;

					return (
						<button
							key={section.id}
							type="button"
							role="tab"
							aria-selected={isActive}
							onClick={() => onSectionSelect(section.id)}
							className={`min-h-12 shrink-0 border-b-3 px-3 text-sm font-bold transition sm:px-4 ${
								isActive
									? "border-yepset-700 text-yepset-800"
									: "border-transparent text-slate-500 hover:border-yepset-200 hover:text-yepset-700"
							}`}
						>
							{section.label}
						</button>
					);
				})}
			</div>
		</nav>
	);
}
