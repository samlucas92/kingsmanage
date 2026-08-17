import HandoverNav from "./HandoverNav";

export function VaultFrame({ children }: { children: React.ReactNode }) {
	return <div className="mx-auto max-w-6xl space-y-5"><HandoverNav />{children}</div>;
}

export function ErrorBanner({ message }: { message: string }) {
	return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{message}</div>;
}
