import { createEditor, Editor, Node, Transforms, type Descendant } from "slate";
import { describe, expect, it, vi } from "vitest";
import {
	handleListKeyDown,
	indentListItem,
	outdentListItem,
	toggleList,
	withStandardLists,
} from "./standardLists";

function createListEditor(children: Descendant[]) {
	const editor = withStandardLists(createEditor());
	editor.children = children;
	return editor;
}

function list(...items: string[]): Descendant[] {
	return [
		{
			type: "bulleted-list",
			children: items.map((text) => ({
				type: "list-item",
				children: [{ text }],
			})),
		},
	];
}

describe("standard Slate lists", () => {
	it("splits a non-empty item when Enter is pressed", () => {
		const editor = createListEditor(list("First item"));
		Transforms.select(editor, { path: [0, 0, 0], offset: 5 });

		editor.insertBreak();

		expect(editor.children).toEqual(list("First", " item"));
	});

	it("exits a list when Enter is pressed on an empty item", () => {
		const editor = createListEditor(list("First item", ""));
		Transforms.select(editor, { path: [0, 1, 0], offset: 0 });

		editor.insertBreak();

		expect(editor.children).toEqual([
			...list("First item"),
			{ type: "paragraph", children: [{ text: "" }] },
		]);
	});

	it("exits a root list when Backspace is pressed at the first item start", () => {
		const editor = createListEditor(list("First item", "Second item"));
		Transforms.select(editor, { path: [0, 0, 0], offset: 0 });

		editor.deleteBackward("character");

		expect(editor.children).toEqual([
			{ type: "paragraph", children: [{ text: "First item" }] },
			...list("Second item"),
		]);
	});

	it("indents and outdents list items with semantic nested lists", () => {
		const editor = createListEditor(list("Parent", "Child"));
		Transforms.select(editor, { path: [0, 1, 0], offset: 3 });

		expect(indentListItem(editor)).toBe(true);
		expect(Node.string(editor.children[0])).toBe("ParentChild");
		expect(editor.children).toEqual([
			{
				type: "bulleted-list",
				children: [
					{
						type: "list-item",
						children: [
							{ text: "Parent" },
							{
								type: "bulleted-list",
								children: [
									{
										type: "list-item",
										children: [{ text: "Child" }],
									},
								],
							},
						],
					},
				],
			},
		]);

		expect(outdentListItem(editor)).toBe(true);
		expect(editor.children).toEqual(list("Parent", "Child"));
	});

	it("handles Tab and Shift+Tab only while the cursor is in a list", () => {
		const editor = createListEditor(list("Parent", "Child"));
		const preventDefault = vi.fn();
		Transforms.select(editor, { path: [0, 1, 0], offset: 0 });

		expect(
			handleListKeyDown(editor, {
				key: "Tab",
				shiftKey: false,
				preventDefault,
			})
		).toBe(true);
		expect(preventDefault).toHaveBeenCalledOnce();

		expect(
			handleListKeyDown(editor, {
				key: "Tab",
				shiftKey: true,
				preventDefault,
			})
		).toBe(true);
	});

	it("toggles paragraphs into lists and switches list styles", () => {
		const editor = createListEditor([
			{ type: "paragraph", children: [{ text: "One" }] },
			{ type: "paragraph", children: [{ text: "Two" }] },
		]);
		Transforms.select(editor, {
			anchor: Editor.start(editor, [0]),
			focus: Editor.end(editor, [1]),
		});

		toggleList(editor, "bulleted-list");
		expect((editor.children[0] as { type: string }).type).toBe("bulleted-list");

		toggleList(editor, "numbered-list");
		expect((editor.children[0] as { type: string }).type).toBe("numbered-list");

		toggleList(editor, "numbered-list");
		expect(editor.children).toEqual([
			{ type: "paragraph", children: [{ text: "One" }] },
			{ type: "paragraph", children: [{ text: "Two" }] },
		]);
	});
});
