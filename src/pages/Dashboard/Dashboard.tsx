import StatCard from "../../components/compositions/StatCard";

import UpcomingEvent from "./components/UpcomingEvent";
import PlayerStatusList from "./components/PlayerStatusList";
import { usePlayerStore } from "../../stores/players";
import { useFinanceStore } from "../../stores/finance";
import CardDetailed from "../../components/compositions/CardDetailed";

export default function Dashboard() {
const players = usePlayerStore();
const payments = useFinanceStore();

const playerList = players.players;

const debtSummary = playerList.reduce(
  (acc, p) => {
    const balance = payments.getPlayerBalance(p.id);

    if (balance > 0) {
      acc.totalOwed += balance;
      acc.playersOwing += 1;
    }

    return acc;
  },
  { totalOwed: 0, playersOwing: 0 }
);

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Players" value={playerList.length} />
        <CardDetailed 
          title="Outstanding Payments"
          main={`£${debtSummary.totalOwed}`}
          detail={`${debtSummary.playersOwing} players owe money`}
        />
        <StatCard label="Matches Played" value={12} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <UpcomingEvent />
        <PlayerStatusList />
      </div>
      </>
  );
}