import { useEffect, useRef, useState } from "react";

export type ActionMenuItem = {
	label: string;
	onClick: () => void;
	disabled?: boolean;
	tone?: "default" | "danger";
};

type ActionMenuProps = {
	label?: string;
	items: ActionMenuItem[];
	align?: "left" | "right";
	className?: string;
};

export default function ActionMenu({
	label = "Actions",
	items,
	align = "right",
	className = "",
}: ActionMenuProps) {
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		function handlePointerDown(event: MouseEvent | TouchEvent) {
			if (!menuRef.current) {
				return;
			}

			if (!menuRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		}

		document.addEventListener("mousedown", handlePointerDown);
		document.addEventListener("touchstart", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
			document.removeEventListener("touchstart", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	function runAction(item: ActionMenuItem) {
		if (item.disabled) {
			return;
		}

		item.onClick();
		setIsOpen(false);
	}

	return (
		<div ref={menuRef} className={`relative inline-flex ${className}`}>
			<button
				type="button"
				onClick={() => setIsOpen((current) => !current)}
				className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
				aria-expanded={isOpen}
				aria-haspopup="menu"
			>
				{label}
				<span
					aria-hidden="true"
					className={`text-xs text-slate-500 transition-transform ${
						isOpen ? "rotate-180" : ""
					}`}
				>
					▾
				</span>
			</button>

			{isOpen && (
				<div
					className={`absolute top-full z-30 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-lg ${
						align === "right" ? "right-0" : "left-0"
					}`}
					role="menu"
				>
					{items.map((item) => (
						<button
							key={item.label}
							type="button"
							onClick={() => runAction(item)}
							disabled={item.disabled}
							className={`block w-full px-4 py-2 text-left text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
								item.tone === "danger"
									? "text-red-700 hover:bg-red-50"
									: "text-slate-700 hover:bg-slate-50"
							}`}
							role="menuitem"
						>
							{item.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
