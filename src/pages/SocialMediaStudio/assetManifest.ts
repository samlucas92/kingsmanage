import type { SocialGraphicAsset } from "./types";
import kingsbridgeColtsLogo from "../../assets/social-media/logos/Kings.png";

export type SocialGraphicAssetManifest = {
	teamLogos: SocialGraphicAsset[];
	featuredImages: SocialGraphicAsset[];
	sponsors: SocialGraphicAsset[];
};

// Import source-controlled images here, then add them to the appropriate list.
// Example:
// import clubCrest from "../../assets/social-media/logos/club-crest.png";
// teamLogos: [{ id: "club-crest", name: "Club crest", source: clubCrest }]
export const socialGraphicAssetManifest: SocialGraphicAssetManifest = {
	teamLogos: [
		{
			id: "kingsbridge-colts",
			name: "Kingsbridge Colts",
			source: kingsbridgeColtsLogo,
		},
	],
	featuredImages: [],
	sponsors: [],
};
