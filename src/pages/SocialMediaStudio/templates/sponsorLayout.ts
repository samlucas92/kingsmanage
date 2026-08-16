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
	const visibleAssets: Array<SocialGraphicAsset | undefined> = selectedAssets.length > 0
		? selectedAssets
		: [undefined, undefined, undefined];
	const slotWidth = (areaWidth - gap * (visibleAssets.length - 1)) / visibleAssets.length;

	return visibleAssets.map((asset, index) => ({
		asset,
		x: areaX + index * (slotWidth + gap),
		width: slotWidth,
	}));
}
