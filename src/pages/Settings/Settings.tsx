import { useState } from "react";

import { useAuthStore } from "../../stores/auth";

export default function Settings() {
	const currentUser = useAuthStore((state) => state.currentUser);
	const changePassword = useAuthStore((state) => state.changePassword);

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
			await changePassword(currentPassword, newPassword);
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

	return (
		<div className="space-y-6">
			<div className="surface-card p-6">
				<p className="text-xs font-black uppercase tracking-[.14em] text-yepset-600">
					Account
				</p>
				<h1 className="mt-2 text-3xl font-bold text-slate-900">Settings</h1>
				<p className="mt-2 max-w-3xl text-sm text-slate-600">
					Manage your signed-in Yepset account.
				</p>
			</div>

			<div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
				<section className="surface-card p-6">
					<h2 className="text-lg font-bold text-slate-900">Profile</h2>
					<p className="mt-1 text-sm text-slate-500">
						Your account details are managed by an admin.
					</p>

					<div className="mt-5 space-y-4">
						<ProfileRow label="Email" value={currentUser?.email ?? "—"} />
						<ProfileRow label="Role" value={currentUser?.role ?? "—"} />
						<ProfileRow
							label="Linked player"
							value={currentUser?.playerId ? "Linked" : "Not linked"}
						/>
						<ProfileRow
							label="Status"
							value={currentUser?.isActive ? "Active" : "Inactive"}
						/>
					</div>
				</section>

				<section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
					<h2 className="text-lg font-bold text-slate-900">Change password</h2>
					<p className="mt-1 text-sm text-slate-500">
						Update your password using your current password.
					</p>

					{error && (
						<div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
							{error}
						</div>
					)}

					{successMessage && (
						<div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
							{successMessage}
						</div>
					)}

					<form onSubmit={handleSubmit} className="mt-5 space-y-4">
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

						<div className="flex justify-end pt-2">
							<button
								type="submit"
								disabled={isSaving}
								className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isSaving ? "Saving..." : "Change password"}
							</button>
						</div>
					</form>
				</section>
			</div>

			<section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
				<h2 className="text-lg font-bold text-slate-900">Future account options</h2>
				<p className="mt-1 text-sm text-slate-500">
					Forgot password from the login page should be added later once the email/reset-token flow is designed.
				</p>
			</section>
		</div>
	);
}

function ProfileRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-xl border border-slate-200 px-4 py-3">
			<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
			<p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
		</div>
	);
}
