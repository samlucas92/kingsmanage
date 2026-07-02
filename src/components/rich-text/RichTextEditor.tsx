import { useCallback, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createEditor, Editor, Element as SlateElement, Range, Transforms, type BaseRange } from "slate";
import { withHistory } from "slate-history";
import { Editable, ReactEditor, Slate, useFocused, useSelected, useSlate, useSlateStatic, withReact, type RenderElementProps, type RenderLeafProps } from "slate-react";

import { deserializeRichText, serializeRichText } from "../../utils/richText";
import { getManagedImageValidationError, uploadLinkedFile } from "../../services/fileService";
import type { ClubFileLinkedEntityType } from "../../types/files";
import ManagedFileImage from "../files/ManagedFileImage";

export type RichTextImageOwner = {
	linkedEntityType: ClubFileLinkedEntityType;
	linkedEntityId: string;
};

type Props = {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	compact?: boolean;
	onSubmit?: () => void;
	imageOwner?: RichTextImageOwner;
};

export default function RichTextEditor({ value, onChange, placeholder, compact = false, onSubmit, imageOwner }: Props) {
	const editor = useMemo(() => {
		const currentEditor = withHistory(withReact(createEditor()));
		const isInline = currentEditor.isInline;
		currentEditor.isInline = (element) =>
			element.type === "link" || isInline(element);
		const isVoid = currentEditor.isVoid;
		currentEditor.isVoid = (element) =>
			element.type === "image" || isVoid(element);
		return currentEditor;
	}, []);
	const initialValue = useMemo(() => deserializeRichText(value), [value]);
	const renderElement = useCallback(
		(props: RenderElementProps) => <Element {...props} imageOwner={imageOwner} />,
		[imageOwner]
	);
	const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);

	function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if (onSubmit && event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			onSubmit();
		}
	}

	return (
		<div className="overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-yepset-600 focus-within:ring-2 focus-within:ring-yepset-100">
			<Slate editor={editor} initialValue={initialValue} onChange={(nodes) => onChange(serializeRichText(nodes))}>
				<Toolbar compact={compact} imageOwner={imageOwner} />
				<Editable
					renderElement={renderElement}
					renderLeaf={renderLeaf}
					placeholder={placeholder}
					onKeyDown={handleKeyDown}
					style={compact ? { minHeight: "5rem" } : undefined}
					className={`${compact ? "max-h-40 min-h-20" : "min-h-44"} overflow-y-auto px-3 py-2.5 text-sm leading-6 outline-none`}
				/>
			</Slate>
		</div>
	);
}

