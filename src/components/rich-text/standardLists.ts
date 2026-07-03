import {
	Editor,
	Element as SlateElement,
	Node,
	Path,
	Range,
	Transforms,
	type Element,
} from "slate";

export type ListType = "bulleted-list" | "numbered-list";

type ListKeyboardEvent = {
	key: string;
	shiftKey: boolean;
	preventDefault: () => void;
};

const listTypes: ListType[] = ["bulleted-list", "numbered-list"];

export function withStandardLists<T extends Editor>(editor: T): T {
	const { deleteBackward, insertBreak, normalizeNode } = editor;

	editor.insertBreak = () => {
		const itemEntry = getCurrentListItem(editor);
		if (!itemEntry || !editor.selection || !Range.isCollapsed(editor.selection)) {
			insertBreak();
			return;
		}

		if (Node.string(itemEntry[0]).length === 0) {
			outdentListItem(editor);
			return;
		}

		insertBreak();
	};

	editor.deleteBackward = (unit) => {
		const itemEntry = getCurrentListItem(editor);
		if (
			!itemEntry ||
			!editor.selection ||
			!Range.isCollapsed(editor.selection) ||
			!Editor.isStart(editor, editor.selection.anchor, itemEntry[1])
		) {
			deleteBackward(unit);
			return;
		}

		const [, itemPath] = itemEntry;
		const listPath = Path.parent(itemPath);
		if (isNestedList(editor, listPath) || itemPath.at(-1) === 0) {
			outdentListItem(editor);
			return;
		}

		deleteBackward(unit);
	};

	editor.normalizeNode = (entry) => {
		const [node, path] = entry;

		if (isList(node)) {
			for (const [child, index] of node.children.map(
				(child, index) => [child, index] as const
			)) {
				if (!isListItem(child)) {
					Transforms.setNodes(
						editor,
						{ type: "list-item" },
						{ at: path.concat(index) }
					);
					return;
				}
			}
		}

		if (isListItem(node)) {
			if (node.children.length === 0) {
				Transforms.insertNodes(editor, { text: "" }, { at: path.concat(0) });
				return;
			}

			// A list item may contain its text followed by a nested list. Slate's
			// default block/text normalization would otherwise remove that valid
			// HTML list structure.
			return;
		}

		normalizeNode(entry);
	};

	return editor;
}

export function handleListKeyDown(
	editor: Editor,
	event: ListKeyboardEvent
) {
	if (event.key !== "Tab" || !getCurrentListItem(editor)) return false;

	event.preventDefault();
	if (event.shiftKey) {
		outdentListItem(editor);
	} else {
		indentListItem(editor);
	}
	return true;
}

export function toggleList(editor: Editor, format: ListType) {
	if (!editor.selection) return;

	const currentList = Editor.above(editor, {
		match: (node) => isList(node),
	});

	if (currentList && isList(currentList[0]) && currentList[0].type !== format) {
		Transforms.setNodes(editor, { type: format }, { at: currentList[1] });
		return;
	}

	const active = Boolean(currentList);
	Transforms.unwrapNodes(editor, {
		match: (node) => isList(node),
		split: true,
	});
	Transforms.setNodes(
		editor,
		{ type: active ? "paragraph" : "list-item" },
		{
			match: (node) =>
				SlateElement.isElement(node) &&
				Editor.isBlock(editor, node) &&
				!isList(node),
		}
	);

	if (!active) {
		Transforms.wrapNodes(editor, { type: format, children: [] });
	}
}

export function isListActive(editor: Editor, format?: ListType) {
	const [match] = Editor.nodes(editor, {
		match: (node) =>
			isList(node) && (format === undefined || node.type === format),
	});
	return Boolean(match);
}

