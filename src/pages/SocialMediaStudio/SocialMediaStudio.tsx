import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";

import { useAuthStore } from "../../stores/auth";
import { useClubTeamStore } from "../../stores/clubTeams";
import { useMatchStore } from "../../stores/match";
import { usePlayerStore } from "../../stores/players";
import { useSeasonStore } from "../../stores/seasons";
import { formatDateForInput } from "../../utils/date";
import { socialGraphicAssetManifest } from "./assetManifest";
import { TemplateCanvasOverlay } from "./TemplateCanvasOverlay";
import {
	copyCanvasPng,
	downloadCanvasPng,
	getSocialGraphicDimensions,
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
import {
	createUpcomingEditorialTemplate,
	parseUpcomingEditorialDefinition,
	serializeUpcomingEditorialDefinition,
	upcomingEditorialDefaultDefinition,
	upcomingEditorialDefaultSource,
} from "./templates/upcomingEditorialTemplate";
import type {
	SocialFixture,
	SocialFixtureOverride,
	SocialGraphicAsset,
	SocialGraphicContent,
	SocialGraphicKind,
} from "./types";
import {
	getUpcomingTemplateElements,
	getUpcomingTemplateParentId,
	resetUpcomingTemplateElement,
	updateUpcomingTemplateElement,
} from "./upcomingTemplateElements";
import type {
	TemplateElementBounds,
	UpcomingTemplateElementId,
} from "./upcomingTemplateElements";

const graphicKinds: SocialGraphicKind[] = [
	"upcomingFixtures",
	"fixture",
	"result",
];
const placeholderAssetId = "__placeholder__";
const upcomingTemplateStoragePrefix = "kingsmanage:social-template:upcoming-editorial-gold:v1";
const TemplateCodeEditor = lazy(() => import("./TemplateCodeEditor").then(
	(module) => ({ default: module.TemplateCodeEditor })
));

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
	const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
	const [upcomingTemplateSource, setUpcomingTemplateSource] = useState(
		upcomingEditorialDefaultSource
	);
	const [savedUpcomingTemplateSource, setSavedUpcomingTemplateSource] = useState(
		upcomingEditorialDefaultSource
	);
	const [upcomingTemplateDefinition, setUpcomingTemplateDefinition] = useState(
		upcomingEditorialDefaultDefinition
	);
	const [templateCodeError, setTemplateCodeError] = useState("");
	const [isCanvasEditorOpen, setIsCanvasEditorOpen] = useState(false);
	const [selectedTemplateElementId, setSelectedTemplateElementId] = useState<UpcomingTemplateElementId | null>("headline");
	const [templateHistory, setTemplateHistory] = useState<{
		past: string[];
		future: string[];
	}>({ past: [], future: [] });
	const upcomingTemplateSourceRef = useRef(upcomingTemplateSource);
	const upcomingTemplateDefinitionRef = useRef(upcomingTemplateDefinition);
	const visualChangeStartSourceRef = useRef<string | null>(null);

	const currentClub = availableClubs.find((club) => club.isCurrent);
	const clubName = currentClub?.name ?? "Your club";
	const activeSeason = seasons.find((season) => season.id === activeSeasonId);
	const upcomingTemplateStorageKey = `${upcomingTemplateStoragePrefix}:${currentClub?.id ?? "default"}`;

	useEffect(() => {
		void loadSeasons();
		void loadTeamProfiles();
		void loadPlayers();
	}, [loadSeasons, loadTeamProfiles, loadPlayers]);

	useEffect(() => {
		temporaryAssetsRef.current = temporaryAssets;
	}, [temporaryAssets]);

	useEffect(() => {
		upcomingTemplateSourceRef.current = upcomingTemplateSource;
		upcomingTemplateDefinitionRef.current = upcomingTemplateDefinition;
	}, [upcomingTemplateSource, upcomingTemplateDefinition]);

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

	useEffect(() => {
		const storedSource = localStorage.getItem(upcomingTemplateStorageKey);
		let cancelled = false;

		queueMicrotask(() => {
			if (cancelled) return;
			if (!storedSource) {
				setUpcomingTemplateSource(upcomingEditorialDefaultSource);
				setSavedUpcomingTemplateSource(upcomingEditorialDefaultSource);
				setUpcomingTemplateDefinition(upcomingEditorialDefaultDefinition);
				setTemplateCodeError("");
				return;
			}

			try {
				const definition = parseUpcomingEditorialDefinition(storedSource);
				const normalisedSource = serializeUpcomingEditorialDefinition(definition);
				setUpcomingTemplateSource(normalisedSource);
				setSavedUpcomingTemplateSource(normalisedSource);
				setUpcomingTemplateDefinition(definition);
				setTemplateCodeError("");
			} catch {
				setUpcomingTemplateSource(upcomingEditorialDefaultSource);
				setSavedUpcomingTemplateSource(upcomingEditorialDefaultSource);
				setUpcomingTemplateDefinition(upcomingEditorialDefaultDefinition);
				setTemplateCodeError("The saved browser draft was invalid, so the original template is active.");
			}
		});

		return () => {
			cancelled = true;
		};
	}, [upcomingTemplateStorageKey]);

	useEffect(() => {
		const timeout = window.setTimeout(() => {
			try {
				const definition = parseUpcomingEditorialDefinition(upcomingTemplateSource);
				setUpcomingTemplateDefinition(definition);
				setTemplateCodeError("");
			} catch (error) {
				setTemplateCodeError(
					error instanceof Error ? error.message : "Template JSON is invalid."
				);
			}
		}, 250);

		return () => window.clearTimeout(timeout);
	}, [upcomingTemplateSource]);

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

	const editableUpcomingTemplate = useMemo(
		() => createUpcomingEditorialTemplate(upcomingTemplateDefinition),
		[upcomingTemplateDefinition]
	);
	const availableTemplates = useMemo(
		() => socialGraphicTemplates
			.map((template) => template.id === editableUpcomingTemplate.id
				? editableUpcomingTemplate
				: template)
			.filter((template) => template.supportedKinds.includes(kind)),
		[kind, editableUpcomingTemplate]
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
	const upcomingTemplateElements = useMemo(
		() => getUpcomingTemplateElements(
			upcomingTemplateDefinition,
			showSponsors,
			effectiveUpcomingIds.length,
			selectedTemplateElementId
		),
		[
			upcomingTemplateDefinition,
			showSponsors,
			effectiveUpcomingIds.length,
			selectedTemplateElementId,
		]
	);
	const selectedTemplateElement = upcomingTemplateElements.find(
		(element) => element.id === selectedTemplateElementId
	) ?? null;
	const activeTemplateElementId = selectedTemplateElement?.id ?? null;
	const selectedTemplateParentId = activeTemplateElementId
		? getUpcomingTemplateParentId(activeTemplateElementId)
		: null;
	const canMoveUpTemplateHierarchy = Boolean(
		selectedTemplateParentId || activeTemplateElementId === "fixture-list"
	);
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
	const previewDimensions = selectedTemplate
		? getSocialGraphicDimensions(selectedTemplate, content)
		: undefined;

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

	function setUpcomingDefinition(
		definition: typeof upcomingEditorialDefaultDefinition
	) {
		const source = serializeUpcomingEditorialDefinition(definition);
		upcomingTemplateSourceRef.current = source;
		upcomingTemplateDefinitionRef.current = definition;
		setUpcomingTemplateSource(source);
		setUpcomingTemplateDefinition(definition);
		setTemplateCodeError("");
	}

	function handleUpcomingTemplateSourceChange(source: string) {
		upcomingTemplateSourceRef.current = source;
		setUpcomingTemplateSource(source);
		setTemplateHistory({ past: [], future: [] });
	}

	function beginVisualTemplateChange() {
		visualChangeStartSourceRef.current ??= upcomingTemplateSourceRef.current;
	}

	function changeVisualTemplateElement(
		elementId: UpcomingTemplateElementId,
		bounds: TemplateElementBounds
	) {
		setUpcomingDefinition(updateUpcomingTemplateElement(
			upcomingTemplateDefinitionRef.current,
			elementId,
			bounds,
			effectiveUpcomingIds.length
		));
	}

	function endVisualTemplateChange() {
		const startingSource = visualChangeStartSourceRef.current;
		visualChangeStartSourceRef.current = null;
		if (!startingSource || startingSource === upcomingTemplateSourceRef.current) return;

		setTemplateHistory((current) => ({
			past: [...current.past.slice(-49), startingSource],
			future: [],
		}));
	}

	function undoVisualTemplateChange() {
		const previousSource = templateHistory.past.at(-1);
		if (!previousSource) return;
		const definition = parseUpcomingEditorialDefinition(previousSource);
		const currentSource = upcomingTemplateSourceRef.current;
		setUpcomingDefinition(definition);
		setTemplateHistory((current) => ({
			past: current.past.slice(0, -1),
			future: [currentSource, ...current.future.slice(0, 49)],
		}));
	}

	function redoVisualTemplateChange() {
		const nextSource = templateHistory.future[0];
		if (!nextSource) return;
		const definition = parseUpcomingEditorialDefinition(nextSource);
		const currentSource = upcomingTemplateSourceRef.current;
		setUpcomingDefinition(definition);
		setTemplateHistory((current) => ({
			past: [...current.past.slice(-49), currentSource],
			future: current.future.slice(1),
		}));
	}

	function resetSelectedTemplateElement() {
		if (!selectedTemplateElementId) return;
		beginVisualTemplateChange();
		setUpcomingDefinition(resetUpcomingTemplateElement(
			upcomingTemplateDefinitionRef.current,
			upcomingEditorialDefaultDefinition,
			selectedTemplateElementId
		));
		endVisualTemplateChange();
	}

	function updateSelectedTemplateElementField(
		field: keyof TemplateElementBounds,
		value: number
	) {
		if (!selectedTemplateElement || !Number.isFinite(value)) return;
		const candidateBounds: TemplateElementBounds = {
			x: selectedTemplateElement.x,
			y: selectedTemplateElement.y,
			width: selectedTemplateElement.width,
			height: selectedTemplateElement.height,
			[field]: value,
		};
		if (
			selectedTemplateElement.resizeMode === "square" &&
			(field === "width" || field === "height")
		) {
			candidateBounds.width = value;
			candidateBounds.height = value;
		}
		const nextBounds = clampTemplateElementBounds(
			candidateBounds,
			selectedTemplateElement.minimumWidth,
			selectedTemplateElement.minimumHeight,
			upcomingTemplateDefinition.canvas.width,
			showSponsors
				? upcomingTemplateDefinition.canvas.height
				: upcomingTemplateDefinition.canvas.sponsorFreeHeight,
			selectedTemplateElement.constraint
		);
		changeVisualTemplateElement(selectedTemplateElement.id, nextBounds);
	}

	function formatUpcomingTemplateSource() {
		try {
			const definition = parseUpcomingEditorialDefinition(upcomingTemplateSource);
			setUpcomingDefinition(definition);
			setTemplateHistory({ past: [], future: [] });
		} catch (error) {
			setTemplateCodeError(
				error instanceof Error ? error.message : "Template JSON is invalid."
			);
		}
	}

	function saveUpcomingTemplateDraft() {
		try {
			const definition = parseUpcomingEditorialDefinition(upcomingTemplateSource);
			const normalisedSource = serializeUpcomingEditorialDefinition(definition);
			localStorage.setItem(upcomingTemplateStorageKey, normalisedSource);
			upcomingTemplateSourceRef.current = normalisedSource;
			upcomingTemplateDefinitionRef.current = definition;
			setUpcomingTemplateSource(normalisedSource);
			setSavedUpcomingTemplateSource(normalisedSource);
			setUpcomingTemplateDefinition(definition);
			setTemplateCodeError("");
			setActionError("");
			setActionMessage("Template draft saved in this browser.");
		} catch (error) {
			setTemplateCodeError(
				error instanceof Error ? error.message : "Template JSON is invalid."
			);
		}
	}

	function restoreUpcomingTemplateOriginal() {
		if (!window.confirm("Restore the original template and remove the browser draft?")) {
			return;
		}

		localStorage.removeItem(upcomingTemplateStorageKey);
		setUpcomingTemplateSource(upcomingEditorialDefaultSource);
		setSavedUpcomingTemplateSource(upcomingEditorialDefaultSource);
		setUpcomingTemplateDefinition(upcomingEditorialDefaultDefinition);
		upcomingTemplateSourceRef.current = upcomingEditorialDefaultSource;
		upcomingTemplateDefinitionRef.current = upcomingEditorialDefaultDefinition;
		setTemplateHistory({ past: [], future: [] });
		setTemplateCodeError("");
		setActionError("");
		setActionMessage("The original Upcoming Fixtures template has been restored.");
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

			<div className={`grid gap-4 ${isTemplateEditorOpen && kind === "upcomingFixtures"
				? "xl:grid-cols-[minmax(28rem,1fr)_minmax(28rem,1.1fr)]"
				: "xl:grid-cols-[minmax(19rem,0.78fr)_minmax(28rem,1.22fr)]"
			}`}>
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

						{kind === "upcomingFixtures" && (
							<div className="mt-3 flex flex-wrap items-center gap-2">
								<button
									type="button"
									onClick={() => setIsTemplateEditorOpen((current) => !current)}
									className="btn-secondary px-3 py-2 text-xs"
								>
									{isTemplateEditorOpen ? "Close template code" : "Edit template code"}
								</button>
								{savedUpcomingTemplateSource !== upcomingEditorialDefaultSource && (
									<span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
										Browser override active
									</span>
								)}
							</div>
						)}
					</section>

					{kind === "upcomingFixtures" && isTemplateEditorOpen && (
						<section className="mt-5 border-t border-slate-200 pt-5">
							<div className="flex flex-wrap items-start justify-between gap-2">
								<div>
									<h2 className="text-base font-bold text-slate-900">Template code</h2>
									<p className="mt-1 text-xs leading-5 text-slate-600">
										Edit the JSON to change colours, spacing, sizing and positions. Valid changes update the preview automatically.
									</p>
								</div>
								<span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-bold text-sky-800">
									Local pilot
								</span>
							</div>

							<div className="mt-3">
								<Suspense fallback={(
									<div className="grid h-[30rem] place-items-center rounded-xl border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-500">
										Loading code editor…
									</div>
								)}>
									<TemplateCodeEditor
										value={upcomingTemplateSource}
										onChange={handleUpcomingTemplateSourceChange}
									/>
								</Suspense>
							</div>

							{templateCodeError ? (
								<p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold leading-5 text-rose-700">
									{templateCodeError} The last valid preview remains active.
								</p>
							) : (
								<p className="mt-2 text-xs font-semibold text-emerald-700">
									Valid template{upcomingTemplateSource !== savedUpcomingTemplateSource ? " · Unsaved changes" : " · Saved"}
								</p>
							)}

							<div className="mt-3 flex flex-wrap gap-2">
								<button
									type="button"
									onClick={saveUpcomingTemplateDraft}
									disabled={Boolean(templateCodeError)}
									className="btn-primary px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-45"
								>
									Save browser draft
								</button>
								<button type="button" onClick={formatUpcomingTemplateSource} className="btn-secondary px-3 py-2 text-xs">
									Format JSON
								</button>
								<button type="button" onClick={restoreUpcomingTemplateOriginal} className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50">
									Restore original
								</button>
							</div>
						</section>
					)}

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
					<div className="flex flex-wrap items-center justify-between gap-3">
						<h2 className="text-base font-bold text-slate-900">Preview</h2>
						<div className="flex flex-wrap items-center justify-end gap-2">
							<span className="text-xs font-semibold text-slate-500">
								{previewDimensions ? `${previewDimensions.width} × ${previewDimensions.height}` : "Waiting for template"}
							</span>
							{kind === "upcomingFixtures" && selectedTemplate && (
								<button
									type="button"
									onClick={() => {
										setIsCanvasEditorOpen((current) => !current);
										setSelectedTemplateElementId((current) => current ?? "headline");
									}}
									className={isCanvasEditorOpen ? "btn-primary px-3 py-2 text-xs" : "btn-secondary px-3 py-2 text-xs"}
								>
									{isCanvasEditorOpen ? "Finish canvas editing" : "Edit canvas"}
								</button>
							)}
						</div>
					</div>

					{kind === "upcomingFixtures" && isCanvasEditorOpen && (
						<div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
							<div className="flex min-w-0 items-center gap-2">
								{canMoveUpTemplateHierarchy && (
									<button
										type="button"
										onClick={() => setSelectedTemplateElementId(selectedTemplateParentId)}
										className="shrink-0 rounded-lg border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-bold text-sky-900"
									>
										← {activeTemplateElementId === "fixture-list" ? "All elements" : "Up one level"}
									</button>
								)}
								<p className="text-xs font-semibold text-sky-900">
									{selectedTemplateElement?.drillable
										? "Click an outlined child to drill into it. Drag the selected outline to move the shared layout."
										: "Select an outlined region, then drag or resize it. Arrow keys nudge by 1px; hold Shift for 10px."}
								</p>
							</div>
							<div className="flex gap-2">
								<button type="button" onClick={undoVisualTemplateChange} disabled={templateHistory.past.length === 0} className="rounded-lg border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-bold text-sky-900 disabled:opacity-40">
									Undo
								</button>
								<button type="button" onClick={redoVisualTemplateChange} disabled={templateHistory.future.length === 0} className="rounded-lg border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-bold text-sky-900 disabled:opacity-40">
									Redo
								</button>
							</div>
						</div>
					)}

					<div className="mt-3 grid min-h-[24rem] place-items-center rounded-2xl border border-slate-200 bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0] p-4">
						{selectedTemplate && previewDimensions ? (
							<div
								className="relative w-full bg-white shadow-2xl"
								style={{
									aspectRatio: `${previewDimensions.width} / ${previewDimensions.height}`,
									maxWidth: `${Math.min(42, 42 * previewDimensions.width / previewDimensions.height)}rem`,
								}}
							>
								<canvas ref={canvasRef} className="absolute inset-0 h-full w-full bg-white" aria-label="Generated social media graphic preview" />
								{kind === "upcomingFixtures" && isCanvasEditorOpen && (
									<TemplateCanvasOverlay
										canvasWidth={previewDimensions.width}
										canvasHeight={previewDimensions.height}
										elements={upcomingTemplateElements}
										selectedId={activeTemplateElementId}
										onSelect={setSelectedTemplateElementId}
										onChangeStart={beginVisualTemplateChange}
										onChange={changeVisualTemplateElement}
										onChangeEnd={endVisualTemplateChange}
									/>
								)}
							</div>
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

					{kind === "upcomingFixtures" && isCanvasEditorOpen && selectedTemplateElement && (
						<div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<div>
									<p className="text-sm font-bold text-slate-900">{selectedTemplateElement.label}</p>
									<p className="text-xs text-slate-500">
										Exact canvas measurements in pixels
										{selectedTemplateElement.sharedAcrossRows ? " · Changes apply to every fixture row" : ""}
									</p>
								</div>
								<button type="button" onClick={resetSelectedTemplateElement} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100">
									Reset element
								</button>
							</div>
							<div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
								{(["x", "y", "width", "height"] as const).map((field) => (
									<label key={field} className="text-xs font-bold uppercase tracking-wide text-slate-600">
										{field}
										<input
											type="number"
											step="1"
											disabled={
												(field === "width" && selectedTemplateElement.resizeMode === "none") ||
								(field === "height" && (selectedTemplateElement.resizeMode === "horizontal" || selectedTemplateElement.resizeMode === "none"))
											}
											value={Math.round(selectedTemplateElement[field] * 10) / 10}
											onFocus={beginVisualTemplateChange}
											onBlur={endVisualTemplateChange}
											onChange={(event) => updateSelectedTemplateElementField(field, Number(event.target.value))}
											className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-semibold normal-case tracking-normal text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
										/>
									</label>
								))}
							</div>
						</div>
					)}

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

function clampTemplateElementBounds(
	bounds: TemplateElementBounds,
	minimumWidth: number,
	minimumHeight: number,
	canvasWidth: number,
	canvasHeight: number,
	constraint?: TemplateElementBounds
): TemplateElementBounds {
	const left = constraint?.x ?? 0;
	const top = constraint?.y ?? 0;
	const right = constraint ? constraint.x + constraint.width : canvasWidth;
	const bottom = constraint ? constraint.y + constraint.height : canvasHeight;
	const x = Math.min(Math.max(bounds.x, left), right - minimumWidth);
	const y = Math.min(Math.max(bounds.y, top), bottom - minimumHeight);
	const width = Math.min(Math.max(bounds.width, minimumWidth), right - x);
	const height = Math.min(Math.max(bounds.height, minimumHeight), bottom - y);
	return {
		x,
		y,
		width,
		height,
	};
}

function toFilenamePart(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "") || "social-graphic";
}
