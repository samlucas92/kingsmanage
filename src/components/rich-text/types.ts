import type { ClubFileLinkedEntityType } from "../../types/files";

export type RichTextImageOwner = {
	linkedEntityType: ClubFileLinkedEntityType;
	linkedEntityId: string;
};

export type RichTextEditorProps = {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	compact?: boolean;
	onSubmit?: () => void;
	imageOwner?: RichTextImageOwner;
};
