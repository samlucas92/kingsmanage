const allowedTags = new Set([
	"a",
	"br",
	"em",
	"figcaption",
	"figure",
	"h1",
	"h2",
	"h3",
	"img",
	"li",
	"ol",
	"p",
	"strong",
	"u",
	"ul",
]);

export function getSelectedPostHtml(selection: Selection, root: HTMLElement) {
	if (selection.rangeCount === 0 || selection.isCollapsed) {
		return null;
	}

	const container = document.createElement("div");

	for (let index = 0; index < selection.rangeCount; index += 1) {
		const range = selection.getRangeAt(index);

		if (!selectionRangeIntersectsElement(range, root)) {
			continue;
		}

		container.appendChild(range.cloneContents());
	}

	if (!container.textContent?.trim()) {
		return null;
	}

	return {
		html: sanitizeCopiedPostHtml(container.innerHTML),
		text: selection.toString(),
	};
}

export function writeSelectedPostHtmlToClipboard(
	event: ClipboardEvent,
	root: HTMLElement
) {
	const selection = root.ownerDocument.getSelection();

	if (!selection || !event.clipboardData) {
		return false;
	}

	const selectedPostContent = getSelectedPostHtml(selection, root);

	if (!selectedPostContent) {
		return false;
	}

	event.clipboardData.setData("text/html", selectedPostContent.html);
	event.clipboardData.setData("text/plain", selectedPostContent.text);
	event.preventDefault();

	return true;
}

export function sanitizeCopiedPostHtml(html: string) {
	if (typeof document === "undefined") {
		return sanitizeCopiedPostHtmlFallback(html);
	}

	const template = document.createElement("template");
	template.innerHTML = html;

	const output = document.createElement("div");

	for (const child of Array.from(template.content.childNodes)) {
		output.appendChild(cleanCopiedNode(child));
	}

	return output.innerHTML;
}

function selectionRangeIntersectsElement(range: Range, element: HTMLElement) {
	if (typeof range.intersectsNode === "function") {
		return range.intersectsNode(element);
	}

	return element.contains(range.commonAncestorContainer);
}

function cleanCopiedNode(node: Node): Node {
	if (node.nodeType === Node.TEXT_NODE) {
		return document.createTextNode(node.textContent ?? "");
	}

	if (node.nodeType !== Node.ELEMENT_NODE) {
		return document.createDocumentFragment();
	}

	const element = node as HTMLElement;
	const tagName = element.tagName.toLowerCase();
	const children = Array.from(element.childNodes).map(cleanCopiedNode);

	if (!allowedTags.has(tagName)) {
		const fragment = document.createDocumentFragment();
		children.forEach((child) => fragment.appendChild(child));
		return fragment;
	}

	const copy = document.createElement(tagName);

	if (tagName === "a") {
		const href = element.getAttribute("href");

		if (href && /^https?:\/\//i.test(href)) {
			copy.setAttribute("href", href);
		}
	}

	if (tagName === "img") {
		const src = element.getAttribute("src");
		const alt = element.getAttribute("alt");

		if (src) {
			copy.setAttribute("src", src);
		}

		if (alt) {
			copy.setAttribute("alt", alt);
		}
	}

	children.forEach((child) => copy.appendChild(child));

	return copy;
}

function sanitizeCopiedPostHtmlFallback(html: string) {
	return html
		.replace(/<!--[\s\S]*?-->/g, "")
		.replace(/\s(?:class|style|id|data-[\w-]+|aria-[\w-]+)="[^"]*"/g, "")
		.replace(/\s(?:class|style|id|data-[\w-]+|aria-[\w-]+)='[^']*'/g, "")
		.replace(/\s(?:role|target|rel)="[^"]*"/g, "")
		.replace(/\s(?:role|target|rel)='[^']*'/g, "")
		.replace(/<a\b([^>]*)href=["'](?!https?:\/\/)[^"']*["']([^>]*)>/gi, "<a$1$2>")
		.replace(/<\/?(div|span|section|article)\b[^>]*>/gi, "")
		.replace(/<([a-z0-9]+)\s+>/gi, "<$1>");
}
