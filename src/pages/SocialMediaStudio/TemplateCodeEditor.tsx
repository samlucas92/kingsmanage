import { useEffect, useRef } from "react";
import { basicSetup, EditorView } from "codemirror";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { lintGutter, linter } from "@codemirror/lint";

type TemplateCodeEditorProps = {
	value: string;
	onChange: (value: string) => void;
};

export function TemplateCodeEditor({ value, onChange }: TemplateCodeEditorProps) {
	const hostRef = useRef<HTMLDivElement>(null);
	const editorRef = useRef<EditorView>(null);
	const onChangeRef = useRef(onChange);
	const initialValueRef = useRef(value);
	const externalUpdateRef = useRef(false);

	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	useEffect(() => {
		if (!hostRef.current) return;

		const editor = new EditorView({
			doc: initialValueRef.current,
			parent: hostRef.current,
			extensions: [
				basicSetup,
				json(),
				lintGutter(),
				linter(jsonParseLinter()),
				EditorView.lineWrapping,
				EditorView.theme({
					"&": {
						height: "30rem",
						fontSize: "13px",
					},
					".cm-scroller": {
						fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
						overflow: "auto",
					},
					".cm-content": {
						padding: "12px 0",
					},
					".cm-gutters": {
						backgroundColor: "#f8fafc",
						borderRight: "1px solid #e2e8f0",
					},
				}),
				EditorView.updateListener.of((update) => {
					if (update.docChanged && !externalUpdateRef.current) {
						onChangeRef.current(update.state.doc.toString());
					}
				}),
			],
		});

		editorRef.current = editor;
		return () => {
			editor.destroy();
			editorRef.current = null;
		};
	}, []);

	useEffect(() => {
		const editor = editorRef.current;
		if (!editor) return;
		const currentValue = editor.state.doc.toString();
		if (currentValue === value) return;

		externalUpdateRef.current = true;
		editor.dispatch({
			changes: {
				from: 0,
				to: currentValue.length,
				insert: value,
			},
		});
		externalUpdateRef.current = false;
	}, [value]);

	return (
		<div
			ref={hostRef}
			className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-inner"
			aria-label="Upcoming fixtures template JSON editor"
		/>
	);
}