function Toolbar({ compact = false, imageOwner }: { compact?: boolean; imageOwner?: RichTextImageOwner }) {
	const editor = useSlate();
	const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
	const [linkText, setLinkText] = useState("");
	const [linkUrl, setLinkUrl] = useState("");
	const [linkError, setLinkError] = useState("");
	const [isImageModalOpen, setIsImageModalOpen] = useState(false);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imageAlt, setImageAlt] = useState("");
	const [imageError, setImageError] = useState("");
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const savedSelection = useRef<BaseRange | null>(null);

	function openLinkModal() {
		savedSelection.current = editor.selection;
		setLinkText(editor.selection ? Editor.string(editor, editor.selection) : "");
		setLinkUrl("");
		setLinkError("");
		setIsLinkModalOpen(true);
	}

	function insertLink() {
		const text = linkText.trim() || linkUrl.trim();
		const enteredUrl = linkUrl.trim();
		if (!text || !enteredUrl) {
			setLinkError("Enter link text and a URL.");
			return;
		}
		const url = /^https?:\/\//i.test(enteredUrl) ? enteredUrl : `https://${enteredUrl}`;
		if (savedSelection.current) {
			Transforms.select(editor, savedSelection.current);
			if (!Range.isCollapsed(savedSelection.current)) {
				Transforms.delete(editor);
			}
		} else {
			Transforms.select(editor, Editor.end(editor, []));
		}
		Transforms.insertNodes(editor, {
			type: "link",
			url,
			children: [{ text }],
		});
		setIsLinkModalOpen(false);
	}

	async function insertImage() {
		if (!imageOwner || !imageFile) {
			setImageError("Choose an image.");
			return;
		}
		if (!imageAlt.trim()) {
			setImageError("Describe the image for people using screen readers.");
			return;
		}

		setIsUploadingImage(true);
		setImageError("");
		try {
			const validationError = await getManagedImageValidationError(imageFile, "editor");
			if (validationError) {
				setImageError(validationError);
				return;
			}
			const uploaded = await uploadLinkedFile({
				file: imageFile,
				linkedEntityType: imageOwner.linkedEntityType,
				linkedEntityId: imageOwner.linkedEntityId,
			});
			Transforms.insertNodes(editor, [
				{
					type: "image",
					fileId: uploaded.id,
					alt: imageAlt.trim(),
					children: [{ text: "" }],
				},
				{ type: "paragraph", children: [{ text: "" }] },
			]);
			setIsImageModalOpen(false);
			setImageFile(null);
			setImageAlt("");
		} catch (reason) {
			setImageError(reason instanceof Error ? reason.message : "Could not upload image.");
		} finally {
			setIsUploadingImage(false);
		}
	}

	return (
		<>
			<div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 p-2">
				<MarkButton editor={editor} format="bold" label="Bold" icon={<BoldIcon />} />
				<MarkButton editor={editor} format="italic" label="Italic" icon={<ItalicIcon />} />
				<MarkButton editor={editor} format="underline" label="Underline" icon={<UnderlineIcon />} />
				<HeadingSelect editor={editor} compact={compact} />
				{!compact && <BlockButton editor={editor} format="bulleted-list" label="Bulleted list" icon={<BulletedListIcon />} />}
				{!compact && <BlockButton editor={editor} format="numbered-list" label="Numbered list" icon={<NumberedListIcon />} />}
				<button type="button" onMouseDown={(event) => {
					event.preventDefault();
					openLinkModal();
				}} className={toolbarButtonClass(false)} aria-label="Insert link" title="Insert link"><LinkIcon /></button>
				{imageOwner && !compact && (
					<button type="button" onMouseDown={(event) => {
						event.preventDefault();
						setImageError("");
						setIsImageModalOpen(true);
					}} className={toolbarButtonClass(false)} aria-label="Insert image" title="Insert image"><ImageIcon /></button>
				)}
			</div>
			{isLinkModalOpen && (
				<div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4">
					<div role="dialog" aria-modal="true" aria-labelledby="link-dialog-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-xs font-black uppercase tracking-wide text-yepset-600">Rich text</p>
								<h2 id="link-dialog-title" className="mt-1 text-xl font-black text-slate-950">Insert link</h2>
							</div>
							<button type="button" onClick={() => setIsLinkModalOpen(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600">Close</button>
						</div>
						<div className="mt-5 space-y-4">
							<label className="block text-sm font-bold text-slate-700">Link text
								<input autoFocus value={linkText} onChange={(event) => setLinkText(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal outline-none focus:border-yepset-600 focus:ring-2 focus:ring-yepset-100" />
							</label>
							<label className="block text-sm font-bold text-slate-700">URL
								<input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://example.com" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal outline-none focus:border-yepset-600 focus:ring-2 focus:ring-yepset-100" />
							</label>
							{linkError && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{linkError}</p>}
						</div>
						<div className="mt-5 flex justify-end gap-2">
							<button type="button" onClick={() => setIsLinkModalOpen(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">Cancel</button>
							<button type="button" onClick={insertLink} className="rounded-xl bg-yepset-700 px-4 py-2 text-sm font-bold text-white hover:bg-yepset-800">Insert link</button>
						</div>
					</div>
				</div>
			)}
			{isImageModalOpen && (
				<div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4">
					<div role="dialog" aria-modal="true" aria-labelledby="image-dialog-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
						<h2 id="image-dialog-title" className="text-xl font-black text-slate-950">Insert image</h2>
						<div className="mt-5 space-y-4">
							<label className="block text-sm font-bold text-slate-700">Image
								<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm font-normal" />
							</label>
							<label className="block text-sm font-bold text-slate-700">Image description
								<input value={imageAlt} onChange={(event) => setImageAlt(event.target.value)} placeholder="Players celebrating after the match" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal outline-none focus:border-yepset-600 focus:ring-2 focus:ring-yepset-100" />
							</label>
							{imageError && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{imageError}</p>}
						</div>
						<div className="mt-5 flex justify-end gap-2">
							<button type="button" onClick={() => setIsImageModalOpen(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">Cancel</button>
							<button type="button" disabled={isUploadingImage} onClick={() => void insertImage()} className="rounded-xl bg-yepset-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{isUploadingImage ? "Uploading..." : "Insert image"}</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

function MarkButton({ editor, format, label, icon }: { editor: Editor; format: "bold" | "italic" | "underline"; label: string; icon: React.ReactNode }) {
	const active = Boolean(Editor.marks(editor)?.[format]);
	return <button type="button" onMouseDown={(event) => {
		event.preventDefault();
		if (Editor.marks(editor)?.[format]) Editor.removeMark(editor, format);
		else Editor.addMark(editor, format, true);
	}} className={toolbarButtonClass(active)} aria-label={label} title={label}>{icon}</button>;
}

function BlockButton({ editor, format, label, icon }: { editor: Editor; format: "bulleted-list" | "numbered-list"; label: string; icon: React.ReactNode }) {
	const active = isBlockActive(editor, format);
	return <button type="button" onMouseDown={(event) => {
		event.preventDefault();
		toggleList(editor, format);
	}} className={toolbarButtonClass(active)} aria-label={label} title={label}>{icon}</button>;
}

function HeadingSelect({
	editor,
	compact = false,
}: {
	editor: Editor;
	compact?: boolean;
}) {
	const value = getHeadingType(editor);
	return (
		<select
			value={value}
			onChange={(event) => setHeading(editor, event.target.value as HeadingType)}
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

type HeadingType = "paragraph" | "heading-one" | "heading-two" | "heading-three";

function setHeading(editor: Editor, format: HeadingType) {
	Transforms.unwrapNodes(editor, {
		match: (node) => SlateElement.isElement(node) && ["bulleted-list", "numbered-list"].includes(node.type),
		split: true,
	});
	Transforms.setNodes(editor, { type: format }, {
		match: (node) => SlateElement.isElement(node) && Editor.isBlock(editor, node),
	});
}

function toggleList(editor: Editor, format: "bulleted-list" | "numbered-list") {
	const active = isBlockActive(editor, format);
	Transforms.unwrapNodes(editor, {
		match: (node) => SlateElement.isElement(node) && ["bulleted-list", "numbered-list"].includes(node.type),
		split: true,
	});
	Transforms.setNodes(editor, { type: active ? "paragraph" : "list-item" });
	if (!active) {
		Transforms.wrapNodes(editor, { type: format, children: [] });
	}
}

function isBlockActive(editor: Editor, format: string) {
	const [match] = Editor.nodes(editor, {
		match: (node) => SlateElement.isElement(node) && node.type === format,
	});
	return Boolean(match);
}

function getHeadingType(editor: Editor): HeadingType {
	for (const format of ["heading-one", "heading-two", "heading-three"] as const) {
		if (isBlockActive(editor, format)) return format;
	}
	return "paragraph";
}

function toolbarButtonClass(active: boolean) {
	return `grid h-8 w-8 place-items-center rounded-md transition ${
		active
			? "bg-yepset-700 text-white"
			: "text-yepset-800 hover:bg-yepset-100"
	}`;
}

function Icon({ children }: { children: React.ReactNode }) {
	return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
}

function BoldIcon() { return <Icon><path d="M7 5h6a4 4 0 0 1 0 8H7z" /><path d="M7 13h7a4 4 0 0 1 0 8H7z" /></Icon>; }
function ItalicIcon() { return <Icon><path d="M10 5h8M6 19h8M14 5 10 19" /></Icon>; }
function UnderlineIcon() { return <Icon><path d="M6 4v7a6 6 0 0 0 12 0V4M5 21h14" /></Icon>; }
function BulletedListIcon() { return <Icon><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></Icon>; }
function NumberedListIcon() { return <Icon><path d="M10 6h10M10 12h10M10 18h10M4 4h1v4M4 11h2l-2 3h2M4 17h2v3H4" /></Icon>; }
function LinkIcon() { return <Icon><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2" /></Icon>; }
function ImageIcon() { return <Icon><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m21 15-5-5L5 20" /></Icon>; }

function Element({ attributes, children, element, imageOwner }: RenderElementProps & { imageOwner?: RichTextImageOwner }) {
	switch (element.type) {
		case "heading-one": return <h1 {...attributes} className="text-2xl font-black">{children}</h1>;
		case "heading-two": return <h2 {...attributes} className="text-lg font-bold">{children}</h2>;
		case "heading-three": return <h3 {...attributes} className="text-base font-bold">{children}</h3>;
		case "bulleted-list": return <ul {...attributes} className="list-disc pl-6">{children}</ul>;
		case "numbered-list": return <ol {...attributes} className="list-decimal pl-6">{children}</ol>;
		case "list-item": return <li {...attributes}>{children}</li>;
		case "link": return <a {...attributes} href={element.url} className="text-yepset-700 underline">{children}</a>;
		case "image": return <ImageElement attributes={attributes} element={element} imageOwner={imageOwner}>{children}</ImageElement>;
		default: return <p {...attributes}>{children}</p>;
	}
}

function ImageElement({ attributes, children, element, imageOwner }: RenderElementProps & { imageOwner?: RichTextImageOwner }) {
	const editor = useSlateStatic();
	const selected = useSelected();
	const focused = useFocused();
	const [error, setError] = useState("");
	const [isReplacing, setIsReplacing] = useState(false);

	async function remove() {
		if (!element.fileId) return;
		Transforms.removeNodes(editor, { at: ReactEditor.findPath(editor, element) });
	}

	async function replace(file: File) {
		if (!imageOwner || !element.fileId) return;
		setIsReplacing(true);
		setError("");
		try {
			const validationError = await getManagedImageValidationError(file, "editor");
			if (validationError) {
				setError(validationError);
				return;
			}
			const uploaded = await uploadLinkedFile({
				file,
				linkedEntityType: imageOwner.linkedEntityType,
				linkedEntityId: imageOwner.linkedEntityId,
			});
			Transforms.setNodes(
				editor,
				{ fileId: uploaded.id, alt: element.alt || file.name },
				{ at: ReactEditor.findPath(editor, element) }
			);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Could not replace image.");
		} finally {
			setIsReplacing(false);
		}
	}

	return (
		<figure {...attributes} className={`my-3 rounded-xl border p-2 ${selected && focused ? "border-yepset-500 ring-2 ring-yepset-100" : "border-slate-200"}`}>
			{children}
			<div contentEditable={false}>
				{element.fileId && <ManagedFileImage fileId={element.fileId} alt={element.alt ?? ""} className="max-h-96 w-full rounded-lg object-contain" />}
				<input
					value={element.alt ?? ""}
					onChange={(event) => Transforms.setNodes(editor, { alt: event.target.value }, { at: ReactEditor.findPath(editor, element) })}
					aria-label="Image description"
					className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600"
				/>
				<div className="mt-2 flex flex-wrap gap-2">
					{imageOwner && <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700">Replace<input type="file" accept="image/jpeg,image/png,image/webp" disabled={isReplacing} onChange={(event) => { const file = event.target.files?.[0]; if (file) void replace(file); }} className="sr-only" /></label>}
					<button type="button" onClick={() => void remove()} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700">Remove</button>
				</div>
				{error && <p className="mt-2 text-xs font-semibold text-red-700">{error}</p>}
			</div>
		</figure>
	);
}

function Leaf({ attributes, children, leaf }: RenderLeafProps) {
	let content = children;
	if (leaf.bold) content = <strong>{content}</strong>;
	if (leaf.italic) content = <em>{content}</em>;
	if (leaf.underline) content = <u>{content}</u>;
	return <span {...attributes}>{content}</span>;
}
