import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard/Dashboard";
import Players from "../pages/Players/Players";
import Player from "../pages/Players/Player"
import Finance from "../pages/Finance/Finance";
import Matches from "../pages/Matches/Matches";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Stats from "../pages/Stats/Stats";
import MatchDetail from "../pages/Matches/MatchDetails";

export default function AppRouter() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

        <div className="flex flex-col flex-1">
          {/* Header */}
          <Header />

          {/* Page content */}
          <main className="flex-1 p-6 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/players/:id" element={<Player />} />
            <Route path="/players" element={<Players />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/matches/:id" element={<MatchDetail />} />
            <Route path="/stats" element={<Stats/>}/>
          </Routes>
        </main>
      </div>
    </div>

  );
}