export function indentListItem(editor: Editor) {
	const itemEntry = getCurrentListItem(editor);
	if (!itemEntry || !editor.selection) return false;

	const [item, itemPath] = itemEntry;
	const itemIndex = itemPath.at(-1);
	if (itemIndex === undefined || itemIndex === 0) return false;

	const listPath = Path.parent(itemPath);
	const list = Node.get(editor, listPath);
	if (!isList(list)) return false;

	const previousItemPath = Path.previous(itemPath);
	const previousItem = Node.get(editor, previousItemPath);
	if (!isListItem(previousItem)) return false;

	const relativeAnchor = Path.relative(editor.selection.anchor.path, itemPath);
	const relativeFocus = Path.relative(editor.selection.focus.path, itemPath);
	const anchorOffset = editor.selection.anchor.offset;
	const focusOffset = editor.selection.focus.offset;
	const nestedListIndex = previousItem.children.findIndex(
		(child) => isList(child) && child.type === list.type
	);
	let newItemPath: Path = itemPath;

	Editor.withoutNormalizing(editor, () => {
		Transforms.removeNodes(editor, { at: itemPath });

		if (nestedListIndex >= 0) {
			const nestedListPath = previousItemPath.concat(nestedListIndex);
			const nestedList = Node.get(editor, nestedListPath);
			if (!isList(nestedList)) return;
			newItemPath = nestedListPath.concat(nestedList.children.length);
			Transforms.insertNodes(editor, item, { at: newItemPath });
		} else {
			const nestedListPath = previousItemPath.concat(previousItem.children.length);
			newItemPath = nestedListPath.concat(0);
			Transforms.insertNodes(
				editor,
				{ type: list.type, children: [item] },
				{ at: nestedListPath }
			);
		}

		selectRelativeRange(
			editor,
			newItemPath,
			relativeAnchor,
			relativeFocus,
			anchorOffset,
			focusOffset
		);
	});

	return true;
}

export function outdentListItem(editor: Editor) {
	const itemEntry = getCurrentListItem(editor);
	if (!itemEntry || !editor.selection) return false;

	const [item, itemPath] = itemEntry;
	const listPath = Path.parent(itemPath);
	const list = Node.get(editor, listPath);
	if (!isList(list)) return false;

	if (!isNestedList(editor, listPath)) {
		return exitRootListItem(editor, itemPath);
	}

	const parentItemPath = Path.parent(listPath);
	const outerListPath = Path.parent(parentItemPath);
	const parentItemIndex = parentItemPath.at(-1);
	if (parentItemIndex === undefined) return false;

	const relativeAnchor = Path.relative(editor.selection.anchor.path, itemPath);
	const relativeFocus = Path.relative(editor.selection.focus.path, itemPath);
	const anchorOffset = editor.selection.anchor.offset;
	const focusOffset = editor.selection.focus.offset;
	const targetPath = outerListPath.concat(parentItemIndex + 1);

	Editor.withoutNormalizing(editor, () => {
		Transforms.removeNodes(editor, { at: itemPath });
		if (list.children.length === 1) {
			Transforms.removeNodes(editor, { at: listPath });
		}
		Transforms.insertNodes(editor, item, { at: targetPath });
		selectRelativeRange(
			editor,
			targetPath,
			relativeAnchor,
			relativeFocus,
			anchorOffset,
			focusOffset
		);
	});

	return true;
}

function exitRootListItem(editor: Editor, itemPath: Path) {
	const pathRef = Editor.pathRef(editor, itemPath);
	Editor.withoutNormalizing(editor, () => {
		Transforms.unwrapNodes(editor, {
			at: itemPath,
			match: (node) => isList(node),
			split: true,
		});
		const unwrappedPath = pathRef.current;
		if (unwrappedPath) {
			Transforms.setNodes(editor, { type: "paragraph" }, { at: unwrappedPath });
			Transforms.select(editor, Editor.start(editor, unwrappedPath));
		}
	});
	pathRef.unref();
	return true;
}

function selectRelativeRange(
	editor: Editor,
	itemPath: Path,
	relativeAnchor: Path,
	relativeFocus: Path,
	anchorOffset: number,
	focusOffset: number
) {
	Transforms.select(editor, {
		anchor: { path: itemPath.concat(relativeAnchor), offset: anchorOffset },
		focus: { path: itemPath.concat(relativeFocus), offset: focusOffset },
	});
}

function getCurrentListItem(editor: Editor): [Element, Path] | undefined {
	if (!editor.selection) return undefined;
	return Editor.above(editor, {
		at: editor.selection,
		match: (node) => isListItem(node),
	}) as [Element, Path] | undefined;
}

function isNestedList(editor: Editor, listPath: Path) {
	if (listPath.length < 2) return false;
	const parent = Node.get(editor, Path.parent(listPath));
	return isListItem(parent);
}

function isList(node: Node): node is Element & { type: ListType } {
	return SlateElement.isElement(node) && listTypes.includes(node.type as ListType);
}

function isListItem(node: Node): node is Element & { type: "list-item" } {
	return SlateElement.isElement(node) && node.type === "list-item";
}
