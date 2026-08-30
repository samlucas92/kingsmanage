import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { getClubSportDefinition } from "../../constants/sports";
import type { SportFormation } from "../../constants/sports";
import { useAuthStore } from "../../stores/auth";
import { useClubTeamStore } from "../../stores/clubTeams";
import { useMatchStore } from "../../stores/match";
import { usePlayerStore } from "../../stores/players";
import type { Player } from "../../stores/players";
import { useSeasonStore } from "../../stores/seasons";
import { socialGraphicTemplatesApi } from "../../services/socialGraphicTemplatesApi";
import { socialPublicationsApi } from "../../services/socialPublicationsApi";
import { formatDateForInput } from "../../utils/date";
import { socialGraphicAssetManifest } from "./assetManifest";
import {
	staticEditableTemplateAdapters,
	staticEditableTemplateAdaptersById,
} from "./editableTemplateAdapters";
import type { StaticEditableTemplateDefinition } from "./editableTemplateAdapters";
import { TemplateCanvasOverlay } from "./TemplateCanvasOverlay";
import { SocialPublishModal } from "./SocialPublishModal";
import {
	copyCanvasPng,
	downloadCanvasPng,
	getSocialExportDimensions,
	getSocialGraphicDimensions,
	renderSocialGraphic,
} from "./socialGraphicCanvas";
import {
	applySocialFixtureOverride,
	formatScorersForInput,
	getClubScore,
	getDefaultHeadline,
	getGraphicKindLabel,
	getOpponentScore,
	parseScorersInput,
	toSocialFixture,
	toSocialLineup,
	withLineupCaptain,
} from "./socialGraphicModel";
import { socialGraphicTemplates } from "./templateRegistry";
import {
	getStaticTemplateElements,
	resetStaticTemplateElement,
	updateStaticTemplateElement,
} from "./staticTemplateElements";
import {
	createUpcomingEditorialTemplate,
	isUpcomingFixtureRowUnlocked,
	parseUpcomingEditorialDefinition,
	serializeUpcomingEditorialDefinition,
	setUpcomingFixtureRowUnlocked,
	UPCOMING_FIXTURE_LIMIT,
	upcomingEditorialDefaultDefinition,
	upcomingEditorialDefaultSource,
} from "./templates/upcomingEditorialTemplate";
import type {
	SocialFixture,
	SocialFixtureOverride,
	SocialGraphicAsset,
	SocialGraphicContent,
	SocialGraphicKind,
	SocialLineup,
	SocialLineupPlayer,
} from "./types";
import {
	getUpcomingTemplateElements,
	getUpcomingTemplateParentId,
	getUpcomingTemplateRowIndex,
	resetUpcomingTemplateElement,
	updateUpcomingTemplateElement,
} from "./upcomingTemplateElements";
import type {
	TemplateElementBounds,
	UpcomingTemplateElementId,
} from "./upcomingTemplateElements";

const graphicKinds: SocialGraphicKind[] = [
	"blank",
	"upcomingFixtures",
	"fixture",
	"lineup",
	"result",
];
const placeholderAssetId = "__placeholder__";
const upcomingTemplateId = "upcoming-editorial-gold";
const upcomingTemplateStoragePrefix = "kingsmanage:social-template:upcoming-editorial-gold:v1";
const TemplateCodeEditor = lazy(() => import("./TemplateCodeEditor").then(
	(module) => ({ default: module.TemplateCodeEditor })
));

type StaticTemplateEditorState = {
	source: string;
	savedSource: string;
	definition: StaticEditableTemplateDefinition;
	revision: number;
	isLoading: boolean;
	isSaving: boolean;
	codeError: string;
	persistenceError: string;
	history: { past: string[]; future: string[] };
};

const initialStaticTemplateStates = Object.fromEntries(
	staticEditableTemplateAdapters.map((adapter) => [adapter.id, {
		source: adapter.defaultSource,
		savedSource: adapter.defaultSource,
		definition: adapter.defaultDefinition,
		revision: 0,
		isLoading: false,
		isSaving: false,
		codeError: "",
		persistenceError: "",
		history: { past: [], future: [] },
	}])
) as Record<string, StaticTemplateEditorState>;

