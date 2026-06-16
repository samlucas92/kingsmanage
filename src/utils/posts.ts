import type { ClubPostType } from "../types/posts";

export function getPostTypeLabel(type: ClubPostType) {
	switch (type) {
		case "Announcement":
			return "Announcement";
		case "MatchInfo":
			return "Match info";
		case "Social":
			return "Social";
		case "General":
		default:
			return "General";
	}
}

export function getPostTypeClass(type: ClubPostType) {
	if (type === "Announcement") {
		return "bg-blue-50 text-blue-700";
	}

	if (type === "MatchInfo") {
		return "bg-green-50 text-green-700";
	}

	if (type === "Social") {
		return "bg-purple-50 text-purple-700";
	}

	return "bg-slate-100 text-slate-700";
}
