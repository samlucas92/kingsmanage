import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type CSSProperties,
} from "react";
import { getFloatingPosition } from "../../utils/floatingPosition";

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
	const buttonRef = useRef<HTMLButtonElement | null>(null);
	const floatingRef = useRef<HTMLDivElement | null>(null);
	const [menuStyle, setMenuStyle] = useState<CSSProperties>({
		left: 0,
		top: 0,
		maxHeight: 320,
	});
	const updateMenuPosition = useCallback(() => {
		if (!buttonRef.current || !floatingRef.current) {
			return;
		}

		const buttonRect = buttonRef.current.getBoundingClientRect();
		const menuRect = floatingRef.current.getBoundingClientRect();
		const bottomPadding = window.innerWidth < 1024 ? 88 : 12;
		const position = getFloatingPosition({
			anchorRect: buttonRect,
			floatingWidth: menuRect.width || 224,
			floatingHeight: menuRect.height || 320,
			align,
			bottomPadding,
		});

		setMenuStyle({
			left: position.left,
			top: position.top,
			maxHeight: position.maxHeight,
		});
	}, [align]);

	useLayoutEffect(() => {
		if (!isOpen) {
			return;
		}

		updateMenuPosition();
	}, [isOpen, updateMenuPosition, items.length]);

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
		window.addEventListener("resize", updateMenuPosition);
		window.addEventListener("scroll", updateMenuPosition, true);

		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
			document.removeEventListener("touchstart", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("resize", updateMenuPosition);
			window.removeEventListener("scroll", updateMenuPosition, true);
		};
	}, [isOpen, updateMenuPosition]);

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
				ref={buttonRef}
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
					ref={floatingRef}
					className="fixed z-50 w-56 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 text-left shadow-lg"
					style={menuStyle}
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
