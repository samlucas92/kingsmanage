import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/auth";
import BrandMark from "../../components/layout/BrandMark";

const DEFAULT_VIEWPORT_CONTENT = "width=device-width, initial-scale=1.0";
const LOCKED_VIEWPORT_CONTENT = `${DEFAULT_VIEWPORT_CONTENT}, maximum-scale=1.0`;

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
	const viewportRestoreTimerRef = useRef<number | null>(null);

	useEffect(() => {
		void initialise();
	}, [initialise]);

	useEffect(() => {
		clearError();
	}, [clearError]);

	useEffect(() => {
		return () => {
			if (viewportRestoreTimerRef.current !== null) {
				window.clearTimeout(viewportRestoreTimerRef.current);
			}

			setViewportScaleLocked(false);
		};
	}, []);

	const fromPath = getReturnPath(location.state);

	if (isInitialised && isAuthenticated) {
		return <Navigate to={fromPath} replace />;
	}

	const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
		event.preventDefault();
		(event.currentTarget.ownerDocument.activeElement as HTMLElement | null)?.blur();
		setViewportScaleLocked(true);

		try {
			await login(email, password);
			await applyLockedViewport();
			navigate(fromPath, { replace: true });
		} catch {
			// Error is handled by the auth store and displayed below.
		}
	}

	const handleLoginFieldInteraction = () => {
		if (viewportRestoreTimerRef.current !== null) {
			window.clearTimeout(viewportRestoreTimerRef.current);
			viewportRestoreTimerRef.current = null;
		}

		setViewportScaleLocked(true);
	};

	const handleLoginFieldBlur = () => {
		const timer = window.setTimeout(() => {
			setViewportScaleLocked(false);
			viewportRestoreTimerRef.current = null;
		}, 750);

		viewportRestoreTimerRef.current = timer;
	};

	return (
		<div className="flex min-h-screen bg-canvas">
			<div className="relative hidden flex-1 overflow-hidden bg-yepset-950 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
				<div className="absolute -right-32 -top-36 h-96 w-96 rounded-full bg-yepset-500/20 blur-3xl" />
				<div className="absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-kick-400/10 blur-3xl" />
				<div className="relative">
					<BrandMark inverse />
					<h1 className="mt-20 max-w-xl text-5xl font-black leading-[1.04] tracking-[-.045em]">
						Everything your club needs to move together.
					</h1>
					<p className="mt-6 max-w-lg text-base leading-7 text-yepset-100">
						One welcoming home for teams, availability, fixtures, finances and the people who make sport happen.
					</p>
				</div>

				<div className="relative grid max-w-2xl grid-cols-3 gap-3">
					<LoginFeature value="One place" label="Across every club" />
					<LoginFeature value="Any sport" label="Built to adapt" />
					<LoginFeature value="Every team" label="Always connected" />
				</div>
			</div>

			<div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
				<form onSubmit={handleSubmit} className="surface-card w-full max-w-md p-6 sm:p-8">
					<div>
						<div className="mb-8 lg:hidden"><BrandMark /></div>
						<p className="text-xs font-black uppercase tracking-[.18em] text-yepset-600">Welcome back</p>
						<h2 className="mt-2 text-3xl font-black tracking-[-.035em] text-slate-950">Sign in to Yepset</h2>
						<p className="mt-2 text-sm leading-6 text-slate-500">Use your club account to continue.</p>
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
								onPointerDown={handleLoginFieldInteraction}
								onFocus={handleLoginFieldInteraction}
								onBlur={handleLoginFieldBlur}
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								className="mt-1.5 h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base outline-none transition hover:border-slate-400 focus:border-yepset-500 focus:ring-4 focus:ring-yepset-100"
								autoComplete="email"
								required
							/>
						</label>

						<label className="block">
							<span className="text-sm font-medium text-slate-700">Password</span>
							<input
								type="password"
								onPointerDown={handleLoginFieldInteraction}
								onFocus={handleLoginFieldInteraction}
								onBlur={handleLoginFieldBlur}
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								className="mt-1.5 h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base outline-none transition hover:border-slate-400 focus:border-yepset-500 focus:ring-4 focus:ring-yepset-100"
								autoComplete="current-password"
								required
							/>
						</label>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:transform-none disabled:bg-slate-300 disabled:shadow-none"
					>
						{isLoading ? "Signing in..." : "Sign in"}
					</button>
				</form>
			</div>
		</div>
	);
}

function LoginFeature({ value, label }: { value: string; label: string }) {
	return (
		<div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur">
			<p className="text-sm font-black text-white">{value}</p>
			<p className="mt-1 text-xs text-yepset-200">{label}</p>
		</div>
	);
}

function setViewportScaleLocked(isLocked: boolean) {
	const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');

	if (viewport) {
		viewport.content = isLocked ? LOCKED_VIEWPORT_CONTENT : DEFAULT_VIEWPORT_CONTENT;
	}
}

function applyLockedViewport() {
	setViewportScaleLocked(true);

	return new Promise<void>((resolve) => {
		window.requestAnimationFrame(() => {
			window.requestAnimationFrame(() => resolve());
		});
	});
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
