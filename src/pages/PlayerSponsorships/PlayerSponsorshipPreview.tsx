import playerSponsorshipPost from "../../assets/social-media/player-sponsorship-result.png";
import type { PlayerSponsorship } from "../../types/playerSponsorships";

type Props = {
	sponsorship: Pick<PlayerSponsorship, "sponsorName" | "sponsorImageDataUrl">;
	className?: string;
};

export default function PlayerSponsorshipPreview({ sponsorship, className = "" }: Props) {
	return (
		<figure className={`overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-xl ${className}`}>
			<div className="relative">
				<img
					src={playerSponsorshipPost}
					alt="Kingsbridge Colts full-time result social post with a player of the match and sponsor area"
					className="block h-auto w-full"
				/>
				{sponsorship.sponsorImageDataUrl && (
					<div className="absolute bottom-[2.5%] left-[12%] right-[12%] flex h-[12.5%] items-center justify-center">
						<img
							src={sponsorship.sponsorImageDataUrl}
							alt={`${sponsorship.sponsorName || "Sponsor"} logo on the social post`}
							className="max-h-full max-w-full object-contain"
						/>
					</div>
				)}
			</div>
			<figcaption className="bg-slate-950 px-4 py-3 text-center text-xs font-bold text-white/70">
				Actual club social post{sponsorship.sponsorImageDataUrl ? " with your logo in the sponsor area" : " — your logo will appear in the sponsor area"}
			</figcaption>
		</figure>
	);
}
