import { Node, Text, type Descendant } from "slate";
import type { RichTextNode } from "../types/slate";

const prefix = "yepset-richtext:v1:";

export const emptyRichText: Descendant[] = [
	{ type: "paragraph", children: [{ text: "" }] },
];

export function deserializeRichText(value: string): Descendant[] {
	if (value.startsWith(prefix)) {
		try {
			const parsed = JSON.parse(value.slice(prefix.length));
			if (Array.isArray(parsed) && parsed.length > 0) return parsed as Descendant[];
		} catch {
			// Malformed rich content is displayed as its original text.
		}
	}

	const lines = value.split(/\r?\n/);
	return (lines.length ? lines : [""]).map((line) => ({
		type: "paragraph",
		children: [{ text: line }],
	})) as Descendant[];
}

export function serializeRichText(value: Descendant[]) {
	return `${prefix}${JSON.stringify(value)}`;
}

export function ensureRichText(value: string) {
	return isRichText(value) ? value : serializeRichText(deserializeRichText(value));
}

export function ensureRichTextWithLink(value: string, linkText: string, url: string) {
	const richValue = ensureRichText(value);
	if (!linkText || !url) return richValue;
	const nodes = deserializeRichText(richValue).map((node) =>
		Text.isText(node)
			? node
			: {
					...node,
					children: replaceTextWithLink(node.children, linkText, url),
				}
	);
	return serializeRichText(nodes);
}

function replaceTextWithLink(
	children: RichTextNode[],
	linkText: string,
	url: string
): RichTextNode[] {
	const result: RichTextNode[] = [];
	for (const child of children) {
		if (!Text.isText(child)) {
			result.push({
				...child,
				children: replaceTextWithLink(child.children, linkText, url),
			});
			continue;
		}

		const index = child.text.indexOf(linkText);
		if (index < 0) {
			result.push(child);
			continue;
		}

		const before = child.text.slice(0, index);
		const after = child.text.slice(index + linkText.length);
		if (before) result.push({ ...child, text: before });
		result.push({
			type: "link",
			url,
			children: [{ ...child, text: linkText }],
		});
		if (after) result.push({ ...child, text: after });
	}
	return result;
}

export function richTextToPlainText(value: string) {
	const nodes = deserializeRichText(value);
	return nodes.map((node) => Node.string(node)).join("\n").trim();
}

export function isRichText(value: string) {
	return value.startsWith(prefix);
}

export function isRichTextEmpty(value: string) {
	return !richTextToPlainText(value);
}

export function renderLeafText(node: Descendant): string {
	return Text.isText(node) ? node.text : Node.string(node);
}