export default function SocialMediaStudio() {
	const [searchParams] = useSearchParams();
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const loadedContentIdRef = useRef("");
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
	const currentUser = useAuthStore((state) => state.currentUser);

	const [kind, setKind] = useState<SocialGraphicKind>("upcomingFixtures");
	const [selectedTemplateId, setSelectedTemplateId] = useState("");
	const [selectedUpcomingIds, setSelectedUpcomingIds] = useState<string[]>([]);
	const [selectedFixtureId, setSelectedFixtureId] = useState("");
	const [selectedLineupId, setSelectedLineupId] = useState("");
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
	const [lineupOverrides, setLineupOverrides] = useState<Record<string, SocialLineup>>({});
	const [temporaryAssets, setTemporaryAssets] = useState<Record<string, SocialGraphicAsset>>({});
	const [isRendering, setIsRendering] = useState(false);
	const [actionMessage, setActionMessage] = useState("");
	const [actionError, setActionError] = useState("");
	const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
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
	const [templatePersistenceError, setTemplatePersistenceError] = useState("");
	const [upcomingTemplateRevision, setUpcomingTemplateRevision] = useState(0);
	const [isLoadingUpcomingTemplate, setIsLoadingUpcomingTemplate] = useState(false);
	const [isSavingUpcomingTemplate, setIsSavingUpcomingTemplate] = useState(false);
	const [isCanvasEditorOpen, setIsCanvasEditorOpen] = useState(false);
	const [selectedTemplateElementId, setSelectedTemplateElementId] = useState<UpcomingTemplateElementId | null>("headline");
	const [templateHistory, setTemplateHistory] = useState<{
		past: string[];
		future: string[];
	}>({ past: [], future: [] });
	const upcomingTemplateSourceRef = useRef(upcomingTemplateSource);
	const upcomingTemplateDefinitionRef = useRef(upcomingTemplateDefinition);
	const visualChangeStartSourceRef = useRef<string | null>(null);
	const [staticTemplateStates, setStaticTemplateStates] = useState(
		initialStaticTemplateStates
	);
	const [selectedStaticTemplateElementId, setSelectedStaticTemplateElementId] = useState<string | null>("headline");
	const staticTemplateStatesRef = useRef(staticTemplateStates);
	const staticVisualChangeStartSourceRef = useRef<string | null>(null);

	const currentClub = availableClubs.find((club) => club.isCurrent);
	const clubName = currentClub?.name ?? "Your club";
	const clubSportDefinition = useMemo(
		() => getClubSportDefinition(currentClub?.sportKey, currentClub?.customFormations),
		[currentClub?.sportKey, currentClub?.customFormations]
	);
	const activeSeason = seasons.find((season) => season.id === activeSeasonId);
	const upcomingTemplateStorageKey = `${upcomingTemplateStoragePrefix}:${currentClub?.id ?? "default"}`;

	useEffect(() => {
		void loadSeasons();
		void loadTeamProfiles();
		void loadPlayers();
	}, [loadSeasons, loadTeamProfiles, loadPlayers]);

	useEffect(() => {
		const contentId = searchParams.get("contentId") ?? "";
		if (!contentId || loadedContentIdRef.current === contentId) return;
		loadedContentIdRef.current = contentId;
		void socialPublicationsApi.get(contentId).then((publication) => {
			if (!publication.editorStateJson) throw new Error("This saved item has no editable studio state. Its exported image is still available in the content library.");
			const state = JSON.parse(publication.editorStateJson) as Record<string, unknown>;
			if (isGraphicKind(state.kind)) setKind(state.kind);
			if (typeof state.selectedTemplateId === "string") setSelectedTemplateId(state.selectedTemplateId);
			if (Array.isArray(state.selectedUpcomingIds)) setSelectedUpcomingIds(state.selectedUpcomingIds.filter((id): id is string => typeof id === "string"));
			if (typeof state.selectedFixtureId === "string") setSelectedFixtureId(state.selectedFixtureId);
			if (typeof state.selectedLineupId === "string") setSelectedLineupId(state.selectedLineupId);
			if (typeof state.selectedResultId === "string") setSelectedResultId(state.selectedResultId);
			if (typeof state.headline === "string") setHeadline(state.headline);
			if (typeof state.footer === "string") setFooter(state.footer);
			if (typeof state.clubHandle === "string") setClubHandle(state.clubHandle);
			if (isRecord(state.templateFieldValues)) setTemplateFieldValues(state.templateFieldValues as Record<string, string | boolean>);
			if (typeof state.homeTeamLogoId === "string") setHomeTeamLogoId(state.homeTeamLogoId);
			if (typeof state.awayTeamLogoId === "string") setAwayTeamLogoId(state.awayTeamLogoId);
			if (typeof state.featuredImageId === "string") setFeaturedImageId(state.featuredImageId);
			if (Array.isArray(state.sponsorIds)) setSponsorIds([...state.sponsorIds.filter((id): id is string => typeof id === "string"), "", "", ""].slice(0, 3));
			if (isRecord(state.fixtureOverrides)) setFixtureOverrides(state.fixtureOverrides as Record<string, SocialFixtureOverride>);
			if (isRecord(state.lineupOverrides)) setLineupOverrides(state.lineupOverrides as Record<string, SocialLineup>);
			setActionError("");
			setActionMessage(`Loaded “${publication.title}” as a new editable copy.`);
		}).catch((loadError) => {
			setActionMessage("");
			setActionError(loadError instanceof Error ? loadError.message : "The saved content could not be loaded.");
		});
	}, [searchParams]);

	useEffect(() => {
		temporaryAssetsRef.current = temporaryAssets;
	}, [temporaryAssets]);

	useEffect(() => {
		upcomingTemplateSourceRef.current = upcomingTemplateSource;
		upcomingTemplateDefinitionRef.current = upcomingTemplateDefinition;
	}, [upcomingTemplateSource, upcomingTemplateDefinition]);

	useEffect(() => {
		staticTemplateStatesRef.current = staticTemplateStates;
	}, [staticTemplateStates]);

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
		let cancelled = false;

		async function loadTemplate() {
			setIsLoadingUpcomingTemplate(true);
			setUpcomingTemplateRevision(0);
			setTemplatePersistenceError("");

			try {
				const response = await socialGraphicTemplatesApi.get(upcomingTemplateId);
				if (cancelled) return;

				if (response.customization) {
					setUpcomingTemplateRevision(response.customization.revision);
					try {
						const definition = parseUpcomingEditorialDefinition(
							response.customization.definitionJson
						);
						const normalisedSource = serializeUpcomingEditorialDefinition(definition);
						setUpcomingTemplateSource(normalisedSource);
						setSavedUpcomingTemplateSource(normalisedSource);
						setUpcomingTemplateDefinition(definition);
						setTemplateCodeError("");
						localStorage.removeItem(upcomingTemplateStorageKey);
					} catch {
						setUpcomingTemplateSource(upcomingEditorialDefaultSource);
						setSavedUpcomingTemplateSource(upcomingEditorialDefaultSource);
						setUpcomingTemplateDefinition(upcomingEditorialDefaultDefinition);
						setTemplatePersistenceError(
							"The stored club template is incompatible. The bundled original is shown; restore it before editing."
						);
					}
					return;
				}

				const storedSource = localStorage.getItem(upcomingTemplateStorageKey);
				if (storedSource) {
					try {
						const definition = parseUpcomingEditorialDefinition(storedSource);
						const normalisedSource = serializeUpcomingEditorialDefinition(definition);
						setUpcomingTemplateSource(normalisedSource);
						setSavedUpcomingTemplateSource(upcomingEditorialDefaultSource);
						setUpcomingTemplateDefinition(definition);
						setTemplateCodeError("");
						setActionMessage("Your browser draft is ready to save as the club template.");
						return;
					} catch {
						localStorage.removeItem(upcomingTemplateStorageKey);
						setTemplateCodeError("The saved browser draft was invalid, so the original template is active.");
					}
				}

				setUpcomingTemplateSource(upcomingEditorialDefaultSource);
				setSavedUpcomingTemplateSource(upcomingEditorialDefaultSource);
				setUpcomingTemplateDefinition(upcomingEditorialDefaultDefinition);
			} catch (error) {
				if (cancelled) return;
				setUpcomingTemplateSource(upcomingEditorialDefaultSource);
				setSavedUpcomingTemplateSource(upcomingEditorialDefaultSource);
				setUpcomingTemplateDefinition(upcomingEditorialDefaultDefinition);
				setTemplatePersistenceError(
					error instanceof Error
						? `The club template could not be loaded: ${error.message}`
						: "The club template could not be loaded."
				);
			} finally {
				if (!cancelled) setIsLoadingUpcomingTemplate(false);
			}
		}

		void loadTemplate();

		return () => {
			cancelled = true;
		};
	}, [upcomingTemplateStorageKey]);

	useEffect(() => {
		let cancelled = false;

		async function loadStaticTemplates() {
			setStaticTemplateStates((current) => Object.fromEntries(
				Object.entries(current).map(([id, state]) => [id, {
					...state,
					isLoading: true,
					persistenceError: "",
				}])
			) as Record<string, StaticTemplateEditorState>);

			await Promise.all(staticEditableTemplateAdapters.map(async (adapter) => {
				try {
					const response = await socialGraphicTemplatesApi.get(adapter.id);
					if (cancelled) return;
					const definition = response.customization
						? adapter.parse(response.customization.definitionJson)
						: adapter.defaultDefinition;
					const source = adapter.serialize(definition);
					setStaticTemplateStates((current) => ({
						...current,
						[adapter.id]: {
							...current[adapter.id],
							source,
							savedSource: source,
							definition,
							revision: response.customization?.revision ?? 0,
							isLoading: false,
							codeError: "",
						},
					}));
				} catch (error) {
					if (cancelled) return;
					setStaticTemplateStates((current) => ({
						...current,
						[adapter.id]: {
							...current[adapter.id],
							isLoading: false,
							persistenceError: error instanceof Error
								? `The club template could not be loaded: ${error.message}`
								: "The club template could not be loaded.",
						},
					}));
				}
			}));
		}

		void loadStaticTemplates();
		return () => { cancelled = true; };
	}, [currentClub?.id]);

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
	const effectiveLineupId = upcomingMatches.some((match) => match.id === selectedLineupId)
		? selectedLineupId
		: upcomingMatches[0]?.id ?? "";
	const effectiveResultId = completedMatches.some((match) => match.id === selectedResultId)
		? selectedResultId
		: completedMatches[0]?.id ?? "";
	const selectedSingleMatch = kind === "result"
		? completedMatches.find((match) => match.id === effectiveResultId)
		: kind === "lineup"
			? upcomingMatches.find((match) => match.id === effectiveLineupId)
			: kind === "fixture"
				? upcomingMatches.find((match) => match.id === effectiveFixtureId)
				: undefined;
	const clubLogoIsHome = kind === "upcomingFixtures" || kind === "lineup" || selectedSingleMatch?.venue !== "away";
	const homeTeamLogoFallbackIndex = clubLogoIsHome ? 0 : -1;
	const awayTeamLogoFallbackIndex = clubLogoIsHome ? -1 : 0;

	useEffect(() => {
		const matchId = kind === "result"
			? effectiveResultId
			: kind === "lineup" ? effectiveLineupId : "";
		if (!matchId) return;
		const selectedMatch = matches.find((match) => match.id === matchId);
		if (!selectedMatch?.isDetailLoaded) void loadMatch(matchId);
	}, [kind, effectiveLineupId, effectiveResultId, matches, loadMatch]);

	const editableUpcomingTemplate = useMemo(
		() => createUpcomingEditorialTemplate(upcomingTemplateDefinition),
		[upcomingTemplateDefinition]
	);
	const editableStaticTemplates = useMemo(
		() => Object.fromEntries(staticEditableTemplateAdapters.map((adapter) => [
			adapter.id,
			adapter.create(staticTemplateStates[adapter.id].definition),
		])),
		[staticTemplateStates]
	);
	const availableTemplates = useMemo(
		() => socialGraphicTemplates
			.map((template) => template.id === editableUpcomingTemplate.id
				? editableUpcomingTemplate
				: editableStaticTemplates[template.id] ?? template)
			.filter((template) => template.supportedKinds.includes(kind)),
		[kind, editableUpcomingTemplate, editableStaticTemplates]
	);

	const effectiveTemplateId = availableTemplates.some(
		(template) => template.id === selectedTemplateId
	)
		? selectedTemplateId
		: availableTemplates[0]?.id ?? "";
	const selectedTemplate = availableTemplates.find(
		(template) => template.id === effectiveTemplateId
	);
	const selectedStaticTemplateAdapter = staticEditableTemplateAdaptersById[effectiveTemplateId];
	const selectedStaticTemplateState = selectedStaticTemplateAdapter
		? staticTemplateStates[effectiveTemplateId]
		: undefined;
	const isEditableTemplate = effectiveTemplateId === upcomingTemplateId || Boolean(selectedStaticTemplateAdapter);
	const selectedStaticTemplateSource = selectedStaticTemplateState?.source;
	const selectedStaticTemplateDefinition = selectedStaticTemplateState?.definition;

	useEffect(() => {
		if (!selectedStaticTemplateAdapter || !selectedStaticTemplateSource) return;
		const templateId = selectedStaticTemplateAdapter.id;
		const source = selectedStaticTemplateSource;
		const timeout = window.setTimeout(() => {
			try {
				const definition = selectedStaticTemplateAdapter.parse(source);
				setStaticTemplateStates((current) => ({
					...current,
					[templateId]: { ...current[templateId], definition, codeError: "" },
				}));
			} catch (error) {
				setStaticTemplateStates((current) => ({
					...current,
					[templateId]: {
						...current[templateId],
						codeError: error instanceof Error ? error.message : "Template JSON is invalid.",
					},
				}));
			}
		}, 250);
		return () => window.clearTimeout(timeout);
	}, [selectedStaticTemplateAdapter, selectedStaticTemplateSource]);
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
	const staticTemplateElements = useMemo(
		() => selectedStaticTemplateDefinition
			? getStaticTemplateElements(
				effectiveTemplateId,
				selectedStaticTemplateDefinition,
				showSponsors
			)
			: [],
		[effectiveTemplateId, selectedStaticTemplateDefinition, showSponsors]
	);
	const selectedStaticTemplateElement = staticTemplateElements.find(
		(element) => element.id === selectedStaticTemplateElementId
	) ?? null;
	const activeTemplateElementId = selectedTemplateElement?.id ?? null;
	const selectedTemplateParentId = activeTemplateElementId
		? getUpcomingTemplateParentId(activeTemplateElementId)
		: null;
	const canMoveUpTemplateHierarchy = Boolean(
		selectedTemplateParentId || activeTemplateElementId === "fixture-list"
	);
	const selectedFixtureRowIndex = getUpcomingTemplateRowIndex(activeTemplateElementId);
	const selectedFixtureRowIsUnlocked = selectedFixtureRowIndex !== null &&
		isUpcomingFixtureRowUnlocked(upcomingTemplateDefinition, selectedFixtureRowIndex);
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
		if (kind === "blank") return [];

		if (kind === "upcomingFixtures") {
			const selectedIds = new Set(effectiveUpcomingIds);
			return upcomingMatches.filter((match) => selectedIds.has(match.id));
		}

		const selectedId = kind === "fixture"
			? effectiveFixtureId
			: kind === "lineup" ? effectiveLineupId : effectiveResultId;
		return seasonMatches.filter((match) => match.id === selectedId);
	}, [
		kind,
		effectiveUpcomingIds,
		upcomingMatches,
		effectiveFixtureId,
		effectiveLineupId,
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
	const selectedLineup = useMemo(() => {
		if (kind !== "lineup" || !selectedSingleMatch) return undefined;
		return lineupOverrides[selectedSingleMatch.id] ?? toSocialLineup(
			selectedSingleMatch,
			players,
			clubSportDefinition.formations
		);
	}, [kind, selectedSingleMatch, lineupOverrides, players, clubSportDefinition.formations]);

	const content = useMemo<SocialGraphicContent>(() => ({
		kind,
		clubName,
		clubHandle: clubHandle.trim(),
		headline: headline.trim() || getDefaultHeadline(kind),
		footer: footer.trim() || `Come on, ${clubName}!`,
		fixtures: selectedSocialFixtures,
		lineup: selectedLineup,
		fields: effectiveTemplateFields,
		assets: selectedAssets,
	}), [
		kind,
		clubName,
		clubHandle,
		headline,
		footer,
		selectedSocialFixtures,
		selectedLineup,
		effectiveTemplateFields,
		selectedAssets,
	]);
	const previewDimensions = selectedTemplate
		? getSocialGraphicDimensions(selectedTemplate, content)
		: undefined;
	const exportDimensions = previewDimensions
		? getSocialExportDimensions(previewDimensions.width, previewDimensions.height)
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

			return effectiveUpcomingIds.length >= UPCOMING_FIXTURE_LIMIT
				? effectiveUpcomingIds
				: [...effectiveUpcomingIds, matchId];
		});
	}

	function handleKindChange(nextKind: SocialGraphicKind) {
		setKind(nextKind);
		setHeadline(getDefaultHeadline(nextKind));
		setTemplateFieldValues({});
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

	function toggleSelectedFixtureRowLock() {
		if (selectedFixtureRowIndex === null) return;
		beginVisualTemplateChange();
		setUpcomingDefinition(setUpcomingFixtureRowUnlocked(
			upcomingTemplateDefinitionRef.current,
			selectedFixtureRowIndex,
			!selectedFixtureRowIsUnlocked
		));
		endVisualTemplateChange();
	}

	function navigateUpTemplateHierarchy() {
		setSelectedTemplateElementId(selectedTemplateParentId);
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

	async function saveUpcomingTemplateDraft() {
		try {
			const definition = parseUpcomingEditorialDefinition(upcomingTemplateSource);
			const normalisedSource = serializeUpcomingEditorialDefinition(definition);
			setIsSavingUpcomingTemplate(true);
			const customization = await socialGraphicTemplatesApi.save(upcomingTemplateId, {
				schemaVersion: definition.version,
				definitionJson: normalisedSource,
				expectedRevision: upcomingTemplateRevision,
			});
			localStorage.removeItem(upcomingTemplateStorageKey);
			upcomingTemplateSourceRef.current = normalisedSource;
			upcomingTemplateDefinitionRef.current = definition;
			setUpcomingTemplateSource(normalisedSource);
			setSavedUpcomingTemplateSource(normalisedSource);
			setUpcomingTemplateDefinition(definition);
			setUpcomingTemplateRevision(customization.revision);
			setTemplateCodeError("");
			setTemplatePersistenceError("");
			setActionError("");
			setActionMessage(`Club template saved as revision ${customization.revision}.`);
		} catch (error) {
			const message = error instanceof Error ? error.message : "The template could not be saved.";
			setActionError(message);
			if (message.toLowerCase().includes("json")) setTemplateCodeError(message);
		} finally {
			setIsSavingUpcomingTemplate(false);
		}
	}

	async function restoreUpcomingTemplateOriginal() {
		if (!window.confirm("Restore the bundled original template for this club? Revision history will be retained.")) {
			return;
		}

		try {
			setIsSavingUpcomingTemplate(true);
			if (upcomingTemplateRevision > 0) {
				await socialGraphicTemplatesApi.reset(upcomingTemplateId, upcomingTemplateRevision);
			}
			localStorage.removeItem(upcomingTemplateStorageKey);
			setUpcomingTemplateSource(upcomingEditorialDefaultSource);
			setSavedUpcomingTemplateSource(upcomingEditorialDefaultSource);
			setUpcomingTemplateDefinition(upcomingEditorialDefaultDefinition);
			setUpcomingTemplateRevision(0);
			upcomingTemplateSourceRef.current = upcomingEditorialDefaultSource;
			upcomingTemplateDefinitionRef.current = upcomingEditorialDefaultDefinition;
			setTemplateHistory({ past: [], future: [] });
			setTemplateCodeError("");
			setTemplatePersistenceError("");
			setActionError("");
			setActionMessage("The bundled Upcoming Fixtures template is active again.");
		} catch (error) {
			setActionError(
				error instanceof Error ? error.message : "The original template could not be restored."
			);
		} finally {
			setIsSavingUpcomingTemplate(false);
		}
	}

	function updateStaticTemplateState(
		templateId: string,
		update: (state: StaticTemplateEditorState) => StaticTemplateEditorState
	) {
		const current = staticTemplateStatesRef.current;
		const next = { ...current, [templateId]: update(current[templateId]) };
		staticTemplateStatesRef.current = next;
		setStaticTemplateStates(next);
	}

	function setStaticDefinition(
		templateId: string,
		definition: StaticEditableTemplateDefinition
	) {
		const adapter = staticEditableTemplateAdaptersById[templateId];
		if (!adapter) return;
		const source = adapter.serialize(definition);
		updateStaticTemplateState(templateId, (state) => ({
			...state,
			source,
			definition,
			codeError: "",
		}));
	}

	function handleStaticTemplateSourceChange(templateId: string, source: string) {
		updateStaticTemplateState(templateId, (state) => ({
			...state,
			source,
			history: { past: [], future: [] },
		}));
	}

	function beginStaticVisualTemplateChange() {
		if (!selectedStaticTemplateAdapter) return;
		staticVisualChangeStartSourceRef.current ??=
			staticTemplateStatesRef.current[selectedStaticTemplateAdapter.id].source;
	}

	function changeStaticVisualTemplateElement(
		elementId: string,
		bounds: TemplateElementBounds
	) {
		if (!selectedStaticTemplateAdapter) return;
		const state = staticTemplateStatesRef.current[selectedStaticTemplateAdapter.id];
		setStaticDefinition(
			selectedStaticTemplateAdapter.id,
			updateStaticTemplateElement(state.definition, elementId, bounds)
		);
	}

	function endStaticVisualTemplateChange() {
		if (!selectedStaticTemplateAdapter) return;
		const templateId = selectedStaticTemplateAdapter.id;
		const startingSource = staticVisualChangeStartSourceRef.current;
		staticVisualChangeStartSourceRef.current = null;
		const currentSource = staticTemplateStatesRef.current[templateId].source;
		if (!startingSource || startingSource === currentSource) return;
		updateStaticTemplateState(templateId, (state) => ({
			...state,
			history: {
				past: [...state.history.past.slice(-49), startingSource],
				future: [],
			},
		}));
	}

	function undoStaticVisualTemplateChange() {
		if (!selectedStaticTemplateAdapter) return;
		const templateId = selectedStaticTemplateAdapter.id;
		const state = staticTemplateStatesRef.current[templateId];
		const previousSource = state.history.past.at(-1);
		if (!previousSource) return;
		const definition = selectedStaticTemplateAdapter.parse(previousSource);
		updateStaticTemplateState(templateId, (current) => ({
			...current,
			source: previousSource,
			definition,
			codeError: "",
			history: {
				past: current.history.past.slice(0, -1),
				future: [current.source, ...current.history.future.slice(0, 49)],
			},
		}));
	}

	function redoStaticVisualTemplateChange() {
		if (!selectedStaticTemplateAdapter) return;
		const templateId = selectedStaticTemplateAdapter.id;
		const state = staticTemplateStatesRef.current[templateId];
		const nextSource = state.history.future[0];
		if (!nextSource) return;
		const definition = selectedStaticTemplateAdapter.parse(nextSource);
		updateStaticTemplateState(templateId, (current) => ({
			...current,
			source: nextSource,
			definition,
			codeError: "",
			history: {
				past: [...current.history.past.slice(-49), current.source],
				future: current.history.future.slice(1),
			},
		}));
	}

	function resetSelectedStaticTemplateElement() {
		if (!selectedStaticTemplateAdapter || !selectedStaticTemplateElementId) return;
		const templateId = selectedStaticTemplateAdapter.id;
		const state = staticTemplateStatesRef.current[templateId];
		beginStaticVisualTemplateChange();
		setStaticDefinition(templateId, resetStaticTemplateElement(
			state.definition,
			selectedStaticTemplateAdapter.defaultDefinition,
			selectedStaticTemplateElementId
		));
		endStaticVisualTemplateChange();
	}

	function updateSelectedStaticTemplateElementField(
		field: keyof TemplateElementBounds,
		value: number
	) {
		if (!selectedStaticTemplateElement || !selectedStaticTemplateState || !Number.isFinite(value)) return;
		const nextBounds = clampTemplateElementBounds(
			{ ...selectedStaticTemplateElement, [field]: value },
			selectedStaticTemplateElement.minimumWidth,
			selectedStaticTemplateElement.minimumHeight,
			selectedStaticTemplateState.definition.canvas.width,
			showSponsors
				? selectedStaticTemplateState.definition.canvas.height
				: selectedStaticTemplateState.definition.canvas.sponsorFreeHeight
		);
		changeStaticVisualTemplateElement(selectedStaticTemplateElement.id, nextBounds);
	}

	function formatStaticTemplateSource() {
		if (!selectedStaticTemplateAdapter || !selectedStaticTemplateState) return;
		try {
			const definition = selectedStaticTemplateAdapter.parse(selectedStaticTemplateState.source);
			setStaticDefinition(selectedStaticTemplateAdapter.id, definition);
			updateStaticTemplateState(selectedStaticTemplateAdapter.id, (state) => ({
				...state,
				history: { past: [], future: [] },
			}));
		} catch (error) {
			updateStaticTemplateState(selectedStaticTemplateAdapter.id, (state) => ({
				...state,
				codeError: error instanceof Error ? error.message : "Template JSON is invalid.",
			}));
		}
	}

	async function saveStaticTemplateDraft() {
		if (!selectedStaticTemplateAdapter || !selectedStaticTemplateState) return;
		const templateId = selectedStaticTemplateAdapter.id;
		try {
			const definition = selectedStaticTemplateAdapter.parse(selectedStaticTemplateState.source);
			const source = selectedStaticTemplateAdapter.serialize(definition);
			updateStaticTemplateState(templateId, (state) => ({ ...state, isSaving: true }));
			const customization = await socialGraphicTemplatesApi.save(templateId, {
				schemaVersion: definition.version,
				definitionJson: source,
				expectedRevision: selectedStaticTemplateState.revision,
			});
			updateStaticTemplateState(templateId, (state) => ({
				...state,
				source,
				savedSource: source,
				definition,
				revision: customization.revision,
				isSaving: false,
				codeError: "",
				persistenceError: "",
			}));
			setActionError("");
			setActionMessage(`Club template saved as revision ${customization.revision}.`);
		} catch (error) {
			updateStaticTemplateState(templateId, (state) => ({ ...state, isSaving: false }));
			setActionError(error instanceof Error ? error.message : "The template could not be saved.");
		}
	}

	async function restoreStaticTemplateOriginal() {
		if (!selectedStaticTemplateAdapter || !selectedStaticTemplateState) return;
		if (!window.confirm("Restore the bundled original template for this club? Revision history will be retained.")) return;
		const templateId = selectedStaticTemplateAdapter.id;
		try {
			updateStaticTemplateState(templateId, (state) => ({ ...state, isSaving: true }));
			if (selectedStaticTemplateState.revision > 0) {
				await socialGraphicTemplatesApi.reset(templateId, selectedStaticTemplateState.revision);
			}
			updateStaticTemplateState(templateId, (state) => ({
				...state,
				source: selectedStaticTemplateAdapter.defaultSource,
				savedSource: selectedStaticTemplateAdapter.defaultSource,
				definition: selectedStaticTemplateAdapter.defaultDefinition,
				revision: 0,
				isSaving: false,
				codeError: "",
				persistenceError: "",
				history: { past: [], future: [] },
			}));
			setActionError("");
			setActionMessage("The bundled original template is active again.");
		} catch (error) {
			updateStaticTemplateState(templateId, (state) => ({ ...state, isSaving: false }));
			setActionError(error instanceof Error ? error.message : "The original template could not be restored.");
		}
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

	function setLineupOverride(matchId: string, lineup: SocialLineup) {
		setLineupOverrides((current) => ({
			...current,
			[matchId]: lineup,
		}));
	}

	function resetLineupOverride(matchId: string) {
		setLineupOverrides((current) => {
			const next = { ...current };
			delete next[matchId];
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

	const hasRequiredMatch = kind === "blank" || content.fixtures.length > 0;
	const exportDisabled = !selectedTemplate || !hasRequiredMatch || isRendering;
	const editorStateJson = JSON.stringify({
		kind,
		selectedTemplateId: effectiveTemplateId,
		selectedUpcomingIds: effectiveUpcomingIds,
		selectedFixtureId: effectiveFixtureId,
		selectedLineupId: effectiveLineupId,
		selectedResultId: effectiveResultId,
		headline,
		footer,
		clubHandle,
		templateFieldValues,
		homeTeamLogoId,
		awayTeamLogoId,
		featuredImageId,
		sponsorIds,
		fixtureOverrides,
		lineupOverrides,
	});
	const canPublishToMeta = currentUser?.role === "Admin" && (
		currentUser.isPlatformAdmin ||
		currentUser.tenantRole === "OrganizationAdmin" ||
		currentUser.tenantRole === "ClubAdmin"
	);
	const isUpcomingTemplateSelected = effectiveTemplateId === upcomingTemplateId;
	const activeTemplateSource = isUpcomingTemplateSelected
		? upcomingTemplateSource
		: selectedStaticTemplateState?.source ?? "";
	const activeSavedTemplateSource = isUpcomingTemplateSelected
		? savedUpcomingTemplateSource
		: selectedStaticTemplateState?.savedSource ?? "";
	const activeTemplateRevision = isUpcomingTemplateSelected
		? upcomingTemplateRevision
		: selectedStaticTemplateState?.revision ?? 0;
	const activeTemplateCodeError = isUpcomingTemplateSelected
		? templateCodeError
		: selectedStaticTemplateState?.codeError ?? "";
	const activeTemplatePersistenceError = isUpcomingTemplateSelected
		? templatePersistenceError
		: selectedStaticTemplateState?.persistenceError ?? "";
	const isLoadingActiveTemplate = isUpcomingTemplateSelected
		? isLoadingUpcomingTemplate
		: selectedStaticTemplateState?.isLoading ?? false;
	const isSavingActiveTemplate = isUpcomingTemplateSelected
		? isSavingUpcomingTemplate
		: selectedStaticTemplateState?.isSaving ?? false;
	const activeStaticHistory = selectedStaticTemplateState?.history ?? { past: [], future: [] };

	return (
		<div className="space-y-4 lg:space-y-6">
			<header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Social Media Studio</h1>
					<p className="mt-1 text-sm text-slate-600">
						Turn club fixtures and results into ready-to-post artwork.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{canPublishToMeta && <Link to="/social-media/content" className="btn-secondary">Content library</Link>}
					<Link to="/social-media/insights" className="btn-secondary">View Meta insights</Link>
					<span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
						{activeSeason?.name ?? (isLoadingSeasons ? "Loading season…" : "No active season")}
					</span>
				</div>
			</header>

			<div className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm sm:grid-cols-5" role="tablist" aria-label="Graphic type">
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

			<div className={`grid gap-4 ${isTemplateEditorOpen && isEditableTemplate
				? "xl:grid-cols-[minmax(28rem,1fr)_minmax(28rem,1.1fr)]"
				: "xl:grid-cols-[minmax(19rem,0.78fr)_minmax(28rem,1.22fr)]"
			}`}>
				<aside className="surface-card order-2 h-fit p-4 xl:order-1">
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

						{isEditableTemplate && (
							<div className="mt-3 flex flex-wrap items-center gap-2">
								<button
									type="button"
									onClick={() => setIsTemplateEditorOpen((current) => !current)}
									className="btn-secondary px-3 py-2 text-xs"
								>
									{isTemplateEditorOpen ? "Close template code" : "Edit template code"}
								</button>
								{activeTemplateRevision > 0 && (
									<span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
										Club override · Revision {activeTemplateRevision}
									</span>
								)}
								{isUpcomingTemplateSelected && activeTemplateRevision === 0 && activeTemplateSource !== upcomingEditorialDefaultSource && (
									<span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-bold text-sky-800">
										Browser draft ready to migrate
									</span>
								)}
							</div>
						)}
					</section>

					{isEditableTemplate && isTemplateEditorOpen && (
						<section className="mt-5 border-t border-slate-200 pt-5">
							<div className="flex flex-wrap items-start justify-between gap-2">
								<div>
									<h2 className="text-base font-bold text-slate-900">Template code</h2>
									<p className="mt-1 text-xs leading-5 text-slate-600">
										Edit the JSON to change colours, spacing, sizing and positions. Valid changes update the preview automatically.
									</p>
								</div>
								<span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-bold text-sky-800">
									{isLoadingActiveTemplate
										? "Loading club template…"
										: activeTemplateRevision > 0
											? `Club template · Revision ${activeTemplateRevision}`
											: isUpcomingTemplateSelected && activeTemplateSource !== upcomingEditorialDefaultSource
												? "Browser draft"
												: "Bundled original"}
								</span>
							</div>

							<div className="mt-3">
								<Suspense fallback={(
									<div className="grid h-[30rem] place-items-center rounded-xl border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-500">
										Loading code editor…
									</div>
								)}>
									<TemplateCodeEditor
										value={activeTemplateSource}
										onChange={(source) => isUpcomingTemplateSelected
											? handleUpcomingTemplateSourceChange(source)
											: handleStaticTemplateSourceChange(effectiveTemplateId, source)}
									/>
								</Suspense>
							</div>

							{activeTemplateCodeError ? (
								<p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold leading-5 text-rose-700">
									{activeTemplateCodeError} The last valid preview remains active.
								</p>
							) : (
								<p className="mt-2 text-xs font-semibold text-emerald-700">
									Valid template{activeTemplateSource !== activeSavedTemplateSource ? " · Unsaved changes" : " · Saved"}
								</p>
							)}
							{activeTemplatePersistenceError && (
								<p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800">
									{activeTemplatePersistenceError}
								</p>
							)}

							<div className="mt-3 flex flex-wrap gap-2">
								<button
									type="button"
									onClick={() => void (isUpcomingTemplateSelected ? saveUpcomingTemplateDraft() : saveStaticTemplateDraft())}
									disabled={Boolean(activeTemplateCodeError) || Boolean(activeTemplatePersistenceError) || isLoadingActiveTemplate || isSavingActiveTemplate}
									className="btn-primary px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-45"
								>
									{isSavingActiveTemplate ? "Saving…" : "Save club template"}
								</button>
								<button type="button" onClick={isUpcomingTemplateSelected ? formatUpcomingTemplateSource : formatStaticTemplateSource} className="btn-secondary px-3 py-2 text-xs">
									Format JSON
								</button>
								<button
									type="button"
									onClick={() => void (isUpcomingTemplateSelected ? restoreUpcomingTemplateOriginal() : restoreStaticTemplateOriginal())}
									disabled={isLoadingActiveTemplate || isSavingActiveTemplate}
									className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-45"
								>
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
							{kind === "blank" ? (
								<p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
									Start with the branded background, then add only the text and images you need below.
								</p>
							) : kind === "upcomingFixtures" ? (
								<UpcomingFixturePicker
									fixtures={upcomingMatches.map((match) => toSocialFixture(match, teamProfiles, players))}
									selectedIds={effectiveUpcomingIds}
									onToggle={toggleUpcomingMatch}
								/>
							) : (
								<SingleMatchPicker
									label={kind === "fixture" ? "Fixture" : kind === "lineup" ? "Lineup match" : "Result"}
									fixtures={(kind === "result" ? completedMatches : upcomingMatches).map((match) => toSocialFixture(match, teamProfiles, players))}
									selectedId={kind === "fixture" ? effectiveFixtureId : kind === "lineup" ? effectiveLineupId : effectiveResultId}
									onChange={kind === "fixture" ? setSelectedFixtureId : kind === "lineup" ? setSelectedLineupId : setSelectedResultId}
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

							{kind === "lineup" && selectedSingleMatch && selectedLineup && (
								<LineupCopyEditor
									lineup={selectedLineup}
									players={players}
									formations={clubSportDefinition.formations}
									hasOverride={Boolean(lineupOverrides[selectedSingleMatch.id])}
									onChange={(lineup) => setLineupOverride(selectedSingleMatch.id, lineup)}
									onReset={() => resetLineupOverride(selectedSingleMatch.id)}
								/>
							)}

							{kind !== "blank" && (
								<>
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
								</>
							)}

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

								return field.type === "textarea" ? (
									<label key={field.id} className="block text-sm font-semibold text-slate-700">
										{field.label}
										<textarea value={String(effectiveTemplateFields[field.id] ?? "")} onChange={(event) => setTemplateField(field.id, event.target.value)} placeholder={field.placeholder} rows={4} className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm" />
									</label>
								) : (
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
								<AssetPicker label={kind === "blank" || kind === "upcomingFixtures" || kind === "lineup" ? "Club logo" : "Home team logo"} assets={socialGraphicAssetManifest.teamLogos} value={homeTeamLogoId} fallbackIndex={homeTeamLogoFallbackIndex} temporaryAsset={temporaryAssets.homeTeamLogo} onChange={setHomeTeamLogoId} onTemporaryImage={(file) => setTemporaryImage("homeTeamLogo", file, setHomeTeamLogoId)} />
								{kind !== "blank" && kind !== "upcomingFixtures" && kind !== "lineup" && <AssetPicker label="Away team logo" assets={socialGraphicAssetManifest.teamLogos} value={awayTeamLogoId} fallbackIndex={awayTeamLogoFallbackIndex} temporaryAsset={temporaryAssets.awayTeamLogo} onChange={setAwayTeamLogoId} onTemporaryImage={(file) => setTemporaryImage("awayTeamLogo", file, setAwayTeamLogoId)} />}
								{(kind === "blank" || kind === "result") && <AssetPicker label={kind === "blank" ? "Main image" : "Player of the Match image"} assets={socialGraphicAssetManifest.featuredImages} value={featuredImageId} fallbackIndex={0} temporaryAsset={temporaryAssets.featuredImage} onChange={setFeaturedImageId} onTemporaryImage={(file) => setTemporaryImage("featuredImage", file, setFeaturedImageId)} />}
								{showSponsors && [0, 1, 2].map((index) => (
									<AssetPicker key={index} label={`Sponsor ${index + 1}`} emptyLabel="No sponsor" uploadLabel="Replace sponsor image" emptyUploadLabel="Add sponsor image" preferDirectUploadWhenEmpty assets={socialGraphicAssetManifest.sponsors} value={sponsorIds[index] ?? ""} fallbackIndex={index} temporaryAsset={temporaryAssets[`sponsor:${index}`]} onChange={(assetId) => setSponsorId(index, assetId)} onTemporaryImage={(file) => setTemporaryImage(`sponsor:${index}`, file, (assetId) => setSponsorId(index, assetId))} />
								))}
							</div>
						</section>
					)}
				</aside>

				<section className="surface-card order-1 flex flex-col p-4 xl:order-2">
					<div className="order-2 mt-3 flex flex-wrap items-center justify-between gap-3 xl:order-1 xl:mt-0">
						<h2 className="text-base font-bold text-slate-900">Preview</h2>
						<div className="flex flex-wrap items-center justify-end gap-2">
							<span className="text-xs font-semibold text-slate-500">
								{previewDimensions
									? `Template ${previewDimensions.width} × ${previewDimensions.height} · exports ${exportDimensions?.width} × ${exportDimensions?.height}`
									: "Waiting for template"}
							</span>
							{isEditableTemplate && selectedTemplate && (
								<button
									type="button"
									onClick={() => {
										setIsCanvasEditorOpen((current) => !current);
										if (isUpcomingTemplateSelected) {
											setSelectedTemplateElementId((current) => current ?? "headline");
										} else {
											setSelectedStaticTemplateElementId((current) => current ?? "headline");
										}
									}}
									className={isCanvasEditorOpen ? "btn-primary px-3 py-2 text-xs" : "btn-secondary px-3 py-2 text-xs"}
								>
									{isCanvasEditorOpen ? "Finish canvas editing" : "Edit canvas"}
								</button>
							)}
						</div>
					</div>

					{kind === "upcomingFixtures" && isCanvasEditorOpen && (
						<div className="order-3 mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 xl:order-2">
							<div className="flex min-w-0 items-center gap-2">
								{canMoveUpTemplateHierarchy && (
									<button
										type="button"
										onClick={navigateUpTemplateHierarchy}
										className="shrink-0 rounded-lg border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-bold text-sky-900"
									>
										← {activeTemplateElementId === "fixture-list" ? "All elements" : "Up one level"}
									</button>
								)}
								<p className="text-xs font-semibold text-sky-900">
									{activeTemplateElementId?.startsWith("fixture-row:")
										? "Click an outlined child to edit it. Unlock row elements for different text sizing; click empty space to go back."
										: selectedTemplateElement?.drillable
											? "Click an outlined child to drill into it. Drag the selected outline to move it; click empty space to go back."
										: "Select an outlined region, then drag or resize it. Click empty space to clear the selection."}
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

					{!isUpcomingTemplateSelected && isEditableTemplate && isCanvasEditorOpen && (
						<div className="order-3 mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 xl:order-2">
							<p className="text-xs font-semibold text-sky-900">
								Select an outlined region, then drag or resize it. Click empty space to clear the selection.
							</p>
							<div className="flex gap-2">
								<button type="button" onClick={undoStaticVisualTemplateChange} disabled={activeStaticHistory.past.length === 0} className="rounded-lg border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-bold text-sky-900 disabled:opacity-40">
									Undo
								</button>
								<button type="button" onClick={redoStaticVisualTemplateChange} disabled={activeStaticHistory.future.length === 0} className="rounded-lg border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-bold text-sky-900 disabled:opacity-40">
									Redo
								</button>
							</div>
						</div>
					)}

					<div className="order-1 grid min-h-[24rem] place-items-center rounded-2xl border border-slate-200 bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0] p-4 xl:order-3 xl:mt-3">
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
										onSelect={(elementId) => setSelectedTemplateElementId(
											elementId as UpcomingTemplateElementId
										)}
										onNavigateUp={navigateUpTemplateHierarchy}
										onChangeStart={beginVisualTemplateChange}
										onChange={(elementId, bounds) => changeVisualTemplateElement(
											elementId as UpcomingTemplateElementId,
											bounds
										)}
										onChangeEnd={endVisualTemplateChange}
									/>
								)}
								{!isUpcomingTemplateSelected && isEditableTemplate && isCanvasEditorOpen && (
									<TemplateCanvasOverlay
										canvasWidth={previewDimensions.width}
										canvasHeight={previewDimensions.height}
										elements={staticTemplateElements}
										selectedId={selectedStaticTemplateElement?.id ?? null}
										onSelect={setSelectedStaticTemplateElementId}
										onNavigateUp={() => setSelectedStaticTemplateElementId(null)}
										onChangeStart={beginStaticVisualTemplateChange}
										onChange={changeStaticVisualTemplateElement}
										onChangeEnd={endStaticVisualTemplateChange}
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
						<div className="order-4 mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<div>
									<p className="text-sm font-bold text-slate-900">{selectedTemplateElement.label}</p>
									<p className="text-xs text-slate-500">
										Exact canvas measurements in pixels
										{selectedTemplateElement.sharedAcrossRows ? " · Changes apply to every fixture row" : ""}
										{selectedFixtureRowIsUnlocked && !selectedTemplateElement.sharedAcrossRows
											? ` · Changes only apply to fixture row ${(selectedFixtureRowIndex ?? 0) + 1}`
											: ""}
									</p>
									{selectedTemplateElement.wrapsText && (
										<p className="mt-1 text-xs font-semibold text-sky-700">
											Reduce the width to wrap this text onto another line.
										</p>
									)}
								</div>
								<div className="flex flex-wrap gap-2">
									{selectedFixtureRowIndex !== null && (
										<button type="button" onClick={toggleSelectedFixtureRowLock} className="rounded-lg border border-sky-300 bg-white px-2.5 py-1.5 text-xs font-bold text-sky-800 hover:bg-sky-50">
											{selectedFixtureRowIsUnlocked ? "Relink row elements" : "Unlock row elements"}
										</button>
									)}
									<button type="button" onClick={resetSelectedTemplateElement} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100">
										Reset element
									</button>
								</div>
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

					{!isUpcomingTemplateSelected && isEditableTemplate && isCanvasEditorOpen && selectedStaticTemplateElement && (
						<div className="order-4 mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<div>
									<p className="text-sm font-bold text-slate-900">{selectedStaticTemplateElement.label}</p>
									<p className="text-xs text-slate-500">Exact canvas measurements in pixels</p>
								</div>
								<button type="button" onClick={resetSelectedStaticTemplateElement} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100">
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
											value={Math.round(selectedStaticTemplateElement[field] * 10) / 10}
											onFocus={beginStaticVisualTemplateChange}
											onBlur={endStaticVisualTemplateChange}
											onChange={(event) => updateSelectedStaticTemplateElementField(field, Number(event.target.value))}
											className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-semibold normal-case tracking-normal text-slate-900"
										/>
									</label>
								))}
							</div>
						</div>
					)}

					<div className="order-5 mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<button type="button" onClick={handleCopyImage} disabled={exportDisabled} className="btn-secondary disabled:cursor-not-allowed disabled:opacity-45">Copy image</button>
						<button type="button" onClick={handleDownloadImage} disabled={exportDisabled} className="btn-primary disabled:cursor-not-allowed disabled:opacity-45">Download PNG</button>
						{canPublishToMeta && <button type="button" onClick={() => setIsPublishModalOpen(true)} disabled={exportDisabled} className="btn-primary bg-[#0866ff] hover:bg-[#0758d8] disabled:cursor-not-allowed disabled:opacity-45">Save or publish</button>}
					</div>
					{actionMessage && <p className="order-6 mt-2 text-right text-sm font-semibold text-yepset-700">{actionMessage}</p>}
					{actionError && <p className="order-6 mt-2 text-right text-sm font-semibold text-rose-700">{actionError}</p>}
				</section>
			</div>
			{isPublishModalOpen && canvasRef.current && (
				<SocialPublishModal
					canvas={canvasRef.current}
					clubName={clubName}
					suggestedCaption={[content.headline, content.footer].filter(Boolean).join("\n\n")}
					contentTitle={content.headline || `${clubName} social post`}
					graphicKind={kind}
					templateId={effectiveTemplateId}
					editorStateJson={editorStateJson}
					canConfigure={currentUser?.isPlatformAdmin === true || currentUser?.tenantRole === "OrganizationAdmin"}
					onClose={() => setIsPublishModalOpen(false)}
					onPublished={(message) => { setActionError(""); setActionMessage(message); }}
				/>
			)}
		</div>
	);
}

function LineupCopyEditor({
	lineup,
	players,
	formations,
	hasOverride,
	onChange,
	onReset,
}: {
	lineup: SocialLineup;
	players: Player[];
	formations: SportFormation[];
	hasOverride: boolean;
	onChange: (lineup: SocialLineup) => void;
	onReset: () => void;
}) {
	const [isOpen, setIsOpen] = useState(true);
	const [playerToAdd, setPlayerToAdd] = useState("");
	const selectedPlayerIds = new Set(lineup.players.map((player) => player.playerId));
	const availablePlayers = players.filter((player) => !selectedPlayerIds.has(player.id));
	const effectivePlayerToAdd = availablePlayers.some((player) => player.id === playerToAdd)
		? playerToAdd
		: availablePlayers[0]?.id ?? "";
	const selectedFormation = formations.find((formation) => formation.key === lineup.formationKey)
		?? formations[0];
	const starters = lineup.players.filter((player) => player.role === "starter");
	const captainPlayerId = starters.find((player) => player.isCaptain)?.playerId ?? "";
	const inputClassName = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 shadow-sm";

	function updatePlayer(index: number, patch: Partial<SocialLineupPlayer>) {
		onChange({
			...lineup,
			players: lineup.players.map((player, playerIndex) =>
				playerIndex === index ? { ...player, ...patch } : player
			),
		});
	}

	function setCaptain(playerId: string) {
		const playerIndex = lineup.players.findIndex((player) => player.playerId === playerId);
		onChange(withLineupCaptain(lineup, playerIndex, Boolean(playerId)));
	}

	function changePlayerRole(index: number, role: SocialLineupPlayer["role"]) {
		const player = lineup.players[index];
		if (!player || player.role === role) return;
		if (role === "substitute") {
			updatePlayer(index, { role, isCaptain: false, x: undefined, y: undefined });
			return;
		}

		const starterCount = lineup.players.filter((candidate) => candidate.role === "starter").length;
		const slot = selectedFormation?.slots[starterCount];
		updatePlayer(index, {
			role,
			x: slot?.x ?? 50,
			y: slot?.y ?? 50,
			position: player.position || slot?.label || "",
		});
	}

	function changeFormation(formationKey: string) {
		const formation = formations.find((candidate) => candidate.key === formationKey);
		if (!formation) return;
		let starterIndex = 0;
		onChange({
			...lineup,
			formationKey: formation.key,
			formationName: formation.name,
			players: lineup.players.map((player) => {
				if (player.role !== "starter") return player;
				const slot = formation.slots[starterIndex];
				starterIndex += 1;
				return {
					...player,
					x: slot?.x ?? player.x ?? 50,
					y: slot?.y ?? player.y ?? 50,
					position: slot?.label ?? player.position,
				};
			}),
		});
	}

	function addPlayer(role: SocialLineupPlayer["role"]) {
		const player = players.find((candidate) => candidate.id === effectivePlayerToAdd);
		if (!player) return;
		const starterCount = lineup.players.filter((candidate) => candidate.role === "starter").length;
		const slot = role === "starter" ? selectedFormation?.slots[starterCount] : undefined;
		onChange({
			...lineup,
			players: [
				...lineup.players,
				{
					playerId: player.id,
					name: player.name,
					number: player.number,
					position: slot?.label ?? player.positions[0] ?? "",
					role,
					x: slot?.x,
					y: slot?.y,
				},
			],
		});
		setPlayerToAdd("");
	}

	return (
		<details
			open={isOpen}
			onToggle={(event) => setIsOpen(event.currentTarget.open)}
			className="rounded-xl border border-slate-200 bg-slate-50"
		>
			<summary className="cursor-pointer px-3 py-2.5 text-sm font-bold text-slate-800">
				Graphic lineup · {lineup.players.filter((player) => player.role === "starter").length} starters
			</summary>
			<div className="space-y-3 border-t border-slate-200 p-3">
				<p className="text-xs leading-5 text-slate-500">
					Seeded from the selected match. These changes only affect this image.
				</p>
				<div className="grid gap-3 sm:grid-cols-2">
					<label className="block text-sm font-semibold text-slate-700">
						Formation
						<select value={lineup.formationKey} onChange={(event) => changeFormation(event.target.value)} className={inputClassName}>
							{formations.map((formation) => (
								<option key={formation.key} value={formation.key}>{formation.name}</option>
							))}
						</select>
					</label>
					<label className="block text-sm font-semibold text-slate-700">
						Captain
						<select value={captainPlayerId} onChange={(event) => setCaptain(event.target.value)} className={inputClassName}>
							<option value="">No captain</option>
							{starters.map((player) => (
								<option key={player.playerId} value={player.playerId}>{player.name}</option>
							))}
						</select>
					</label>
				</div>

				<div className="space-y-2">
					{lineup.players.map((player, index) => (
						<div key={`${player.playerId}:${index}`} className="rounded-xl border border-slate-200 bg-white p-2.5">
							<div className="grid gap-2 sm:grid-cols-[5rem_minmax(0,1fr)_7rem]">
								<label className="text-xs font-bold text-slate-600">
									Number
									<input type="number" min="0" value={player.number ?? ""} onChange={(event) => updatePlayer(index, { number: parseOptionalNumber(event.target.value) })} className={inputClassName} />
								</label>
								<label className="text-xs font-bold text-slate-600">
									Player name
									<input value={player.name} onChange={(event) => updatePlayer(index, { name: event.target.value })} className={inputClassName} />
								</label>
								<label className="text-xs font-bold text-slate-600">
									Role
									<select value={player.role} onChange={(event) => changePlayerRole(index, event.target.value as SocialLineupPlayer["role"])} className={inputClassName}>
										<option value="starter">Starter</option>
										<option value="substitute">Substitute</option>
									</select>
								</label>
							</div>
							<div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_5rem_5rem_auto] sm:items-end">
								<label className="text-xs font-bold text-slate-600">
									Position label
									<input value={player.position} onChange={(event) => updatePlayer(index, { position: event.target.value })} className={inputClassName} />
								</label>
								<label className="text-xs font-bold text-slate-600">
									Pitch X %
									<input type="number" min="0" max="100" disabled={player.role === "substitute"} value={player.x ?? ""} onChange={(event) => updatePlayer(index, { x: parseOptionalPercentage(event.target.value) })} className={`${inputClassName} disabled:bg-slate-100`} />
								</label>
								<label className="text-xs font-bold text-slate-600">
									Pitch Y %
									<input type="number" min="0" max="100" disabled={player.role === "substitute"} value={player.y ?? ""} onChange={(event) => updatePlayer(index, { y: parseOptionalPercentage(event.target.value) })} className={`${inputClassName} disabled:bg-slate-100`} />
								</label>
								<button type="button" onClick={() => onChange({ ...lineup, players: lineup.players.filter((_candidate, playerIndex) => playerIndex !== index) })} className="rounded-lg border border-rose-200 px-2.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50">
									Remove
								</button>
							</div>
						</div>
					))}
				</div>

				{availablePlayers.length > 0 && (
					<div className="flex flex-col gap-2 rounded-xl border border-dashed border-slate-300 bg-white p-2.5 sm:flex-row sm:items-end">
						<label className="min-w-0 flex-1 text-xs font-bold text-slate-600">
							Add a club player
							<select value={effectivePlayerToAdd} onChange={(event) => setPlayerToAdd(event.target.value)} className={inputClassName}>
								{availablePlayers.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
							</select>
						</label>
						<button type="button" onClick={() => addPlayer("starter")} className="btn-secondary px-3 py-2 text-xs">Add starter</button>
						<button type="button" onClick={() => addPlayer("substitute")} className="btn-secondary px-3 py-2 text-xs">Add substitute</button>
					</div>
				)}

				{hasOverride && (
					<button type="button" onClick={onReset} className="text-xs font-bold text-yepset-800 hover:text-yepset-950">
						Reset to match lineup
					</button>
				)}
			</div>
		</details>
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
	const [oppositionScorersDraft, setOppositionScorersDraft] = useState(
		formatScorersForInput(fixture.oppositionScorers)
	);
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
						Player of the Match names
						<textarea rows={2} value={fixture.playerOfTheMatch} onChange={(event) => onChange("playerOfTheMatch", event.target.value)} placeholder="One award winner per line" className={`${inputClassName} resize-y`} />
						<span className="mt-1 block text-xs font-medium text-slate-500">Add up to two players, one per line.</span>
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
						<label className="block text-sm font-semibold text-slate-700 sm:col-span-2 xl:col-span-1 2xl:col-span-2">
							Opposition scorers
							<textarea
								rows={2}
								value={oppositionScorersDraft}
								onChange={(event) => setOppositionScorersDraft(event.target.value)}
								onBlur={() => onChange("oppositionScorers", parseScorersInput(oppositionScorersDraft))}
								placeholder="One per line, for example: Alex Smith x2"
								className={`${inputClassName} resize-y`}
							/>
							<span className="mt-1 block text-xs font-medium text-slate-500">Add one scorer per line. Use “x2” for multiple goals.</span>
						</label>
					</>
				)}
				{hasOverride && (
					<div className="sm:col-span-2 xl:col-span-1 2xl:col-span-2">
						<button type="button" onClick={() => {
							setOppositionScorersDraft("");
							onReset();
						}} className="text-xs font-bold text-yepset-800 hover:text-yepset-950">
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

function parseOptionalNumber(value: string) {
	if (!value.trim()) return undefined;
	const parsed = Number.parseInt(value, 10);
	return Number.isNaN(parsed) ? undefined : Math.max(0, parsed);
}

function parseOptionalPercentage(value: string) {
	if (!value.trim()) return undefined;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : undefined;
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
			<legend className="text-sm font-semibold text-slate-700">Fixtures (up to {UPCOMING_FIXTURE_LIMIT})</legend>
			<div className="mt-1.5 max-h-48 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
				{fixtures.map((fixture) => {
					const checked = selectedIds.includes(fixture.id);
					return (
						<label key={fixture.id} className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-sm hover:bg-white">
							<input type="checkbox" checked={checked} disabled={!checked && selectedIds.length >= UPCOMING_FIXTURE_LIMIT} onChange={() => onToggle(fixture.id)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-yepset-700" />
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
	emptyLabel = "Use placeholder",
	uploadLabel = "Upload for this graphic only",
	emptyUploadLabel = uploadLabel,
	preferDirectUploadWhenEmpty = false,
	onChange,
	onTemporaryImage,
}: {
	label: string;
	assets: SocialGraphicAsset[];
	value: string;
	fallbackIndex: number;
	temporaryAsset?: SocialGraphicAsset;
	emptyLabel?: string;
	uploadLabel?: string;
	emptyUploadLabel?: string;
	preferDirectUploadWhenEmpty?: boolean;
	onChange: (assetId: string) => void;
	onTemporaryImage: (file: File) => void;
}) {
	const effectiveAsset = findSelectedAsset(assets, value, fallbackIndex, temporaryAsset);
	const uploadInput = (label: string, className: string) => (
		<label className={className}>
			{label}
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
	);

	if (preferDirectUploadWhenEmpty && assets.length === 0 && !temporaryAsset) {
		return (
			<div>
				<p className="block text-sm font-semibold text-slate-700">{label}</p>
				{uploadInput(
					emptyUploadLabel,
					"mt-1.5 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-yepset-400 bg-yepset-50 px-3 py-3 text-sm font-bold text-yepset-900 hover:bg-yepset-100"
				)}
			</div>
		);
	}

	return (
		<div>
			<label className="block text-sm font-semibold text-slate-700">
				{label}
				<select
					value={effectiveAsset?.id ?? placeholderAssetId}
					onChange={(event) => onChange(event.target.value)}
					className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm"
				>
					<option value={placeholderAssetId}>{emptyLabel}</option>
					{temporaryAsset && (
						<option value={temporaryAsset.id}>{temporaryAsset.name}</option>
					)}
					{assets.map((asset) => (
						<option key={asset.id} value={asset.id}>{asset.name}</option>
					))}
				</select>
			</label>
			{uploadInput(
				uploadLabel,
				"mt-1.5 inline-flex cursor-pointer items-center text-xs font-bold text-yepset-800 hover:text-yepset-950"
			)}
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

function isGraphicKind(value: unknown): value is SocialGraphicKind {
	return typeof value === "string" && graphicKinds.includes(value as SocialGraphicKind);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
