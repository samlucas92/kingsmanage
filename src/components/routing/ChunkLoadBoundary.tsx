import { Component, type ErrorInfo, type ReactNode } from "react";
import BrandMark from "../layout/BrandMark";
import { isChunkLoadError, prepareForFreshReload } from "../../utils/lazyWithRetry";

type Props = { children: ReactNode };
type State = { error: unknown };

export default class ChunkLoadBoundary extends Component<Props, State> {
	state: State = { error: null };

	static getDerivedStateFromError(error: unknown): State {
		return { error };
	}

	componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
		console.error("Yepset route failed to load", error, errorInfo);
	}

	private reload = async () => {
		await prepareForFreshReload();
		window.location.reload();
	};

	render() {
		if (!this.state.error) return this.props.children;
		const chunkError = isChunkLoadError(this.state.error);
		return (
			<div className="grid min-h-screen place-items-center bg-canvas p-5">
				<div className="surface-card w-full max-w-md p-6 text-center sm:p-8">
					<div className="flex justify-center"><BrandMark /></div>
					<div className="mx-auto mt-8 grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-2xl font-black text-amber-800">!</div>
					<h1 className="mt-5 text-2xl font-black tracking-[-.03em] text-slate-950">{chunkError ? "Yepset has been updated" : "This page could not open"}</h1>
					<p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">{chunkError ? "Refresh once to load the current version. Your account and club data are safe." : "Reload the page to try again. If this continues, contact your organisation administrator."}</p>
					<button type="button" className="btn-primary mt-6 w-full" onClick={() => void this.reload()}>Reload Yepset</button>
				</div>
			</div>
		);
	}
}
