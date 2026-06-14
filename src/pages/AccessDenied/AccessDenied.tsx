import { Link } from "react-router-dom";

export default function AccessDenied() {
	return (
		<div className="flex min-h-[60vh] items-center justify-center px-4">
			<div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
				<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-xl font-bold text-yellow-700">
					!
				</div>
				<h1 className="text-xl font-semibold text-slate-900">Access denied</h1>
				<p className="mt-2 text-sm text-slate-600">
					You do not have permission to view this area. If you think this is wrong, ask an admin to check your role.
				</p>
				<Link
					to="/"
					className="mt-5 inline-flex rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
				>
					Back to dashboard
				</Link>
			</div>
		</div>
	);
}
