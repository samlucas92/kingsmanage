import { useCallback, useMemo, type KeyboardEvent } from "react";
import { Editable, Slate, type RenderElementProps, type RenderLeafProps } from "slate-react";
import { deserializeRichText, serializeRichText } from "../../utils/richText";
import { createRichTextEditor } from "./createRichTextEditor";
import {
	RichTextElementRenderer,
	RichTextLeafRenderer,
} from "./RichTextRenderers";
import { RichTextToolbar } from "./RichTextToolbar";
import { handleListKeyDown, isListActive } from "./standardLists";
import type { RichTextEditorProps } from "./types";

export type { RichTextImageOwner } from "./types";

export default function RichTextEditor({
	value,
	onChange,
	placeholder,
	compact = false,
	onSubmit,
	imageOwner,
}: RichTextEditorProps) {
	const editor = useMemo(() => createRichTextEditor(), []);
	const initialValue = useMemo(() => deserializeRichText(value), [value]);
	const renderElement = useCallback(
		(props: RenderElementProps) => (
			<RichTextElementRenderer {...props} imageOwner={imageOwner} />
		),
		[imageOwner]
	);
	const renderLeaf = useCallback(
		(props: RenderLeafProps) => <RichTextLeafRenderer {...props} />,
		[]
	);

	function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if (handleListKeyDown(editor, event)) return;

		if (
			onSubmit &&
			event.key === "Enter" &&
			!event.shiftKey &&
			!isListActive(editor)
		) {
			event.preventDefault();
			onSubmit();
		}
	}

	return (
		<div className="overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-yepset-600 focus-within:ring-2 focus-within:ring-yepset-100">
			<Slate
				editor={editor}
				initialValue={initialValue}
				onChange={(nodes) => onChange(serializeRichText(nodes))}
			>
				<RichTextToolbar compact={compact} imageOwner={imageOwner} />
				<Editable
					renderElement={renderElement}
					renderLeaf={renderLeaf}
					placeholder={placeholder}
					onKeyDown={handleKeyDown}
					style={compact ? { minHeight: "5rem" } : undefined}
					className={`${
						compact ? "max-h-40 min-h-20" : "min-h-44"
					} overflow-y-auto px-3 py-2.5 text-sm leading-6 outline-none`}
				/>
			</Slate>
		</div>
	);
}
