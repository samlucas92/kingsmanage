import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/auth";

export default function Login() {
	const navigate = useNavigate();
	const location = useLocation();
	const initialise = useAuthStore((state) => state.initialise);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const isInitialised = useAuthStore((state) => state.isInitialised);
	const isLoading = useAuthStore((state) => state.isLoading);
	const error = useAuthStore((state) => state.error);
	const login = useAuthStore((state) => state.login);
	const clearError = useAuthStore((state) => state.clearError);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	useEffect(() => {
		void initialise();
	}, [initialise]);

	useEffect(() => {
		clearError();
	}, [clearError]);

	const fromPath = getReturnPath(location.state);

	if (isInitialised && isAuthenticated) {
		return <Navigate to={fromPath} replace />;
	}

	const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
		event.preventDefault();
		(event.currentTarget.ownerDocument.activeElement as HTMLElement | null)?.blur();

		try {
			await login(email, password);
			navigate(fromPath, { replace: true });
		} catch {
			// Error is handled by the auth store and displayed below.
		}
	}

	return (
		<div className="flex min-h-screen bg-slate-100">
			<div className="hidden flex-1 bg-blue-950 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-yellow-300">KingsManage</p>
					<h1 className="mt-6 max-w-xl text-4xl font-bold leading-tight">
						Club management for Kingsbridge Colts.
					</h1>
					<p className="mt-4 max-w-lg text-sm leading-6 text-blue-100">
						Manage players, matches, stats, seasons, and finance from one secure admin area.
					</p>
				</div>

				<div className="rounded-2xl border border-white/10 bg-white/10 p-6 text-sm text-blue-50">
					<p className="font-semibold text-white">Next foundation</p>
					<p className="mt-2">
						Login is being introduced before player-facing areas, events, posts, and role-based navigation.
					</p>
				</div>
			</div>

			<div className="flex flex-1 items-center justify-center px-4 py-10">
				<form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">Kingsbridge Colts</p>
						<h2 className="mt-3 text-3xl font-bold text-slate-900">Sign in</h2>
						<p className="mt-2 text-sm text-slate-500">Use your KingsManage account to continue.</p>
					</div>

					{error && (
						<div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
							{error}
						</div>
					)}

					<div className="mt-6 space-y-4">
						<label className="block">
							<span className="text-sm font-medium text-slate-700">Email</span>
							<input
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
								autoComplete="email"
								required
							/>
						</label>

						<label className="block">
							<span className="text-sm font-medium text-slate-700">Password</span>
							<input
								type="password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
								autoComplete="current-password"
								required
							/>
						</label>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className="mt-6 w-full rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-blue-300"
					>
						{isLoading ? "Signing in..." : "Sign in"}
					</button>
				</form>
			</div>
		</div>
	);
}

function getReturnPath(state: unknown) {
	if (
		state &&
		typeof state === "object" &&
		"from" in state &&
		state.from &&
		typeof state.from === "object" &&
		"pathname" in state.from &&
		typeof state.from.pathname === "string"
	) {
		return state.from.pathname;
	}

	return "/";
}
