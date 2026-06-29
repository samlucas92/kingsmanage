import type { BaseEditor } from "slate";
import type { HistoryEditor } from "slate-history";
import type { ReactEditor } from "slate-react";

export type RichTextElement = {
	type: "paragraph" | "heading-one" | "heading-two" | "heading-three" | "bulleted-list" | "numbered-list" | "list-item" | "link";
	url?: string;
	children: RichTextNode[];
};

export type RichTextLeaf = {
	text: string;
	bold?: boolean;
	italic?: boolean;
	underline?: boolean;
};

export type RichTextNode = RichTextElement | RichTextLeaf;

declare module "slate" {
	interface CustomTypes {
		Editor: BaseEditor & ReactEditor & HistoryEditor;
		Element: RichTextElement;
		Text: RichTextLeaf;
	}
}
