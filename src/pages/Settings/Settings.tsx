import { useEffect, useState } from "react";

import { useAuthStore } from "../../stores/auth";
import { filesApi } from "../../services/filesApi";
import { formatFileSize } from "../../services/fileService";
import type { FileStorageUsage } from "../../types/files";

export default function Settings() {
	const currentUser = useAuthStore((state) => state.currentUser);
	const changePassword = useAuthStore((state) => state.changePassword);

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [storageUsage, setStorageUsage] = useState<FileStorageUsage | null>(null);
	const [storageError, setStorageError] = useState("");
	const isAdmin = currentUser?.role === "Admin";

	useEffect(() => {
		if (!isAdmin) {
			return;
		}

		let isMounted = true;
		filesApi
			.getStorageUsage()
			.then((usage) => {
				if (isMounted) {
					setStorageUsage(usage);
				}
			})
			.catch((error) => {
				if (isMounted) {
					setStorageError(
						error instanceof Error ? error.message : "Unable to load storage usage."
					);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [isAdmin]);

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
		<div className="space-y-3 lg:space-y-6">
			<div className="surface-card hidden p-6 lg:block">
				<p className="text-xs font-black uppercase tracking-[.14em] text-yepset-600">
					Account
				</p>
				<h1 className="mt-2 text-3xl font-bold text-slate-900">Settings</h1>
				<p className="mt-2 max-w-3xl text-sm text-slate-600">
					Manage your signed-in Yepset account.
				</p>
			</div>

			<div className="grid gap-3 lg:gap-6 xl:grid-cols-[1fr_1.4fr]">
				<section className="surface-card p-4 sm:p-6">
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

				<section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
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
								className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-yepset-600 focus:ring-2 focus:ring-yepset-100"
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
								className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-yepset-600 focus:ring-2 focus:ring-yepset-100"
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
								className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-yepset-600 focus:ring-2 focus:ring-yepset-100"
								autoComplete="new-password"
								required
							/>
						</label>

						<div className="flex justify-end pt-2">
							<button
								type="submit"
								disabled={isSaving}
								className="w-full rounded-xl bg-yepset-700 px-4 py-3 text-sm font-bold text-white hover:bg-yepset-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
							>
								{isSaving ? "Saving..." : "Change password"}
							</button>
						</div>
					</form>
				</section>
			</div>

			{isAdmin && (
				<section className="surface-card p-4 sm:p-6">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<h2 className="text-lg font-bold text-slate-900">File storage</h2>
							<p className="mt-1 text-sm text-slate-500">
								Organization storage includes uploaded, pending and retained orphaned files.
							</p>
						</div>
						{storageUsage?.isNearLimit && (
							<span className={`rounded-full px-3 py-1 text-xs font-bold ${
								storageUsage.isAtLimit
									? "bg-red-100 text-red-700"
									: "bg-amber-100 text-amber-800"
							}`}>
								{storageUsage.isAtLimit ? "Storage full" : "Approaching limit"}
							</span>
						)}
					</div>

					{storageError && (
						<p className="mt-4 text-sm font-semibold text-red-700">{storageError}</p>
					)}

					{storageUsage && (
						<div className="mt-5 space-y-4">
							<div>
								<div className="flex justify-between gap-3 text-sm font-semibold text-slate-700">
									<span>{formatFileSize(storageUsage.usedBytes)} used</span>
									<span>{formatFileSize(storageUsage.quotaBytes)} allowance</span>
								</div>
								<div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
									<div
										className={`h-full rounded-full ${
											storageUsage.isAtLimit
												? "bg-red-500"
												: storageUsage.isNearLimit
													? "bg-amber-500"
													: "bg-yepset-600"
										}`}
										style={{ width: `${Math.min(100, storageUsage.usedPercent)}%` }}
									/>
								</div>
							</div>

							<div className="grid gap-3 sm:grid-cols-3">
								<ProfileRow
									label="Stored objects"
									value={String(storageUsage.storedObjectCount)}
								/>
								<ProfileRow
									label="Pending or quarantined"
									value={String(storageUsage.pendingObjectCount)}
								/>
								<ProfileRow
									label="Awaiting cleanup"
									value={String(storageUsage.orphanedObjectCount)}
								/>
							</div>
						</div>
					)}
				</section>
			)}

			<section className="hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:block">
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
