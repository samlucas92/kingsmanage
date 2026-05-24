import type { ReactNode } from "react";
import EmptyState from "./EmptyState";

type DataTableProps = {
	children: ReactNode;
	empty?: boolean;
	emptyTitle?: string;
	emptyMessage?: string;
	minWidthClassName?: string;
	widthClassName?: string;
	className?: string;
	tableClassName?: string;
	emptyClassName?: string;
};

export default function DataTable({
	children,
	empty = false,
	emptyTitle = "No records found",
	emptyMessage = "There is nothing to show here yet.",
	minWidthClassName = "min-w-[900px]",
	widthClassName = "w-full",
	className = "",
	tableClassName = "",
	emptyClassName = "",
}: DataTableProps) {
	if (empty) {
		return (
			<div className={`w-full p-6 ${emptyClassName}`}>
				<EmptyState title={emptyTitle} message={emptyMessage} />
			</div>
		);
	}

	return (
		<div className={`w-full min-w-0 max-w-full overflow-x-auto ${className}`}>
			<table
				className={`${widthClassName} ${minWidthClassName} text-sm ${tableClassName}`}
			>
				{children}
			</table>
		</div>
	);
}