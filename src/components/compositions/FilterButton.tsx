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
			className={`rounded-full border px-4 py-2 text-sm font-semibold ${
				isActive
					? "border-blue-700 bg-blue-700 text-white"
					: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
			} ${className}`}
		>
			{label}

			{typeof count === "number" && (
				<span className={isActive ? "ml-1 text-blue-100" : "ml-1 text-slate-400"}>
					{count}
				</span>
			)}
		</button>
	);
}