import { useRef, useState } from "react";
import {
	Editor,
	Range,
	Transforms,
	type BaseRange,
} from "slate";
import {
	getManagedImageValidationError,
	uploadLinkedFile,
} from "../../services/fileService";
import type { RichTextImageOwner } from "./types";

export function useRichTextInsertions(
	editor: Editor,
	imageOwner?: RichTextImageOwner
) {
	const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
	const [linkText, setLinkText] = useState("");
	const [linkUrl, setLinkUrl] = useState("");
	const [linkError, setLinkError] = useState("");
	const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imageAlt, setImageAlt] = useState("");
	const [imageError, setImageError] = useState("");
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const savedSelection = useRef<BaseRange | null>(null);

	function openLinkDialog() {
		savedSelection.current = editor.selection;
		setLinkText(
			editor.selection ? Editor.string(editor, editor.selection) : ""
		);
		setLinkUrl("");
		setLinkError("");
		setIsLinkDialogOpen(true);
	}

	function insertLink() {
		const text = linkText.trim() || linkUrl.trim();
		const enteredUrl = linkUrl.trim();
		if (!text || !enteredUrl) {
			setLinkError("Enter link text and a URL.");
			return;
		}

		const url = /^https?:\/\//i.test(enteredUrl)
			? enteredUrl
			: `https://${enteredUrl}`;
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
		setIsLinkDialogOpen(false);
	}

	function openImageDialog() {
		setImageError("");
		setIsImageDialogOpen(true);
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
			const validationError = await getManagedImageValidationError(
				imageFile,
				"editor"
			);
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
			setIsImageDialogOpen(false);
			setImageFile(null);
			setImageAlt("");
		} catch (reason) {
			setImageError(
				reason instanceof Error
					? reason.message
					: "Could not upload image."
			);
		} finally {
			setIsUploadingImage(false);
		}
	}

	return {
		link: {
			isOpen: isLinkDialogOpen,
			text: linkText,
			url: linkUrl,
			error: linkError,
			setText: setLinkText,
			setUrl: setLinkUrl,
			open: openLinkDialog,
			close: () => setIsLinkDialogOpen(false),
			insert: insertLink,
		},
		image: {
			isOpen: isImageDialogOpen,
			alt: imageAlt,
			error: imageError,
			isUploading: isUploadingImage,
			setFile: setImageFile,
			setAlt: setImageAlt,
			open: openImageDialog,
			close: () => setIsImageDialogOpen(false),
			insert: insertImage,
		},
	};
}
