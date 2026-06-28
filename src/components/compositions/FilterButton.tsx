type FilterButtonProps<Value extends string> = {
	label: string;
	value: Value;
	activeValue: Value;
	count?: number;
	onChange: (value: Value) => void;
	className?: string;
};

export default function FilterButton<Value extends string>({
	label,
	value,
	activeValue,
	count,
	onChange,
	className = "",
}: FilterButtonProps<Value>) {
	const isActive = value === activeValue;

	return (
		<button
			type="button"
			onClick={() => onChange(value)}
			className={`min-h-10 rounded-full border px-4 py-2 text-sm font-bold transition ${
				isActive
					? "border-yepset-700 bg-yepset-700 text-white shadow-sm"
					: "border-slate-200 bg-white text-slate-700 hover:border-yepset-200 hover:bg-yepset-50"
			} ${className}`}
		>
			{label}

			{typeof count === "number" && (
				<span className={isActive ? "ml-1 text-yepset-100" : "ml-1 text-slate-400"}>
					{count}
				</span>
			)}
		</button>
	);
}
