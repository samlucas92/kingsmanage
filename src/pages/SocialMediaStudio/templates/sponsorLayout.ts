import type { SocialGraphicAsset } from "../types";

export type SponsorSlot = {
	asset: SocialGraphicAsset | undefined;
	x: number;
	width: number;
};

export function getSponsorSlots(
	assets: Array<SocialGraphicAsset | undefined>,
	areaX: number,
	areaWidth: number,
	gap: number
): SponsorSlot[] {
	const selectedAssets = assets.filter(
		(asset): asset is SocialGraphicAsset => asset !== undefined
	).slice(0, 3);
	if (selectedAssets.length === 0) return [];

	const slotWidth = (areaWidth - gap * (selectedAssets.length - 1)) / selectedAssets.length;

	return selectedAssets.map((asset, index) => ({
		asset,
		x: areaX + index * (slotWidth + gap),
		width: slotWidth,
	}));
}
