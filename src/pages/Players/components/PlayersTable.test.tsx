import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { Player } from "../../../stores/players";
import { PlayersTable } from "./PlayersTable";

const player: Player = {
	id: "player-1",
	name: "Alex Wilson",
	number: 12,
	positions: ["CB", "RB"],
	appearances: 237,
	isActive: true,
};

function render(viewMode: "cards" | "list") {
	return renderToStaticMarkup(
		<MemoryRouter>
			<PlayersTable
				players={[player]}
				viewMode={viewMode}
				onEditPlayer={vi.fn()}
				onTogglePlayerActive={vi.fn()}
			/>
		</MemoryRouter>
	);
}

describe("PlayersTable", () => {
	it("renders a scannable player card with profile and management actions", () => {
		const html = render("cards");

		expect(html).toContain("Alex Wilson");
		expect(html).toContain("#12");
		expect(html).toContain("237");
		expect(html).toContain("View profile");
		expect(html).toContain("Edit player");
		expect(html).toContain("Deactivate");
		expect(html).not.toContain("block truncate text-lg");
	});

	it("renders the same player data in list view", () => {
		const html = render("list");

		expect(html).toContain("Appearances");
		expect(html).toContain("Alex Wilson");
		expect(html).toContain("CB");
		expect(html).toContain("Active");
	});
});
