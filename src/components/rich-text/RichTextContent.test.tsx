import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { serializeRichText } from "../../utils/richText";
import RichTextContent from "./RichTextContent";

describe("RichTextContent lists", () => {
	it("renders nested list content using semantic HTML", () => {
		const value = serializeRichText([
			{
				type: "numbered-list",
				children: [
					{
						type: "list-item",
						children: [
							{ text: "Meet at the clubhouse" },
							{
								type: "bulleted-list",
								children: [
									{
										type: "list-item",
										children: [{ text: "Bring boots" }],
									},
								],
							},
						],
					},
				],
			},
		]);

		const html = renderToStaticMarkup(<RichTextContent value={value} />);

		expect(html).toContain("<ol");
		expect(html).toContain("<li");
		expect(html).toContain("<ul");
		expect(html).toContain("Bring boots");
	});
});
