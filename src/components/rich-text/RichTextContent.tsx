import type { Descendant } from "slate";

import type { RichTextElement, RichTextLeaf } from "../../types/slate";
import {
	deserializeRichText,
	isRichText,
	normalizeBulletListParagraphs,
} from "../../utils/richText";
import PostBody from "../posts/PostBody";
import ManagedFileImage from "../files/ManagedFileImage";

export default function RichTextContent({ value, className = "", inverted = false }: { value: string; className?: string; inverted?: boolean }) {
	if (!isRichText(value)) {
		return <div className={`whitespace-pre-wrap ${className}`}><PostBody body={value} inverted={inverted} /></div>;
	}

	const nodes = deserializeRichText(normalizeBulletListParagraphs(value));

	return <div className={`space-y-2 ${className}`}>{nodes.map((node, index) => <NodeView key={index} node={node} inverted={inverted} />)}</div>;
}

function NodeView({ node, inverted }: { node: Descendant; inverted: boolean }) {
	if ("text" in node) return <LeafView leaf={node as RichTextLeaf} />;
	const element = node as RichTextElement;
	const children = element.children.map((child, index) => <NodeView key={index} node={child as Descendant} inverted={inverted} />);
	switch (element.type) {
		case "heading-one": return <h1 className="text-2xl font-black">{children}</h1>;
		case "heading-two": return <h2 className="text-lg font-bold">{children}</h2>;
		case "heading-three": return <h3 className="text-base font-bold">{children}</h3>;
		case "bulleted-list": return <ul className="my-1 list-disc space-y-1 pl-6">{children}</ul>;
		case "numbered-list": return <ol className="my-1 list-decimal space-y-1 pl-6">{children}</ol>;
		case "list-item": return <li className="pl-1">{children}</li>;
		case "link": {
			const safeUrl = element.url && /^https?:\/\//i.test(element.url) ? element.url : undefined;
			return safeUrl
				? <a href={safeUrl} target="_blank" rel="noreferrer" className={`font-semibold underline ${inverted ? "text-white" : "text-blue-700"}`}>{children}</a>
				: <span>{children}</span>;
		}
		case "image":
			return element.fileId
				? <figure><ManagedFileImage fileId={element.fileId} alt={element.alt ?? ""} className="max-h-[32rem] w-full rounded-xl object-contain" /></figure>
				: null;
		default: return <p>{children}</p>;
	}
}

function LeafView({ leaf }: { leaf: RichTextLeaf }) {
	let content: React.ReactNode = leaf.text;
	if (leaf.bold) content = <strong>{content}</strong>;
	if (leaf.italic) content = <em>{content}</em>;
	if (leaf.underline) content = <u>{content}</u>;
	return <>{content}</>;
}
