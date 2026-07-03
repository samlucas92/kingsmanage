interface LinkDialogProps {
	text: string;
	url: string;
	error: string;
	onTextChange: (value: string) => void;
	onUrlChange: (value: string) => void;
	onCancel: () => void;
	onInsert: () => void;
}

export function LinkDialog({
	text,
	url,
	error,
	onTextChange,
	onUrlChange,
	onCancel,
	onInsert,
}: LinkDialogProps) {
	return (
		<div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4">
			<div role="dialog" aria-modal="true" aria-labelledby="link-dialog-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-xs font-black uppercase tracking-wide text-yepset-600">Rich text</p>
						<h2 id="link-dialog-title" className="mt-1 text-xl font-black text-slate-950">Insert link</h2>
					</div>
					<button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600">Close</button>
				</div>
				<div className="mt-5 space-y-4">
					<label className="block text-sm font-bold text-slate-700">
						Link text
						<input autoFocus value={text} onChange={(event) => onTextChange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal outline-none focus:border-yepset-600 focus:ring-2 focus:ring-yepset-100" />
					</label>
					<label className="block text-sm font-bold text-slate-700">
						URL
						<input value={url} onChange={(event) => onUrlChange(event.target.value)} placeholder="https://example.com" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal outline-none focus:border-yepset-600 focus:ring-2 focus:ring-yepset-100" />
					</label>
					{error && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
				</div>
				<div className="mt-5 flex justify-end gap-2">
					<button type="button" onClick={onCancel} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">Cancel</button>
					<button type="button" onClick={onInsert} className="rounded-xl bg-yepset-700 px-4 py-2 text-sm font-bold text-white hover:bg-yepset-800">Insert link</button>
				</div>
			</div>
		</div>
	);
}

interface ImageDialogProps {
	alt: string;
	error: string;
	isUploading: boolean;
	onFileChange: (file: File | null) => void;
	onAltChange: (value: string) => void;
	onCancel: () => void;
	onInsert: () => void;
}

export function ImageDialog({
	alt,
	error,
	isUploading,
	onFileChange,
	onAltChange,
	onCancel,
	onInsert,
}: ImageDialogProps) {
	return (
		<div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4">
			<div role="dialog" aria-modal="true" aria-labelledby="image-dialog-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
				<h2 id="image-dialog-title" className="text-xl font-black text-slate-950">Insert image</h2>
				<div className="mt-5 space-y-4">
					<label className="block text-sm font-bold text-slate-700">
						Image
						<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onFileChange(event.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm font-normal" />
					</label>
					<label className="block text-sm font-bold text-slate-700">
						Image description
						<input value={alt} onChange={(event) => onAltChange(event.target.value)} placeholder="Players celebrating after the match" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal outline-none focus:border-yepset-600 focus:ring-2 focus:ring-yepset-100" />
					</label>
					{error && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
				</div>
				<div className="mt-5 flex justify-end gap-2">
					<button type="button" onClick={onCancel} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">Cancel</button>
					<button type="button" disabled={isUploading} onClick={onInsert} className="rounded-xl bg-yepset-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{isUploading ? "Uploading..." : "Insert image"}</button>
				</div>
			</div>
		</div>
	);
}
