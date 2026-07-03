import { createEditor } from "slate";
import { withHistory } from "slate-history";
import { withReact } from "slate-react";
import { withStandardLists } from "./standardLists";

export function createRichTextEditor() {
	const editor = withStandardLists(withHistory(withReact(createEditor())));
	const isInline = editor.isInline;
	const isVoid = editor.isVoid;

	editor.isInline = (element) =>
		element.type === "link" || isInline(element);
	editor.isVoid = (element) =>
		element.type === "image" || isVoid(element);

	return editor;
}
