import type { PlayerSponsorship } from "../../types/playerSponsorships";

type Props = {
	sponsorship: Pick<PlayerSponsorship, "clubName" | "clubPrimaryColor" | "clubSecondaryColor" | "playerName" | "sponsorName" | "sponsorDescription" | "sponsorImageDataUrl">;
	className?: string;
};

export default function PlayerSponsorshipPreview({ sponsorship, className = "" }: Props) {
	const primary = sponsorship.clubPrimaryColor || "#0f172a";
	const secondary = sponsorship.clubSecondaryColor || "#facc15";
	return (
		<div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ${className}`}>
			<div className="aspect-square p-[6%] text-white" style={{ background: `radial-gradient(circle at 80% 10%, ${secondary}66, transparent 35%), linear-gradient(145deg, ${primary}, #07111f 72%)` }}>
				<div className="flex h-full flex-col">
					<div className="flex items-center justify-between gap-3">
						<p className="text-[clamp(.55rem,2vw,.8rem)] font-black uppercase tracking-[.22em] text-white/75">{sponsorship.clubName || "Your club"}</p>
						<span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[clamp(.5rem,1.7vw,.7rem)] font-black uppercase tracking-wider">Player sponsor</span>
					</div>
					<div className="flex flex-1 flex-col justify-center py-5">
						<p className="text-[clamp(.65rem,2.3vw,.95rem)] font-bold uppercase tracking-[.2em]" style={{ color: secondary }}>Proudly sponsoring</p>
						<h2 className="mt-1 text-[clamp(2rem,8vw,4.5rem)] font-black uppercase leading-[.88] tracking-[-.055em]">{sponsorship.playerName || "Player name"}</h2>
					</div>
					<div className="rounded-[1.2rem] bg-white p-[5%] text-slate-900 shadow-2xl">
						<div className="flex min-h-20 items-center gap-4">
							{sponsorship.sponsorImageDataUrl ? (
								<img src={sponsorship.sponsorImageDataUrl} alt="Sponsor logo preview" className="h-16 w-24 shrink-0 object-contain sm:h-20 sm:w-32" />
							) : (
								<div className="grid h-16 w-24 shrink-0 place-items-center rounded-xl border-2 border-dashed border-slate-200 text-center text-[.6rem] font-black uppercase text-slate-400 sm:h-20 sm:w-32">Sponsor logo</div>
							)}
							<div className="min-w-0">
								<p className="truncate text-[clamp(1rem,4vw,1.7rem)] font-black leading-tight">{sponsorship.sponsorName || "Your business"}</p>
								<p className="mt-1 line-clamp-2 text-[clamp(.6rem,2vw,.8rem)] font-semibold text-slate-500">{sponsorship.sponsorDescription || "Your sponsor description will appear here."}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="bg-slate-950 px-4 py-2 text-center text-[10px] font-black uppercase tracking-[.2em] text-white/55">Social post preview</div>
		</div>
	);
}
