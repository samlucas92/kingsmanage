import Card from "../../../components/compositions/Card";

const players = [
  { name: "Chris Ramsell", status: "Available" },
  { name: "Adam Tucker", status: "Unavailable" },
  { name: "Nick Hopkins", status: "Pending" },
];

export default function PlayerStatusList() {
  return (
    <Card title="Availability">
      <div className="space-y-2">
        {players.map((p) => (
          <div
            key={p.name}
            className="flex justify-between items-center p-2 rounded-lg bg-gray-50"
          >
            <span>{p.name}</span>
            <StatusBadge status={p.status} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Available: "bg-green-200 text-green-800",
    Unavailable: "bg-red-200 text-red-800",
    Pending: "bg-yellow-200 text-yellow-800",
  };

  return (
    <span className={`px-2 py-1 rounded text-xs ${colors[status]}`}>
      {status}
    </span>
  );
}