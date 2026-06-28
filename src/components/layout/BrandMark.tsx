type BrandMarkProps = {
	compact?: boolean;
	inverse?: boolean;
};

export default function BrandMark({ compact = false, inverse = false }: BrandMarkProps) {
	return (
		<div className="flex items-center gap-3">
			<span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-kick-400 text-yepset-950 shadow-[0_8px_20px_rgba(190,242,100,.18)]">
				<svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
					<path d="M7 8.5 15.8 17 25 7.8" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
					<path d="M16 17v7.5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
					<circle cx="24.5" cy="8" r="3.2" fill="currentColor" />
				</svg>
			</span>
			{!compact && (
				<span className="min-w-0">
					<span className={`block text-[10px] font-black uppercase tracking-[.24em] ${inverse ? "text-yepset-200" : "text-yepset-700"}`}>
						Club together
					</span>
					<span className={`block text-xl font-black tracking-[-.03em] ${inverse ? "text-white" : "text-yepset-950"}`}>
						Yepset
					</span>
				</span>
			)}
		</div>
	);
}
