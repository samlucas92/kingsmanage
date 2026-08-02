import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import Header from "../components/layout/Header";
import MobileBottomNavigation from "../components/layout/MobileBottomNavigation";
import Sidebar from "../components/layout/Sidebar";
import ProtectedRoute from "../components/routing/ProtectedRoute";
import ColdStartSplash from "../components/startup/ColdStartSplash";
import { ClubSetupReminder } from "../pages/ClubSetup/ClubSetupReminder";
import { useClubTeamStore } from "../stores/clubTeams";

const AccessDenied = lazy(() => import("../pages/AccessDenied/AccessDenied"));
const Billing = lazy(() => import("../pages/Billing/Billing"));
const ClubSetup = lazy(() => import("../pages/ClubSetup/ClubSetup"));
const ClubTeams = lazy(() => import("../pages/ClubTeams/ClubTeams"));
const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard"));
const EventDetail = lazy(() => import("../pages/Events/EventDetail"));
const Finance = lazy(() => import("../pages/Finance/Finance"));
const Forms = lazy(() => import("../pages/Forms/Forms"));
const HistoricalStats = lazy(() => import("../pages/HistoricalStats/HistoricalStats"));
const Login = lazy(() => import("../pages/Login/Login"));
const MatchDetail = lazy(() => import("../pages/Matches/MatchDetails"));
const Matches = lazy(() => import("../pages/Matches/Matches"));
const Notifications = lazy(() => import("../pages/Notifications/Notifications"));
const Organization = lazy(() => import("../pages/Organization/Organization"));
const PlatformOrganizations = lazy(() => import("../pages/PlatformOrganizations/PlatformOrganizations"));
const Player = lazy(() => import("../pages/Players/Player"));
const Players = lazy(() => import("../pages/Players/Players"));
const PostDetail = lazy(() => import("../pages/Posts/PostDetail"));
const ReportsPage = lazy(() => import("../pages/Reports/ReportsPage"));
const Seasons = lazy(() => import("../pages/Seasons/Seasons"));
const Settings = lazy(() => import("../pages/Settings/Settings"));
const Stats = lazy(() => import("../pages/Stats/Stats"));
const Training = lazy(() => import("../pages/Training/Training"));
const Users = lazy(() => import("../pages/Users/Users"));

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
							<Route path="/stats" element={<Stats />} />
							<Route path="/training" element={<Training />} />
							<Route path="/historical-stats" element={<HistoricalStats />} />
						</Route>

						<Route element={<ProtectedRoute allowedRoles={[...adminRoles]} />}>
							<Route path="/finance" element={<Finance />} />
							<Route path="/seasons" element={<Seasons />} />
							<Route path="/club-teams" element={<ClubTeams />} />
						</Route>
						<Route element={<ProtectedRoute allowedRoles={[...adminRoles]} allowedTenantRoles={["OrganizationAdmin"]} />}>
							<Route path="/users" element={<Users />} />
							<Route path="/billing" element={<Billing />} />
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
