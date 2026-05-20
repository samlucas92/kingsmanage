import { useMemo, useState } from "react";
import { usePlayerStore } from "../../stores/players";
import LinkButton from "../../components/compositions/LinkButton";

export default function Players() {
  const players = usePlayerStore((s) => s.players);
  const togglePlayerActive = usePlayerStore((s) => s.togglePlayerActive);

  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [includeInactive, setIncludeInactive] = useState(false);

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const matchesSearch = player.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesPosition =
        positionFilter === "all" ||
        player.positions.includes(positionFilter);

      const matchesActive = includeInactive || player.isActive;

      return matchesSearch && matchesPosition && matchesActive;
    });
  }, [players, searchTerm, positionFilter, includeInactive]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Players</h1>
          <p className="text-gray-600">Manage squad members and active status.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-4 items-center">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search players..."
          className="border rounded-lg px-3 py-2 min-w-64"
        />

        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="all">All positions</option>
          <option value="GK">GK</option>
          <option value="CB">CB</option>
          <option value="CM">CM</option>
          <option value="ST">ST</option>
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
          />
          Include inactive players
        </label>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left">
              <th className="p-3">No.</th>
              <th className="p-3">Name</th>
              <th className="p-3">Position</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredPlayers.map((player) => (
              <tr key={player.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{player.number}</td>
                <td className="p-3 font-medium text-blue-900">
                  <LinkButton to={`/players/${player.id}`} variant="plain">
                    {player.name}
                  </LinkButton>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {player.positions.map((position) => (
                      <span
                        key={position}
                        className="rounded-full bg-blue-100 text-blue-800 px-2 py-1 text-xs font-medium"
                      >
                        {position}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      player.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {player.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => togglePlayerActive(player.id)}
                    className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-100"
                  >
                    {player.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPlayers.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No players found.
          </div>
        )}
      </div>
    </div>
  );
}