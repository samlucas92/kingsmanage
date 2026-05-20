import { Link } from "react-router-dom";
import { useMatchStore } from "../../stores/match";

export default function Matches() {
  const matches = useMatchStore((s) => s.matches);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-blue-900">Matches</h1>

      <div className="rounded-xl bg-white shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left">
              <th className="p-3">Date</th>
              <th className="p-3">Opponent</th>
              <th className="p-3">Venue</th>
              <th className="p-3">Result</th>
              <th className="p-3">State</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {matches.map((match) => (
              <tr key={match.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  {new Date(match.date).toLocaleDateString()}
                </td>
                <td className="p-3 font-medium">{match.opponent}</td>
                <td className="p-3 capitalize">{match.venue}</td>
                <td className="p-3">
                  {match.result
                    ? `${match.result.homeGoals} - ${match.result.awayGoals}`
                    : "-"}
                </td>
                <td className="p-3 capitalize">{match.state}</td>
                <td className="p-3 text-right">
                  <Link
                    to={`/matches/${match.id}`}
                    className="font-medium text-blue-900 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}