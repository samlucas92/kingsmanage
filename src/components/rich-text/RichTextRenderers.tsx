import type {
	RenderElementProps,
	RenderLeafProps,
} from "slate-react";
import { RichTextImageElement } from "./RichTextImageElement";
import type { RichTextImageOwner } from "./types";

export function RichTextElementRenderer({
	attributes,
	children,
	element,
	imageOwner,
}: RenderElementProps & { imageOwner?: RichTextImageOwner }) {
	switch (element.type) {
		case "heading-one":
			return <h1 {...attributes} className="text-2xl font-black">{children}</h1>;
		case "heading-two":
			return <h2 {...attributes} className="text-lg font-bold">{children}</h2>;
		case "heading-three":
			return <h3 {...attributes} className="text-base font-bold">{children}</h3>;
		case "bulleted-list":
			return <ul {...attributes} className="my-1 list-disc space-y-1 pl-6">{children}</ul>;
		case "numbered-list":
			return <ol {...attributes} className="my-1 list-decimal space-y-1 pl-6">{children}</ol>;
		case "list-item":
			return <li {...attributes} className="pl-1">{children}</li>;
		case "link":
			return <a {...attributes} href={element.url} className="text-yepset-700 underline">{children}</a>;
		case "image":
			return (
				<RichTextImageElement
					attributes={attributes}
					element={element}
					imageOwner={imageOwner}
				>
					{children}
				</RichTextImageElement>
			);
		default:
			return <p {...attributes}>{children}</p>;
	}
}

export function RichTextLeafRenderer({
	attributes,
	children,
	leaf,
}: RenderLeafProps) {
	let content = children;
	if (leaf.bold) content = <strong>{content}</strong>;
	if (leaf.italic) content = <em>{content}</em>;
	if (leaf.underline) content = <u>{content}</u>;
	return <span {...attributes}>{content}</span>;
}
