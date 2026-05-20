import { useParams } from "react-router-dom";
import LinkButton from "../../components/compositions/LinkButton";

const dummyPlayers = [
  {
    id: "1",
    name: "Sam Lucas",
    number: 8,
    position: "CM",
    firstApps: 12,
    firstGoals: 3,
    secondApps: 4,
    secondGoals: 1,
  },
];

export default function PlayerProfile() {
  const { id } = useParams();

  const player = dummyPlayers.find((p) => p.id === id);

  if (!player) {
    return (
      <div className="space-y-6">
        <LinkButton to="/players" className="mb-4 inline-flex">
            ← Back to players
        </LinkButton>
        <p>Player not found.</p>
      </div>
    );
  }

  const totalApps = player.firstApps + player.secondApps;
  const totalGoals = player.firstGoals + player.secondGoals;

  return (
    <div className="space-y-6">
        <LinkButton to="/players" className="mb-4 inline-flex">
            ← Back to players
        </LinkButton>

      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-sm text-gray-500">Player Profile</p>
        <h1 className="text-3xl font-bold text-blue-900">{player.name}</h1>
        <p className="text-gray-600">
          #{player.number} · {player.position}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="First Apps" value={player.firstApps} />
        <Stat label="First Goals" value={player.firstGoals} />
        <Stat label="Second Apps" value={player.secondApps} />
        <Stat label="Second Goals" value={player.secondGoals} />
        <Stat label="Total Apps" value={totalApps} />
        <Stat label="Total Goals" value={totalGoals} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-blue-900">{value}</p>
    </div>
  );
}