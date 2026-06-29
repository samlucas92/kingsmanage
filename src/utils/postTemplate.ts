import type { Match } from "../stores/match";
import type { Player } from "../stores/players";
import type { ClubPostTemplate } from "../types/posts";
import { formatDisplayDateTime } from "./date";
import { ensureRichTextWithLink } from "./richText";

export type PostTemplateValues = {
	team: string;
	opponent: string;
	date: string;
	venue: string;
	location: string;
	locationUrl: string;
	squad: string;
	directions: string;
	directionsUrl: string;
	competition: string;
};

export function shuffleNames(names: string[], random = Math.random) {
	const shuffled = [...names];
	for (let index = shuffled.length - 1; index > 0; index -= 1) {
		const target = Math.floor(random() * (index + 1));
		[shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
	}
	return shuffled;
}

export function buildTemplateValues(
	match: Match,
	players: Player[],
	teamName: string,
	random = Math.random
): PostTemplateValues {
	const names = match.selectedPlayers.map(
		(selected) => players.find((player) => player.id === selected.playerId)?.name ?? "Unknown player"
	);
	const location = match.location?.trim() ?? "";
	const mapsUrl = location
		? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
		: "";

	return {
		team: teamName,
		opponent: match.opponent,
		date: formatDisplayDateTime(match.date),
		venue: match.venue === "home" ? "Home" : "Away",
		location: location || "Venue to be confirmed",
		locationUrl: mapsUrl,
		squad: shuffleNames(names, random).map((name) => `• ${name}`).join("\n"),
		directions: mapsUrl ? "Directions" : "Directions to follow",
		directionsUrl: mapsUrl,
		competition: match.competition?.trim() || "Fixture",
	};
}

export function applyPostTemplate(template: ClubPostTemplate, values: PostTemplateValues) {
	const replace = (source: string) =>
		source.replace(/\{\{(\w+)\}\}/g, (placeholder, key: keyof PostTemplateValues) =>
			key in values ? values[key] : placeholder
		);

	return {
		title: replace(template.titleTemplate),
		body: replace(template.bodyTemplate),
	};
}

export function buildGeneratedRichPostBody(
	body: string,
	values: PostTemplateValues
) {
	const withLocationLink = ensureRichTextWithLink(
		body,
		values.location,
		values.locationUrl
	);

	return ensureRichTextWithLink(
		withLocationLink,
		values.directions,
		values.directionsUrl
	);
}
