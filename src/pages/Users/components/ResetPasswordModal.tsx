import { useState } from "react";
import type { AuthUser } from "../../../types/auth";

type ResetPasswordModalProps = {
	user: AuthUser | null;
	onClose: () => void;
	onResetPassword: (userId: string, newPassword: string) => Promise<void>;
};

export default function ResetPasswordModal({
	user,
	onClose,
	onResetPassword,
}: ResetPasswordModalProps) {
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	if (!user) {
		return null;
	}

	async function handleSubmit(event: React.SyntheticEvent) {
		event.preventDefault();

		if (!user) {
			return;
		}

		setError("");
		setSuccessMessage("");

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
			await onResetPassword(user.id, newPassword);
			setNewPassword("");
			setConfirmPassword("");
			setSuccessMessage("Password reset successfully.");
		} catch (error) {
			setError(error instanceof Error ? error.message : "Failed to reset password.");
		} finally {
			setIsSaving(false);
		}
	}

	function handleClose() {
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
							Admin action
						</p>
						<h2 className="text-xl font-bold text-slate-900">Reset password</h2>
						<p className="mt-1 text-sm text-slate-600">
							Set a new password for <span className="font-semibold">{user.email}</span>.
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
							{isSaving ? "Resetting..." : "Reset password"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
