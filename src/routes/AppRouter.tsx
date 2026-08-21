import { Suspense, useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import Header from "../components/layout/Header";
import MobileBottomNavigation from "../components/layout/MobileBottomNavigation";
import Sidebar from "../components/layout/Sidebar";
import ProtectedRoute from "../components/routing/ProtectedRoute";
import ColdStartSplash from "../components/startup/ColdStartSplash";
import { ClubSetupReminder } from "../pages/ClubSetup/ClubSetupReminder";
import { useClubTeamStore } from "../stores/clubTeams";
import { lazyWithRetry } from "../utils/lazyWithRetry";

const AccessDenied = lazyWithRetry(() => import("../pages/AccessDenied/AccessDenied"));
const Billing = lazyWithRetry(() => import("../pages/Billing/Billing"));
const ClubSetup = lazyWithRetry(() => import("../pages/ClubSetup/ClubSetup"));
const ClubTeams = lazyWithRetry(() => import("../pages/ClubTeams/ClubTeams"));
const Dashboard = lazyWithRetry(() => import("../pages/Dashboard/Dashboard"));
const EventDetail = lazyWithRetry(() => import("../pages/Events/EventDetail"));
const Finance = lazyWithRetry(() => import("../pages/Finance/Finance"));
const Forms = lazyWithRetry(() => import("../pages/Forms/Forms"));
const HistoricalStats = lazyWithRetry(() => import("../pages/HistoricalStats/HistoricalStats"));
const HandoverOverview = lazyWithRetry(() => import("../pages/Handover/HandoverOverview"));
const HandoverRoles = lazyWithRetry(() => import("../pages/Handover/HandoverRoles"));
const HandoverRoleDetail = lazyWithRetry(() => import("../pages/Handover/HandoverRoleDetail"));
const HandoverTasks = lazyWithRetry(() => import("../pages/Handover/HandoverTasks"));
const HandoverRecords = lazyWithRetry(() => import("../pages/Handover/HandoverRecords"));
const HandoverRecordDetail = lazyWithRetry(() => import("../pages/Handover/HandoverRecordDetail"));
const OrganizationDocuments = lazyWithRetry(() => import("../pages/Handover/OrganizationDocuments"));
const Login = lazyWithRetry(() => import("../pages/Login/Login"));
const MatchDetail = lazyWithRetry(() => import("../pages/Matches/MatchDetails"));
const Matches = lazyWithRetry(() => import("../pages/Matches/Matches"));
const Notifications = lazyWithRetry(() => import("../pages/Notifications/Notifications"));
const Organization = lazyWithRetry(() => import("../pages/Organization/Organization"));
const OrganizationIntegrations = lazyWithRetry(() => import("../pages/Integrations/OrganizationIntegrations"));
const MetaOAuthCallback = lazyWithRetry(() => import("../pages/Integrations/MetaOAuthCallback"));
const PlatformOrganizations = lazyWithRetry(() => import("../pages/PlatformOrganizations/PlatformOrganizations"));
const Player = lazyWithRetry(() => import("../pages/Players/Player"));
const Players = lazyWithRetry(() => import("../pages/Players/Players"));
const PostDetail = lazyWithRetry(() => import("../pages/Posts/PostDetail"));
const ReportsPage = lazyWithRetry(() => import("../pages/Reports/ReportsPage"));
const Seasons = lazyWithRetry(() => import("../pages/Seasons/Seasons"));
const Settings = lazyWithRetry(() => import("../pages/Settings/Settings"));
const SocialMediaStudio = lazyWithRetry(() => import("../pages/SocialMediaStudio/SocialMediaStudio"));
const SocialInsights = lazyWithRetry(() => import("../pages/SocialMediaStudio/SocialInsights"));
const Stats = lazyWithRetry(() => import("../pages/Stats/Stats"));
const Training = lazyWithRetry(() => import("../pages/Training/Training"));
const Users = lazyWithRetry(() => import("../pages/Users/Users"));

const managementRoles = ["Admin", "Coach"] as const;
const adminRoles = ["Admin"] as const;
const allRoles = ["Admin", "Coach", "Player"] as const;

export default function AppRouter() {
	return (
		<Suspense fallback={<PageLoadingFallback />}>
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route path="/go/:goCode" element={<Forms />} />

				<Route element={<ProtectedRoute allowedRoles={[...allRoles]} />}>
					<Route element={<AppShell />}>
						<Route index element={<Dashboard />} />
						<Route path="/events/:id" element={<EventDetail />} />
						<Route path="/forms" element={<Forms />} />
						<Route path="/forms/:formId/edit" element={<Forms />} />
						<Route path="/forms/:formId/report" element={<Forms />} />
						<Route path="/forms/insights" element={<Forms />} />
						<Route path="/forms/:formId/insights" element={<Forms />} />
						<Route path="/posts/:id" element={<PostDetail />} />
						<Route path="/notifications" element={<Notifications />} />
						<Route path="/settings" element={<Settings />} />
						<Route path="/access-denied" element={<AccessDenied />} />


						<Route element={<ProtectedRoute allowedRoles={[...managementRoles]} />}>
							<Route path="/matches" element={<Matches />} />
							<Route path="/matches/:id" element={<MatchDetail />} />
							<Route path="/players" element={<Players />} />
							<Route path="/players/:id" element={<Player />} />
							<Route path="/reports/*" element={<ReportsPage />} />
							<Route path="/social-media" element={<SocialMediaStudio />} />
							<Route path="/social-media/insights" element={<SocialInsights />} />
							<Route path="/social-media/insights/:platform/:postId" element={<SocialInsights />} />
							<Route path="/stats" element={<Stats />} />
							<Route path="/training" element={<Training />} />
							<Route path="/historical-stats" element={<HistoricalStats />} />
							<Route path="/handover" element={<HandoverOverview />} />
							<Route path="/handover/roles" element={<HandoverRoles />} />
							<Route path="/handover/roles/:roleId" element={<HandoverRoleDetail />} />
							<Route path="/handover/tasks" element={<HandoverTasks />} />
							<Route path="/handover/records" element={<HandoverRecords />} />
							<Route path="/handover/records/:handoverId" element={<HandoverRecordDetail />} />
							<Route path="/handover/documents" element={<OrganizationDocuments />} />
							<Route path="/handover/documents/:documentId" element={<OrganizationDocuments />} />
						</Route>

						<Route element={<ProtectedRoute allowedRoles={[...adminRoles]} />}>
							<Route path="/finance" element={<Finance />} />
							<Route path="/seasons" element={<Seasons />} />
							<Route path="/club-teams" element={<ClubTeams />} />
						</Route>
						<Route element={<ProtectedRoute allowedRoles={[...adminRoles]} allowedTenantRoles={["OrganizationAdmin"]} />}>
							<Route path="/users" element={<Users />} />
							<Route path="/billing" element={<Billing />} />
							<Route path="/organization/integrations" element={<OrganizationIntegrations />} />
							<Route path="/organization/integrations/meta/callback" element={<MetaOAuthCallback />} />
						</Route>
						<Route element={<ProtectedRoute allowedRoles={[...adminRoles]} allowedTenantRoles={["OrganizationAdmin", "ClubAdmin"]} />}>
							<Route path="/organization" element={<Organization />} />
							<Route path="/club-setup" element={<ClubSetup />} />
						</Route>
						<Route element={<ProtectedRoute allowedRoles={[...adminRoles]} requirePlatformAdmin />}>
							<Route path="/platform/organizations" element={<PlatformOrganizations />} />
						</Route>
					</Route>
				</Route>

				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</Suspense>
	);
}

function PageLoadingFallback() {
	return (
		<ColdStartSplash title="Loading Yepset" message="Pulling the app into place before we open your club workspace." />
	);
}

function AppShell() {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const loadClubTeams = useClubTeamStore((state) => state.loadProfiles);

	useEffect(() => { void loadClubTeams(); }, [loadClubTeams]);

	return (
		<div className="min-h-screen overflow-x-hidden text-slate-900">
			<Sidebar
				isMobileMenuOpen={isMobileMenuOpen}
				onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
			/>

			<div className="lg:pl-64">
				<Header />

				<main className="mx-auto w-full min-w-0 max-w-[1600px] px-3 py-3 pb-24 sm:px-6 sm:py-6 sm:pb-24 lg:px-8 lg:pb-6">
					<ClubSetupReminder />
					<Outlet />
				</main>
			</div>

			<MobileBottomNavigation
				isMoreOpen={isMobileMenuOpen}
				onOpenMore={() => setIsMobileMenuOpen(true)}
			/>
		</div>
	);
}
