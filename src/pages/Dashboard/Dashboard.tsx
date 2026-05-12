import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/compositions/StatCard";

import UpcomingEvent from "./components/UpcomingEvent";
import PlayerStatusList from "./components/PlayerStatusList";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Players" value={51} />
        <StatCard label="Matches Played" value={12} />
        <StatCard label="Outstanding Fees" value="£320" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <UpcomingEvent />
        <PlayerStatusList />
      </div>
    </DashboardLayout>
  );
}