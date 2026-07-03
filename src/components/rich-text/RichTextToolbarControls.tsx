import { Editor } from "slate";
import {
	getHeadingType,
	setHeading,
	toolbarButtonClass,
	type HeadingType,
} from "./richTextBlocks";
import {
	isListActive,
	toggleList,
	type ListType,
} from "./standardLists";

export function MarkButton({
	editor,
	format,
	label,
	icon,
}: {
	editor: Editor;
	format: "bold" | "italic" | "underline";
	label: string;
	icon: React.ReactNode;
}) {
	const active = Boolean(Editor.marks(editor)?.[format]);
	return (
		<ToolbarButton
			active={active}
			label={label}
			icon={icon}
			onPress={() => {
				if (active) Editor.removeMark(editor, format);
				else Editor.addMark(editor, format, true);
			}}
		/>
	);
}

export function ListButton({
	editor,
	format,
	label,
	icon,
}: {
	editor: Editor;
	format: ListType;
	label: string;
	icon: React.ReactNode;
}) {
	return (
		<ToolbarButton
			active={isListActive(editor, format)}
			label={label}
			icon={icon}
			onPress={() => toggleList(editor, format)}
		/>
	);
}

export function HeadingSelect({
	editor,
	compact,
}: {
	editor: Editor;
	compact: boolean;
}) {
	return (
		<select
			value={getHeadingType(editor)}
			onChange={(event) =>
				setHeading(editor, event.target.value as HeadingType)
			}
			className={`h-8 shrink-0 rounded-md border border-yepset-200 bg-white px-2 text-xs font-bold text-yepset-800 outline-none ${
				compact ? "w-28" : ""
			}`}
			aria-label="Text style"
			title="Text style"
		>
			<option value="paragraph">Paragraph</option>
			<option value="heading-one">Heading 1</option>
			<option value="heading-two">Heading 2</option>
			<option value="heading-three">Heading 3</option>
		</select>
	);
}

export function ToolbarButton({
	active = false,
	label,
	icon,
	onPress,
}: {
	active?: boolean;
	label: string;
	icon: React.ReactNode;
	onPress: () => void;
}) {
	return (
		<button
			type="button"
			onMouseDown={(event) => {
				event.preventDefault();
				onPress();
			}}
			className={toolbarButtonClass(active)}
			aria-label={label}
			title={label}
		>
			{icon}
		</button>
	);
}
