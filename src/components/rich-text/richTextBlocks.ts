import { Editor, Element as SlateElement, Transforms } from "slate";

export type HeadingType =
	| "paragraph"
	| "heading-one"
	| "heading-two"
	| "heading-three";

export function setHeading(editor: Editor, format: HeadingType) {
	Transforms.unwrapNodes(editor, {
		match: (node) =>
			SlateElement.isElement(node) &&
			["bulleted-list", "numbered-list"].includes(node.type),
		split: true,
	});
	Transforms.setNodes(
		editor,
		{ type: format },
		{
			match: (node) =>
				SlateElement.isElement(node) && Editor.isBlock(editor, node),
		}
	);
}

export function getHeadingType(editor: Editor): HeadingType {
	for (const format of [
		"heading-one",
		"heading-two",
		"heading-three",
	] as const) {
		if (isBlockActive(editor, format)) return format;
	}
	return "paragraph";
}

export function toolbarButtonClass(active: boolean) {
	return `grid h-8 w-8 place-items-center rounded-md transition ${
		active
			? "bg-yepset-700 text-white"
			: "text-yepset-800 hover:bg-yepset-100"
	}`;
}

function isBlockActive(editor: Editor, format: string) {
	const [match] = Editor.nodes(editor, {
		match: (node) =>
			SlateElement.isElement(node) && node.type === format,
	});
	return Boolean(match);
}
