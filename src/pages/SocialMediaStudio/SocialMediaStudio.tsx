import { useEffect, useMemo, useRef, useState } from "react";

import { useAuthStore } from "../../stores/auth";
import { useClubTeamStore } from "../../stores/clubTeams";
import { useMatchStore } from "../../stores/match";
import { usePlayerStore } from "../../stores/players";
import { useSeasonStore } from "../../stores/seasons";
import { formatDateForInput } from "../../utils/date";
import { socialGraphicAssetManifest } from "./assetManifest";
import {
	copyCanvasPng,
	downloadCanvasPng,
	renderSocialGraphic,
} from "./socialGraphicCanvas";
import {
	applySocialFixtureOverride,
	getClubScore,
	getDefaultHeadline,
	getGraphicKindLabel,
	getOpponentScore,
	toSocialFixture,
} from "./socialGraphicModel";
import { socialGraphicTemplates } from "./templateRegistry";
import type {
	SocialFixture,
	SocialFixtureOverride,
	SocialGraphicAsset,
	SocialGraphicContent,
	SocialGraphicKind,
} from "./types";

const graphicKinds: SocialGraphicKind[] = [
	"upcomingFixtures",
	"fixture",
	"result",
];
const placeholderAssetId = "__placeholder__";

export default function SocialMediaStudio() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const temporaryAssetsRef = useRef<Record<string, SocialGraphicAsset>>({});
	const matches = useMatchStore((state) => state.matches);
	const isLoadingMatches = useMatchStore((state) => state.isLoadingMatches);
	const matchLoadError = useMatchStore((state) => state.matchLoadError);
	const loadMatches = useMatchStore((state) => state.loadMatches);
	const loadMatch = useMatchStore((state) => state.loadMatch);
	const players = usePlayerStore((state) => state.players);
	const loadPlayers = usePlayerStore((state) => state.loadPlayers);
	const seasons = useSeasonStore((state) => state.seasons);
	const activeSeasonId = useSeasonStore((state) => state.activeSeasonId);
	const isLoadingSeasons = useSeasonStore((state) => state.isLoadingSeasons);
	const loadSeasons = useSeasonStore((state) => state.loadSeasons);
	const teamProfiles = useClubTeamStore((state) => state.profiles);
	const loadTeamProfiles = useClubTeamStore((state) => state.loadProfiles);
	const availableClubs = useAuthStore((state) => state.availableClubs);

	const [kind, setKind] = useState<SocialGraphicKind>("upcomingFixtures");
	const [selectedTemplateId, setSelectedTemplateId] = useState("");
	const [selectedUpcomingIds, setSelectedUpcomingIds] = useState<string[]>([]);
	const [selectedFixtureId, setSelectedFixtureId] = useState("");
	const [selectedResultId, setSelectedResultId] = useState("");
	const [headline, setHeadline] = useState(getDefaultHeadline(kind));
	const [footer, setFooter] = useState("");
	const [clubHandle, setClubHandle] = useState("");
	const [templateFieldValues, setTemplateFieldValues] = useState<Record<string, string | boolean>>({});
	const [homeTeamLogoId, setHomeTeamLogoId] = useState("");
	const [awayTeamLogoId, setAwayTeamLogoId] = useState("");
	const [featuredImageId, setFeaturedImageId] = useState("");
	const [sponsorIds, setSponsorIds] = useState(["", "", ""]);
	const [fixtureOverrides, setFixtureOverrides] = useState<Record<string, SocialFixtureOverride>>({});
	const [temporaryAssets, setTemporaryAssets] = useState<Record<string, SocialGraphicAsset>>({});
	const [isRendering, setIsRendering] = useState(false);
	const [actionMessage, setActionMessage] = useState("");
	const [actionError, setActionError] = useState("");

	const currentClub = availableClubs.find((club) => club.isCurrent);
	const clubName = currentClub?.name ?? "Your club";
	const activeSeason = seasons.find((season) => season.id === activeSeasonId);

	useEffect(() => {
		void loadSeasons();
		void loadTeamProfiles();
		void loadPlayers();
	}, [loadSeasons, loadTeamProfiles, loadPlayers]);

	useEffect(() => {
		temporaryAssetsRef.current = temporaryAssets;
	}, [temporaryAssets]);

	useEffect(() => () => {
		Object.values(temporaryAssetsRef.current).forEach((asset) => {
			URL.revokeObjectURL(asset.source);
		});
	}, []);

	useEffect(() => {
		if (activeSeasonId) {
			void loadMatches(activeSeasonId);
		}
	}, [activeSeasonId, loadMatches]);

	const seasonMatches = useMemo(
		() => matches.filter((match) => !activeSeasonId || match.seasonId === activeSeasonId),
		[matches, activeSeasonId]
	);

	const upcomingMatches = useMemo(
		() => seasonMatches
			.filter((match) => !match.isCompleted && match.state === "upcoming")
			.sort((first, second) => Date.parse(first.date) - Date.parse(second.date)),
		[seasonMatches]
	);

	const completedMatches = useMemo(
		() => seasonMatches
			.filter((match) => match.isCompleted && Boolean(match.result))
			.sort((first, second) => Date.parse(second.date) - Date.parse(first.date)),
		[seasonMatches]
	);

	const effectiveUpcomingIds = useMemo(() => {
		const availableIds = new Set(upcomingMatches.map((match) => match.id));
		const retained = selectedUpcomingIds.filter((id) => availableIds.has(id));
		return retained.length > 0
			? retained
			: upcomingMatches.slice(0, 3).map((match) => match.id);
	}, [upcomingMatches, selectedUpcomingIds]);

	const effectiveFixtureId = upcomingMatches.some((match) => match.id === selectedFixtureId)
		? selectedFixtureId
		: upcomingMatches[0]?.id ?? "";
	const effectiveResultId = completedMatches.some((match) => match.id === selectedResultId)
		? selectedResultId
		: completedMatches[0]?.id ?? "";
	const selectedSingleMatch = kind === "fixture"
		? upcomingMatches.find((match) => match.id === effectiveFixtureId)
		: completedMatches.find((match) => match.id === effectiveResultId);
	const clubLogoIsHome = kind === "upcomingFixtures" || selectedSingleMatch?.venue !== "away";
	const homeTeamLogoFallbackIndex = clubLogoIsHome ? 0 : -1;
	const awayTeamLogoFallbackIndex = clubLogoIsHome ? -1 : 0;

	useEffect(() => {
		if (kind !== "result" || !effectiveResultId) return;
		const selectedResult = matches.find((match) => match.id === effectiveResultId);
		if (!selectedResult?.isDetailLoaded) void loadMatch(effectiveResultId);
	}, [kind, effectiveResultId, matches, loadMatch]);

	const availableTemplates = useMemo(
		() => socialGraphicTemplates.filter((template) => template.supportedKinds.includes(kind)),
		[kind]
	);

	const effectiveTemplateId = availableTemplates.some(
		(template) => template.id === selectedTemplateId
	)
		? selectedTemplateId
		: availableTemplates[0]?.id ?? "";
	const selectedTemplate = availableTemplates.find(
		(template) => template.id === effectiveTemplateId
	);
	const effectiveTemplateFields = useMemo<Record<string, string | boolean>>(
		() => Object.fromEntries(
			(selectedTemplate?.fields ?? []).map((field) => [
				field.id,
				templateFieldValues[field.id] ?? field.defaultValue,
			])
		),
		[selectedTemplate, templateFieldValues]
	);
	const showSponsors = effectiveTemplateFields.showSponsors !== false;
	const selectedAssets = useMemo(() => ({
		homeTeamLogo: findSelectedAsset(
			socialGraphicAssetManifest.teamLogos,
			homeTeamLogoId,
			homeTeamLogoFallbackIndex,
			temporaryAssets.homeTeamLogo
		),
		awayTeamLogo: findSelectedAsset(
			socialGraphicAssetManifest.teamLogos,
			awayTeamLogoId,
			awayTeamLogoFallbackIndex,
			temporaryAssets.awayTeamLogo
		),
		featuredImage: findSelectedAsset(
			socialGraphicAssetManifest.featuredImages,
			featuredImageId,
			0,
			temporaryAssets.featuredImage
		),
		sponsors: showSponsors
			? sponsorIds
				.map((id, index) => findSelectedAsset(
					socialGraphicAssetManifest.sponsors,
					id,
					index,
					temporaryAssets[`sponsor:${index}`]
				))
			: [],
	}), [
		homeTeamLogoId,
		awayTeamLogoId,
		featuredImageId,
		sponsorIds,
		temporaryAssets,
		showSponsors,
		homeTeamLogoFallbackIndex,
		awayTeamLogoFallbackIndex,
	]);

	const selectedMatches = useMemo(() => {
		if (kind === "upcomingFixtures") {
			const selectedIds = new Set(effectiveUpcomingIds);
			return upcomingMatches.filter((match) => selectedIds.has(match.id));
		}

		const selectedId = kind === "fixture" ? effectiveFixtureId : effectiveResultId;
		return seasonMatches.filter((match) => match.id === selectedId);
	}, [
		kind,
		effectiveUpcomingIds,
		upcomingMatches,
		effectiveFixtureId,
		effectiveResultId,
		seasonMatches,
	]);

	const selectedSocialFixtures = useMemo(
		() => selectedMatches.map((match) => applySocialFixtureOverride(
			toSocialFixture(match, teamProfiles, players),
			fixtureOverrides[match.id]
		)),
		[selectedMatches, teamProfiles, players, fixtureOverrides]
	);

	const content = useMemo<SocialGraphicContent>(() => ({
		kind,
		clubName,
		clubHandle: clubHandle.trim(),
		headline: headline.trim() || getDefaultHeadline(kind),
		footer: footer.trim() || `Come on, ${clubName}!`,
		fixtures: selectedSocialFixtures,
		fields: effectiveTemplateFields,
		assets: selectedAssets,
	}), [
		kind,
		clubName,
		clubHandle,
		headline,
		footer,
		selectedSocialFixtures,
		effectiveTemplateFields,
		selectedAssets,
	]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !selectedTemplate) return;

		let cancelled = false;
		queueMicrotask(() => {
			if (!cancelled) setIsRendering(true);
		});

		void renderSocialGraphic(canvas, selectedTemplate, content)
			.then(() => {
				if (!cancelled) setActionError("");
			})
			.catch((error: unknown) => {
				if (!cancelled) {
					setActionError(
						error instanceof Error ? error.message : "Could not render this graphic."
					);
				}
			})
			.finally(() => {
				if (!cancelled) setIsRendering(false);
			});

		return () => {
			cancelled = true;
		};
	}, [selectedTemplate, content]);

	function toggleUpcomingMatch(matchId: string) {
		setSelectedUpcomingIds(() => {
			if (effectiveUpcomingIds.includes(matchId)) {
				return effectiveUpcomingIds.length === 1
					? effectiveUpcomingIds
					: effectiveUpcomingIds.filter((id) => id !== matchId);
			}

			return effectiveUpcomingIds.length >= 5
				? effectiveUpcomingIds
				: [...effectiveUpcomingIds, matchId];
		});
	}

	function handleKindChange(nextKind: SocialGraphicKind) {
		setKind(nextKind);
		setHeadline(getDefaultHeadline(nextKind));
		setActionMessage("");
		setActionError("");
	}

	function setTemplateField(fieldId: string, value: string | boolean) {
		setTemplateFieldValues((current) => ({
			...current,
			[fieldId]: value,
		}));
	}

	function setFixtureOverride<Field extends keyof SocialFixtureOverride>(
		fixtureId: string,
		field: Field,
		value: SocialFixtureOverride[Field]
	) {
		setFixtureOverrides((current) => ({
			...current,
			[fixtureId]: {
				...current[fixtureId],
				[field]: value,
			},
		}));
	}

	function resetFixtureOverride(fixtureId: string) {
		setFixtureOverrides((current) => {
			const next = { ...current };
			delete next[fixtureId];
			return next;
		});
	}

	function setSponsorId(index: number, assetId: string) {
		setSponsorIds((current) => current.map((id, itemIndex) => (
			itemIndex === index ? assetId : id
		)));
	}

	function setTemporaryImage(
		slotId: string,
		file: File,
		selectAsset: (assetId: string) => void
	) {
		const asset: SocialGraphicAsset = {
			id: `temporary:${slotId}:${crypto.randomUUID()}`,
			name: `${file.name} (this session only)`,
			source: URL.createObjectURL(file),
		};

		setTemporaryAssets((current) => {
			const existingAsset = current[slotId];
			if (existingAsset) URL.revokeObjectURL(existingAsset.source);
			const next = { ...current, [slotId]: asset };
			temporaryAssetsRef.current = next;
			return next;
		});
		selectAsset(asset.id);
	}

	async function handleCopyImage() {
		if (!canvasRef.current || !selectedTemplate) return;

		try {
			setActionError("");
			setActionMessage("");
			await copyCanvasPng(canvasRef.current);
			setActionMessage("Image copied. It is ready to paste.");
		} catch (error) {
			setActionError(error instanceof Error ? error.message : "Could not copy the image.");
		}
	}

	async function handleDownloadImage() {
		if (!canvasRef.current || !selectedTemplate) return;

		try {
			setActionError("");
			setActionMessage("");
			await downloadCanvasPng(
				canvasRef.current,
				`${toFilenamePart(clubName)}-${toFilenamePart(getGraphicKindLabel(kind))}.png`
			);
			setActionMessage("PNG downloaded.");
		} catch (error) {
			setActionError(error instanceof Error ? error.message : "Could not download the image.");
		}
	}

	const hasRequiredMatch = content.fixtures.length > 0;
	const exportDisabled = !selectedTemplate || !hasRequiredMatch || isRendering;

	return (
		<div className="space-y-4 lg:space-y-6">
			<header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Social Media Studio</h1>
					<p className="mt-1 text-sm text-slate-600">
						Turn club fixtures and results into ready-to-post artwork.
					</p>
				</div>
				<span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
					{activeSeason?.name ?? (isLoadingSeasons ? "Loading season…" : "No active season")}
				</span>
			</header>

			<div className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm" role="tablist" aria-label="Graphic type">
				{graphicKinds.map((graphicKind) => (
					<button
						key={graphicKind}
						type="button"
						role="tab"
						aria-selected={kind === graphicKind}
						onClick={() => handleKindChange(graphicKind)}
						className={`rounded-xl px-2 py-2.5 text-xs font-bold transition sm:text-sm ${
							kind === graphicKind
								? "bg-yepset-950 text-white shadow-sm"
								: "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
						}`}
					>
						{getGraphicKindLabel(graphicKind)}
					</button>
				))}
			</div>

			{matchLoadError && (
				<div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
					{matchLoadError}
				</div>
			)}

			<div className="grid gap-4 xl:grid-cols-[minmax(19rem,0.78fr)_minmax(28rem,1.22fr)]">
				<aside className="surface-card h-fit p-4">
					<section>
						<div className="flex items-center justify-between gap-3">
							<h2 className="text-base font-bold text-slate-900">Template</h2>
							<span className="text-xs font-semibold text-slate-500">
								{availableTemplates.length} available
							</span>
						</div>

						{availableTemplates.length > 0 ? (
							<div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
								{availableTemplates.map((template) => (
									<button
										key={template.id}
										type="button"
										onClick={() => setSelectedTemplateId(template.id)}
										className={`rounded-xl border p-3 text-left transition ${
											effectiveTemplateId === template.id
												? "border-yepset-500 bg-yepset-50 ring-2 ring-yepset-100"
												: "border-slate-200 bg-slate-50 hover:border-yepset-300"
										}`}
									>
										<span className="block text-sm font-bold text-slate-900">{template.name}</span>
										<span className="mt-1 block text-xs text-slate-600">{template.description}</span>
									</button>
								))}
							</div>
						) : (
							<div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
								<p className="text-sm font-bold text-slate-900">No templates registered</p>
								<p className="mt-1 text-xs leading-5 text-slate-600">
									Add a source-controlled template module to <code className="font-semibold text-yepset-800">templateRegistry.ts</code>. The studio will expose it automatically for its supported graphic types.
								</p>
							</div>
						)}
					</section>

					<section className="mt-5 border-t border-slate-200 pt-5">
						<div className="flex items-center justify-between gap-3">
							<h2 className="text-base font-bold text-slate-900">Content</h2>
							<span className="text-xs font-semibold text-slate-500">
								{isLoadingMatches ? "Loading…" : `${selectedMatches.length} selected`}
							</span>
						</div>

						<div className="mt-3 space-y-3">
							{kind === "upcomingFixtures" ? (
								<UpcomingFixturePicker
									fixtures={upcomingMatches.map((match) => toSocialFixture(match, teamProfiles, players))}
									selectedIds={effectiveUpcomingIds}
									onToggle={toggleUpcomingMatch}
								/>
							) : (
								<SingleMatchPicker
									label={kind === "fixture" ? "Fixture" : "Result"}
									fixtures={(kind === "fixture" ? upcomingMatches : completedMatches).map((match) => toSocialFixture(match, teamProfiles, players))}
									selectedId={kind === "fixture" ? effectiveFixtureId : effectiveResultId}
									onChange={kind === "fixture" ? setSelectedFixtureId : setSelectedResultId}
								/>
							)}

							{selectedSocialFixtures.map((fixture, index) => (
								<FixtureCopyEditor
									key={fixture.id}
									fixture={fixture}
									showScores={kind === "result"}
									defaultOpen={selectedSocialFixtures.length === 1 || index === 0}
									hasOverride={Boolean(fixtureOverrides[fixture.id])}
									onChange={(field, value) => setFixtureOverride(fixture.id, field, value)}
									onReset={() => resetFixtureOverride(fixture.id)}
								/>
							))}

							<label className="block text-sm font-semibold text-slate-700">
								Headline
								<input value={headline} onChange={(event) => setHeadline(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm" />
							</label>
							<label className="block text-sm font-semibold text-slate-700">
								Club handle
								<input value={clubHandle} onChange={(event) => setClubHandle(event.target.value)} placeholder="@yourclub" className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm" />
							</label>
							<label className="block text-sm font-semibold text-slate-700">
								Footer
								<input value={footer || `Come on, ${clubName}!`} onChange={(event) => setFooter(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm" />
							</label>

							{selectedTemplate?.fields?.map((field) => {
								if (field.id === "sponsorsTitle" && !showSponsors) return null;

								if (field.type === "boolean") {
									return (
										<label key={field.id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700">
											<input type="checkbox" checked={effectiveTemplateFields[field.id] !== false} onChange={(event) => setTemplateField(field.id, event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-yepset-700" />
											{field.label}
										</label>
									);
								}

								return (
									<label key={field.id} className="block text-sm font-semibold text-slate-700">
										{field.label}
										<input value={String(effectiveTemplateFields[field.id] ?? "")} onChange={(event) => setTemplateField(field.id, event.target.value)} placeholder={field.placeholder} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm" />
									</label>
								);
							})}
						</div>
					</section>

					{selectedTemplate && (
						<section className="mt-5 border-t border-slate-200 pt-5">
							<div className="flex items-center justify-between gap-3">
								<h2 className="text-base font-bold text-slate-900">Bundled images</h2>
								<span className="text-xs font-semibold text-slate-500">Source controlled</span>
							</div>
							<div className="mt-3 space-y-3">
								<AssetPicker label={kind === "upcomingFixtures" ? "Club logo" : "Home team logo"} assets={socialGraphicAssetManifest.teamLogos} value={homeTeamLogoId} fallbackIndex={homeTeamLogoFallbackIndex} temporaryAsset={temporaryAssets.homeTeamLogo} onChange={setHomeTeamLogoId} onTemporaryImage={(file) => setTemporaryImage("homeTeamLogo", file, setHomeTeamLogoId)} />
								{kind !== "upcomingFixtures" && <AssetPicker label="Away team logo" assets={socialGraphicAssetManifest.teamLogos} value={awayTeamLogoId} fallbackIndex={awayTeamLogoFallbackIndex} temporaryAsset={temporaryAssets.awayTeamLogo} onChange={setAwayTeamLogoId} onTemporaryImage={(file) => setTemporaryImage("awayTeamLogo", file, setAwayTeamLogoId)} />}
								{kind === "result" && <AssetPicker label="Player of the Match image" assets={socialGraphicAssetManifest.featuredImages} value={featuredImageId} fallbackIndex={0} temporaryAsset={temporaryAssets.featuredImage} onChange={setFeaturedImageId} onTemporaryImage={(file) => setTemporaryImage("featuredImage", file, setFeaturedImageId)} />}
								{showSponsors && [0, 1, 2].map((index) => (
									<AssetPicker key={index} label={`Sponsor ${index + 1}`} assets={socialGraphicAssetManifest.sponsors} value={sponsorIds[index] ?? ""} fallbackIndex={index} temporaryAsset={temporaryAssets[`sponsor:${index}`]} onChange={(assetId) => setSponsorId(index, assetId)} onTemporaryImage={(file) => setTemporaryImage(`sponsor:${index}`, file, (assetId) => setSponsorId(index, assetId))} />
								))}
							</div>
						</section>
					)}
				</aside>

				<section className="surface-card p-4">
					<div className="flex items-center justify-between gap-3">
						<h2 className="text-base font-bold text-slate-900">Preview</h2>
						<span className="text-xs font-semibold text-slate-500">
							{selectedTemplate ? `${selectedTemplate.width} × ${selectedTemplate.height}` : "Waiting for template"}
						</span>
					</div>

					<div className="mt-3 grid min-h-[24rem] place-items-center rounded-2xl border border-slate-200 bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0] p-4">
						{selectedTemplate ? (
							<canvas ref={canvasRef} className="h-auto max-h-[42rem] w-full max-w-[42rem] bg-white shadow-2xl" aria-label="Generated social media graphic preview" />
						) : (
							<div className="max-w-sm rounded-2xl border border-dashed border-slate-300 bg-white/95 p-6 text-center shadow-sm">
								<div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-yepset-100 text-2xl text-yepset-800">◇</div>
								<h3 className="mt-3 text-base font-bold text-slate-900">Preview ready for your templates</h3>
								<p className="mt-1 text-sm leading-6 text-slate-600">
									Registered templates receive the selected club, fixture, result, headline and footer data through the canvas rendering contract.
								</p>
							</div>
						)}
					</div>

					<div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<button type="button" onClick={handleCopyImage} disabled={exportDisabled} className="btn-secondary disabled:cursor-not-allowed disabled:opacity-45">Copy image</button>
						<button type="button" onClick={handleDownloadImage} disabled={exportDisabled} className="btn-primary disabled:cursor-not-allowed disabled:opacity-45">Download PNG</button>
					</div>
					{actionMessage && <p className="mt-2 text-right text-sm font-semibold text-yepset-700">{actionMessage}</p>}
					{actionError && <p className="mt-2 text-right text-sm font-semibold text-rose-700">{actionError}</p>}
				</section>
			</div>
		</div>
	);
}

function FixtureCopyEditor({
	fixture,
	showScores,
	defaultOpen,
	hasOverride,
	onChange,
	onReset,
}: {
	fixture: SocialFixture;
	showScores: boolean;
	defaultOpen: boolean;
	hasOverride: boolean;
	onChange: <Field extends keyof SocialFixtureOverride>(
		field: Field,
		value: SocialFixtureOverride[Field]
	) => void;
	onReset: () => void;
}) {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const homeTeam = fixture.venue === "home" ? fixture.teamName : fixture.opponent;
	const awayTeam = fixture.venue === "away" ? fixture.teamName : fixture.opponent;
	const inputClassName = "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm";

	return (
		<details
			open={isOpen}
			onToggle={(event) => setIsOpen(event.currentTarget.open)}
			className="rounded-xl border border-slate-200 bg-slate-50"
		>
			<summary className="cursor-pointer px-3 py-2.5 text-sm font-bold text-slate-800">
				Graphic copy · {fixture.opponent}
			</summary>
			<div className="grid gap-3 border-t border-slate-200 p-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
				<p className="sm:col-span-2 xl:col-span-1 2xl:col-span-2 text-xs leading-5 text-slate-500">
					Seeded from the match. Changes here only affect this image.
				</p>
				<label className="block text-sm font-semibold text-slate-700">
					Club/team name
					<input value={fixture.teamName} onChange={(event) => onChange("teamName", event.target.value)} className={inputClassName} />
				</label>
				<label className="block text-sm font-semibold text-slate-700">
					Opposition
					<input value={fixture.opponent} onChange={(event) => onChange("opponent", event.target.value)} className={inputClassName} />
				</label>
				<label className="block text-sm font-semibold text-slate-700">
					Competition
					<input value={fixture.competition} onChange={(event) => onChange("competition", event.target.value)} className={inputClassName} />
				</label>
				<label className="block text-sm font-semibold text-slate-700">
					Date and kick-off
					<input type="datetime-local" value={formatDateForInput(fixture.date)} onChange={(event) => onChange("date", event.target.value)} className={inputClassName} />
				</label>
				<label className="block text-sm font-semibold text-slate-700">
					Home or away
					<select value={fixture.venue} onChange={(event) => onChange("venue", event.target.value as SocialFixture["venue"])} className={inputClassName}>
						<option value="home">Home</option>
						<option value="away">Away</option>
					</select>
				</label>
				<label className="block text-sm font-semibold text-slate-700 sm:col-span-2 xl:col-span-1 2xl:col-span-2">
					Venue / address
					<textarea rows={2} value={fixture.location} onChange={(event) => onChange("location", event.target.value)} className={`${inputClassName} resize-y`} />
				</label>
				{showScores && (
					<label className="block text-sm font-semibold text-slate-700 sm:col-span-2 xl:col-span-1 2xl:col-span-2">
						Player of the Match name
						<input value={fixture.playerOfTheMatch} onChange={(event) => onChange("playerOfTheMatch", event.target.value)} placeholder="Selects the match award winner when available" className={inputClassName} />
					</label>
				)}
				{showScores && fixture.result && (
					<>
						<label className="block text-sm font-semibold text-slate-700">
							Home score · {homeTeam}
							<input type="number" min="0" value={fixture.result.homeGoals} onChange={(event) => onChange("homeGoals", parseOptionalScore(event.target.value))} className={inputClassName} />
						</label>
						<label className="block text-sm font-semibold text-slate-700">
							Away score · {awayTeam}
							<input type="number" min="0" value={fixture.result.awayGoals} onChange={(event) => onChange("awayGoals", parseOptionalScore(event.target.value))} className={inputClassName} />
						</label>
					</>
				)}
				{hasOverride && (
					<div className="sm:col-span-2 xl:col-span-1 2xl:col-span-2">
						<button type="button" onClick={onReset} className="text-xs font-bold text-yepset-800 hover:text-yepset-950">
							Reset to match data
						</button>
					</div>
				)}
			</div>
		</details>
	);
}

function parseOptionalScore(value: string) {
	if (!value.trim()) return undefined;
	const score = Number.parseInt(value, 10);
	return Number.isNaN(score) ? undefined : Math.max(0, score);
}

function UpcomingFixturePicker({
	fixtures,
	selectedIds,
	onToggle,
}: {
	fixtures: SocialFixture[];
	selectedIds: string[];
	onToggle: (matchId: string) => void;
}) {
	if (fixtures.length === 0) {
		return <EmptyMatchMessage message="No upcoming fixtures are available in the active season." />;
	}

	return (
		<fieldset>
			<legend className="text-sm font-semibold text-slate-700">Fixtures (up to five)</legend>
			<div className="mt-1.5 max-h-48 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
				{fixtures.map((fixture) => {
					const checked = selectedIds.includes(fixture.id);
					return (
						<label key={fixture.id} className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-sm hover:bg-white">
							<input type="checkbox" checked={checked} disabled={!checked && selectedIds.length >= 5} onChange={() => onToggle(fixture.id)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-yepset-700" />
							<span><span className="block font-semibold text-slate-900">{formatFixtureName(fixture)}</span><span className="block text-xs text-slate-500">{formatFixtureDate(fixture.date)}</span></span>
						</label>
					);
				})}
			</div>
		</fieldset>
	);
}

function SingleMatchPicker({
	label,
	fixtures,
	selectedId,
	onChange,
}: {
	label: string;
	fixtures: SocialFixture[];
	selectedId: string;
	onChange: (matchId: string) => void;
}) {
	if (fixtures.length === 0) {
		return <EmptyMatchMessage message={`No ${label.toLowerCase()} data is available in the active season.`} />;
	}

	return (
		<label className="block text-sm font-semibold text-slate-700">
			{label}
			<select value={selectedId} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm">
				{fixtures.map((fixture) => (
					<option key={fixture.id} value={fixture.id}>{formatFixtureOption(fixture)}</option>
				))}
			</select>
		</label>
	);
}

function EmptyMatchMessage({ message }: { message: string }) {
	return <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">{message}</p>;
}

function AssetPicker({
	label,
	assets,
	value,
	fallbackIndex,
	temporaryAsset,
	onChange,
	onTemporaryImage,
}: {
	label: string;
	assets: SocialGraphicAsset[];
	value: string;
	fallbackIndex: number;
	temporaryAsset?: SocialGraphicAsset;
	onChange: (assetId: string) => void;
	onTemporaryImage: (file: File) => void;
}) {
	const effectiveAsset = findSelectedAsset(assets, value, fallbackIndex, temporaryAsset);

	return (
		<div>
			<label className="block text-sm font-semibold text-slate-700">
				{label}
				<select
					value={effectiveAsset?.id ?? placeholderAssetId}
					onChange={(event) => onChange(event.target.value)}
					className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm"
				>
					<option value={placeholderAssetId}>Use placeholder</option>
					{temporaryAsset && (
						<option value={temporaryAsset.id}>{temporaryAsset.name}</option>
					)}
					{assets.map((asset) => (
						<option key={asset.id} value={asset.id}>{asset.name}</option>
					))}
				</select>
			</label>
			<label className="mt-1.5 inline-flex cursor-pointer items-center text-xs font-bold text-yepset-800 hover:text-yepset-950">
				Upload for this graphic only
				<input
					type="file"
					accept="image/png,image/jpeg,image/webp,image/gif"
					className="sr-only"
					onChange={(event) => {
						const file = event.target.files?.[0];
						if (file) onTemporaryImage(file);
						event.currentTarget.value = "";
					}}
				/>
			</label>
		</div>
	);
}

function findSelectedAsset(
	assets: SocialGraphicAsset[],
	selectedId: string,
	fallbackIndex: number,
	temporaryAsset?: SocialGraphicAsset
) {
	if (selectedId === placeholderAssetId) return undefined;
	if (temporaryAsset?.id === selectedId) return temporaryAsset;
	return assets.find((asset) => asset.id === selectedId) ?? assets[fallbackIndex];
}

function formatFixtureName(fixture: SocialFixture) {
	return fixture.venue === "home"
		? `${fixture.teamName} vs ${fixture.opponent}`
		: `${fixture.teamName} at ${fixture.opponent}`;
}

function formatFixtureOption(fixture: SocialFixture) {
	const clubScore = getClubScore(fixture);
	const opponentScore = getOpponentScore(fixture);
	const score = clubScore === null || opponentScore === null
		? ""
		: ` · ${clubScore}-${opponentScore}`;
	return `${formatFixtureDate(fixture.date)} · ${formatFixtureName(fixture)}${score}`;
}

function formatFixtureDate(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Date to be confirmed";

	return date.toLocaleString([], {
		weekday: "short",
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function toFilenamePart(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "") || "social-graphic";
}
