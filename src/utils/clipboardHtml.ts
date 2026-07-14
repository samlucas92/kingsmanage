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
		text: getCopiedPostPlainText(container),
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

export function getCopiedPostPlainText(html: string | HTMLElement) {
	if (typeof html !== "string") {
		return normalizeClipboardText(getPlainTextFromNode(html));
	}

	if (typeof document === "undefined") {
		return normalizeClipboardText(getPlainTextFromHtmlFallback(html));
	}

	const template = document.createElement("template");
	template.innerHTML = html;
	return normalizeClipboardText(getPlainTextFromNode(template.content));
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

function getPlainTextFromNode(node: Node): string {
	if (node.nodeType === Node.TEXT_NODE) {
		return node.textContent ?? "";
	}

	if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
		return "";
	}

	const element = node as HTMLElement;
	const tagName = element.nodeType === Node.ELEMENT_NODE
		? element.tagName.toLowerCase()
		: "";

	if (tagName === "br") {
		return "\n";
	}

	if (tagName === "a") {
		const text = getChildrenPlainText(element).trim();
		const href = element.getAttribute("href");

		if (href && /^https?:\/\//i.test(href) && text && text !== href) {
			return `${text} (${href})`;
		}

		return text || href || "";
	}

	if (tagName === "ul") {
		return getListPlainText(element, false);
	}

	if (tagName === "ol") {
		return getListPlainText(element, true);
	}

	if (tagName === "li") {
		return getChildrenPlainText(element);
	}

	const text = getChildrenPlainText(node);

	if (["p", "h1", "h2", "h3", "figure", "figcaption"].includes(tagName)) {
		return `${text}\n\n`;
	}

	return text;
}

function getChildrenPlainText(node: Node) {
	return Array.from(node.childNodes).map(getPlainTextFromNode).join("");
}

function getListPlainText(list: HTMLElement, numbered: boolean) {
	const items = Array.from(list.children).filter(
		(child) => child.tagName.toLowerCase() === "li"
	);

	return `${items
		.map((item, index) => {
			const marker = numbered ? `${index + 1}.` : "-";
			return `${marker} ${getChildrenPlainText(item).trim()}`;
		})
		.join("\n")}\n\n`;
}

function getPlainTextFromHtmlFallback(html: string) {
	return html
		.replace(
			/<a\b[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
			(_match, href: string, label: string) => {
				const cleanLabel = stripHtml(label).trim();
				return cleanLabel && cleanLabel !== href
					? `${cleanLabel} (${href})`
					: href;
			}
		)
		.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_match, item: string) => `- ${stripHtml(item).trim()}\n`)
		.replace(/<\/(p|h1|h2|h3|ul|ol|figure|figcaption)>/gi, "\n\n")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<[^>]+>/g, "");
}

function stripHtml(value: string) {
	return value.replace(/<[^>]+>/g, "");
}

function normalizeClipboardText(value: string) {
	return value
		.replace(/\u00a0/g, " ")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
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
