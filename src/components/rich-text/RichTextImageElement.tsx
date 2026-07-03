import { useState } from "react";
import { Transforms } from "slate";
import {
	ReactEditor,
	useFocused,
	useSelected,
	useSlateStatic,
	type RenderElementProps,
} from "slate-react";
import {
	getManagedImageValidationError,
	uploadLinkedFile,
} from "../../services/fileService";
import ManagedFileImage from "../files/ManagedFileImage";
import type { RichTextImageOwner } from "./types";

export function RichTextImageElement({
	attributes,
	children,
	element,
	imageOwner,
}: RenderElementProps & { imageOwner?: RichTextImageOwner }) {
	const editor = useSlateStatic();
	const selected = useSelected();
	const focused = useFocused();
	const [error, setError] = useState("");
	const [isReplacing, setIsReplacing] = useState(false);

	function remove() {
		if (!element.fileId) return;
		Transforms.removeNodes(editor, {
			at: ReactEditor.findPath(editor, element),
		});
	}

	async function replace(file: File) {
		if (!imageOwner || !element.fileId) return;
		setIsReplacing(true);
		setError("");
		try {
			const validationError = await getManagedImageValidationError(
				file,
				"editor"
			);
			if (validationError) {
				setError(validationError);
				return;
			}
			const uploaded = await uploadLinkedFile({
				file,
				linkedEntityType: imageOwner.linkedEntityType,
				linkedEntityId: imageOwner.linkedEntityId,
			});
			Transforms.setNodes(
				editor,
				{ fileId: uploaded.id, alt: element.alt || file.name },
				{ at: ReactEditor.findPath(editor, element) }
			);
		} catch (reason) {
			setError(
				reason instanceof Error
					? reason.message
					: "Could not replace image."
			);
		} finally {
			setIsReplacing(false);
		}
	}

	return (
		<figure
			{...attributes}
			className={`my-3 rounded-xl border p-2 ${
				selected && focused
					? "border-yepset-500 ring-2 ring-yepset-100"
					: "border-slate-200"
			}`}
		>
			{children}
			<div contentEditable={false}>
				{element.fileId && (
					<ManagedFileImage
						fileId={element.fileId}
						alt={element.alt ?? ""}
						className="max-h-96 w-full rounded-lg object-contain"
					/>
				)}
				<input
					value={element.alt ?? ""}
					onChange={(event) =>
						Transforms.setNodes(
							editor,
							{ alt: event.target.value },
							{ at: ReactEditor.findPath(editor, element) }
						)
					}
					aria-label="Image description"
					className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600"
				/>
				<div className="mt-2 flex flex-wrap gap-2">
					{imageOwner && (
						<label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700">
							Replace
							<input
								type="file"
								accept="image/jpeg,image/png,image/webp"
								disabled={isReplacing}
								onChange={(event) => {
									const file = event.target.files?.[0];
									if (file) void replace(file);
								}}
								className="sr-only"
							/>
						</label>
					)}
					<button
						type="button"
						onClick={remove}
						className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700"
					>
						Remove
					</button>
				</div>
				{error && (
					<p className="mt-2 text-xs font-semibold text-red-700">{error}</p>
				)}
			</div>
		</figure>
	);
}
