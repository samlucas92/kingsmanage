import { Node, Text, type Descendant } from "slate";
import type { RichTextElement, RichTextNode } from "../types/slate";

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

export function normalizeBulletListParagraphs(value: string) {
	const nodes = deserializeRichText(ensureRichText(value));
	return serializeRichText(nodes.flatMap(expandGeneratedListParagraph) as Descendant[]);
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
	return nodes.map((node) => {
		if (!Text.isText(node) && node.type === "image") {
			return node.alt?.trim() || "Image";
		}
		return Node.string(node);
	}).join("\n").trim();
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

function expandGeneratedListParagraph(node: RichTextNode): RichTextNode[] {
	if ("text" in node) {
		return [node];
	}

	if (node.type !== "paragraph") {
		return [
			{
				...node,
				children: node.children.flatMap(expandGeneratedListParagraph),
			},
		];
	}

	const lines = splitInlineChildrenIntoLines(node.children);

	if (lines.length <= 1 || !lines.some(isBulletLine)) {
		return [node];
	}

	const result: RichTextNode[] = [];
	let bulletItems: RichTextElement[] = [];

	function flushBulletItems() {
		if (bulletItems.length === 0) {
			return;
		}

		result.push({
			type: "bulleted-list",
			children: bulletItems,
		});
		bulletItems = [];
	}

	for (const line of lines) {
		if (isBulletLine(line)) {
			bulletItems.push({
				type: "list-item",
				children: stripBulletPrefix(line),
			});
			continue;
		}

		flushBulletItems();

		if (isBlankLine(line)) {
			continue;
		}

		result.push({
			type: "paragraph",
			children: line,
		});
	}

	flushBulletItems();

	return result.length > 0 ? result : [node];
}

function splitInlineChildrenIntoLines(children: RichTextNode[]) {
	const lines: RichTextNode[][] = [[]];

	for (const child of children) {
		if (!("text" in child)) {
			lines[lines.length - 1].push(child);
			continue;
		}

		const parts = child.text.split(/\r?\n/);

		parts.forEach((part, index) => {
			if (index > 0) {
				lines.push([]);
			}

			if (part || parts.length === 1) {
				lines[lines.length - 1].push({
					...child,
					text: part,
				});
			}
		});
	}

	return lines;
}

function isBulletLine(line: RichTextNode[]) {
	const firstText = line.find((node) => "text" in node);
	return Boolean(firstText && /^(\s*[•*-]\s+)/.test(firstText.text));
}

function stripBulletPrefix(line: RichTextNode[]): RichTextNode[] {
	let strippedFirstText = false;

	return line
		.map((node) => {
			if (!("text" in node) || strippedFirstText) {
				return node;
			}

			strippedFirstText = true;
			return {
				...node,
				text: node.text.replace(/^\s*[•*-]\s+/, ""),
			};
		})
		.filter((node) => !("text" in node) || node.text.length > 0);
}

function isBlankLine(line: RichTextNode[]) {
	return line.every((node) => "text" in node && node.text.trim().length === 0);
}
