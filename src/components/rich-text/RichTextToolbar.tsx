import { useSlate } from "slate-react";
import { ImageDialog, LinkDialog } from "./RichTextDialogs";
import {
	HeadingSelect,
	ListButton,
	MarkButton,
	ToolbarButton,
} from "./RichTextToolbarControls";
import {
	BoldIcon,
	BulletedListIcon,
	ImageIcon,
	ItalicIcon,
	LinkIcon,
	NumberedListIcon,
	UnderlineIcon,
} from "./RichTextToolbarIcons";
import type { RichTextImageOwner } from "./types";
import { useRichTextInsertions } from "./useRichTextInsertions";

export function RichTextToolbar({
	compact = false,
	imageOwner,
}: {
	compact?: boolean;
	imageOwner?: RichTextImageOwner;
}) {
	const editor = useSlate();
	const insertions = useRichTextInsertions(editor, imageOwner);

	return (
		<>
			<div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 p-2">
				<MarkButton editor={editor} format="bold" label="Bold" icon={<BoldIcon />} />
				<MarkButton editor={editor} format="italic" label="Italic" icon={<ItalicIcon />} />
				<MarkButton editor={editor} format="underline" label="Underline" icon={<UnderlineIcon />} />
				<HeadingSelect editor={editor} compact={compact} />
				{!compact && (
					<>
						<ListButton editor={editor} format="bulleted-list" label="Bulleted list" icon={<BulletedListIcon />} />
						<ListButton editor={editor} format="numbered-list" label="Numbered list" icon={<NumberedListIcon />} />
					</>
				)}
				<ToolbarButton
					label="Insert link"
					icon={<LinkIcon />}
					onPress={insertions.link.open}
				/>
				{imageOwner && !compact && (
					<ToolbarButton
						label="Insert image"
						icon={<ImageIcon />}
						onPress={insertions.image.open}
					/>
				)}
			</div>

			{insertions.link.isOpen && (
				<LinkDialog
					text={insertions.link.text}
					url={insertions.link.url}
					error={insertions.link.error}
					onTextChange={insertions.link.setText}
					onUrlChange={insertions.link.setUrl}
					onCancel={insertions.link.close}
					onInsert={insertions.link.insert}
				/>
			)}
			{insertions.image.isOpen && (
				<ImageDialog
					alt={insertions.image.alt}
					error={insertions.image.error}
					isUploading={insertions.image.isUploading}
					onFileChange={insertions.image.setFile}
					onAltChange={insertions.image.setAlt}
					onCancel={insertions.image.close}
					onInsert={() => void insertions.image.insert()}
				/>
			)}
		</>
	);
}
