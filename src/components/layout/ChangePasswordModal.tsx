import { useState } from "react";

type ChangePasswordModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

export default function ChangePasswordModal({
	isOpen,
	onClose,
	onChangePassword,
}: ChangePasswordModalProps) {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	if (!isOpen) {
		return null;
	}

	async function handleSubmit(event: React.SyntheticEvent) {
		event.preventDefault();

		setError("");
		setSuccessMessage("");

		if (!currentPassword.trim()) {
			setError("Enter your current password.");
			return;
		}

		if (newPassword.length < 8) {
			setError("New password must be at least 8 characters.");
			return;
		}

		if (newPassword !== confirmPassword) {
			setError("New password and confirmation do not match.");
			return;
		}

		setIsSaving(true);

		try {
			await onChangePassword(currentPassword, newPassword);
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			setSuccessMessage("Password changed successfully.");
		} catch (error) {
			setError(error instanceof Error ? error.message : "Failed to change password.");
		} finally {
			setIsSaving(false);
		}
	}

	function handleClose() {
		setCurrentPassword("");
		setNewPassword("");
		setConfirmPassword("");
		setError("");
		setSuccessMessage("");
		onClose();
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
			<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
				<div className="mb-5 flex items-start justify-between gap-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
							Account security
						</p>
						<h2 className="text-xl font-bold text-slate-900">Change password</h2>
						<p className="mt-1 text-sm text-slate-600">
							Update the password for your signed-in account.
						</p>
					</div>

					<button
						type="button"
						onClick={handleClose}
						className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
					>
						Close
					</button>
				</div>

				{error && (
					<div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
						{error}
					</div>
				)}

				{successMessage && (
					<div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
						{successMessage}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<label className="block text-sm font-semibold text-slate-700">
						Current password
						<input
							type="password"
							value={currentPassword}
							onChange={(event) => setCurrentPassword(event.target.value)}
							className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
							autoComplete="current-password"
							required
						/>
					</label>

					<label className="block text-sm font-semibold text-slate-700">
						New password
						<input
							type="password"
							value={newPassword}
							onChange={(event) => setNewPassword(event.target.value)}
							className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
							autoComplete="new-password"
							required
						/>
					</label>

					<label className="block text-sm font-semibold text-slate-700">
						Confirm new password
						<input
							type="password"
							value={confirmPassword}
							onChange={(event) => setConfirmPassword(event.target.value)}
							className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
							autoComplete="new-password"
							required
						/>
					</label>

					<div className="flex justify-end gap-3 pt-2">
						<button
							type="button"
							onClick={handleClose}
							className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
						>
							Cancel
						</button>

						<button
							type="submit"
							disabled={isSaving}
							className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{isSaving ? "Saving..." : "Change password"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
