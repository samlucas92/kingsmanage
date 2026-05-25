import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard/Dashboard";
import Players from "../pages/Players/Players";
import Player from "../pages/Players/Player";
import Finance from "../pages/Finance/Finance";
import Matches from "../pages/Matches/Matches";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Stats from "../pages/Stats/Stats";
import MatchDetail from "../pages/Matches/MatchDetails";
import Seasons from "../pages/Seasons/Seasons";
import HistoricalStats from "../pages/HistoricalStats/HistoricalStats";

export default function AppRouter() {
	return (
		<div className="flex h-screen w-screen overflow-hidden bg-gray-100">
			<Sidebar />

			<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
				<div className="md:hidden h-16 shrink-0" />

				<Header />

				<main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
					<Routes>
						<Route path="/" element={<Dashboard />} />
						<Route path="/dashboard" element={<Dashboard />} />

						<Route path="/players/:id" element={<Player />} />
						<Route path="/players" element={<Players />} />

						<Route path="/matches" element={<Matches />} />
						<Route path="/matches/:id" element={<MatchDetail />} />

						<Route path="/finance" element={<Finance />} />
						<Route path="/stats" element={<Stats />} />
						<Route path="/historical-stats" element={<HistoricalStats />} />
						<Route path="/seasons" element={<Seasons />} />
					</Routes>
				</main>
			</div>
		</div>
	);
}