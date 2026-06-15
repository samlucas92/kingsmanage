import type { ReactNode } from "react";

type ConfirmationModalVariant = "default" | "danger";

type ConfirmationModalProps = {
	isOpen: boolean;
	title: string;
	message?: string;
	confirmText?: string;
	cancelText?: string;
	isBusy?: boolean;
	variant?: ConfirmationModalVariant;
	onCancel: () => void;
	onConfirm: () => void | Promise<void>;
	children?: ReactNode;
};

export default function ConfirmationModal({
	cancelText = "Cancel",
	children,
	confirmText = "Confirm",
	isBusy = false,
	isOpen,
	message,
	onCancel,
	onConfirm,
	title,
	variant = "default",
}: ConfirmationModalProps) {
	if (!isOpen) {
		return null;
	}

	const confirmButtonClassName =
		variant === "danger"
			? "bg-red-700 text-white hover:bg-red-800"
			: "bg-blue-700 text-white hover:bg-blue-800";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
			<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
				<h2 className="text-xl font-bold text-slate-900">{title}</h2>

				{message && <p className="mt-2 text-sm text-slate-600">{message}</p>}

				{children && <div className="mt-4">{children}</div>}

				<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<button
						type="button"
						disabled={isBusy}
						onClick={onCancel}
						className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{cancelText}
					</button>

					<button
						type="button"
						disabled={isBusy}
						onClick={() => void onConfirm()}
						className={`rounded-xl px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 ${confirmButtonClassName}`}
					>
						{isBusy ? "Working..." : confirmText}
					</button>
				</div>
			</div>
		</div>
	);
}
