import { useState } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import ProtectedRoute from "../components/routing/ProtectedRoute";
import AccessDenied from "../pages/AccessDenied/AccessDenied";
import Dashboard from "../pages/Dashboard/Dashboard";
import EventDetail from "../pages/Events/EventDetail";
import Finance from "../pages/Finance/Finance";
import HistoricalStats from "../pages/HistoricalStats/HistoricalStats";
import Login from "../pages/Login/Login";
import MatchDetail from "../pages/Matches/MatchDetails";
import Matches from "../pages/Matches/Matches";
import Player from "../pages/Players/Player";
import Players from "../pages/Players/Players";
import Seasons from "../pages/Seasons/Seasons";
import Stats from "../pages/Stats/Stats";
import Users from "../pages/Users/Users";

const managementRoles = ["Admin", "Coach"] as const;
const adminRoles = ["Admin"] as const;
const allRoles = ["Admin", "Coach", "Player"] as const;

export default function AppRouter() {
	return (
		<Routes>
			<Route path="/login" element={<Login />} />

			<Route element={<ProtectedRoute allowedRoles={[...allRoles]} />}>
				<Route element={<AppShell />}>
					<Route index element={<Dashboard />} />
					<Route path="/events/:id" element={<EventDetail />} />
					<Route path="/access-denied" element={<AccessDenied />} />

					<Route element={<ProtectedRoute allowedRoles={[...managementRoles]} />}>
						<Route path="/matches" element={<Matches />} />
						<Route path="/matches/:id" element={<MatchDetail />} />
						<Route path="/players" element={<Players />} />
						<Route path="/players/:id" element={<Player />} />
						<Route path="/stats" element={<Stats />} />
						<Route path="/historical-stats" element={<HistoricalStats />} />
					</Route>

					<Route element={<ProtectedRoute allowedRoles={[...adminRoles]} />}>
						<Route path="/finance" element={<Finance />} />
						<Route path="/seasons" element={<Seasons />} />
						<Route path="/users" element={<Users />} />
					</Route>
				</Route>
			</Route>

			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}

function AppShell() {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	return (
		<div className="min-h-screen bg-slate-100 text-slate-900">
			<Sidebar
				isMobileMenuOpen={isMobileMenuOpen}
				onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
			/>

			<div className="lg:pl-64">
				<Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

				<main className="px-4 py-4 sm:px-6 lg:px-8">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
