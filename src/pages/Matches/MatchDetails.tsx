import { useParams } from "react-router-dom";
import { useState } from "react";
import { useMatchStore } from "../../stores/match";
import Modal from "../../components/compositions/Modal";
import LinkButton from "../../components/compositions/LinkButton";
import TeamPicker from "./components/TeamPicker";

export default function MatchDetail() {
  const { id } = useParams();

  const match = useMatchStore((s) => s.matches.find((m) => m.id === id));
  const setResult = useMatchStore((s) => s.setResult);
  const postponeMatch = useMatchStore((s) => s.postponeMatch);

  const [showResultModal, setShowResultModal] = useState(false);
  const [homeGoals, setHomeGoals] = useState(0);
  const [awayGoals, setAwayGoals] = useState(0);

  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [newDate, setNewDate] = useState("");
	const toggleLineupLocked = useMatchStore(
	(state) => state.toggleLineupLocked
	);

  if (!match) return <p>Match not found.</p>;

  return (
      <div className="space-y-6">
    <LinkButton to="/matches" variant="back" className="mb-4 inline-flex">
      ← Back to matches
    </LinkButton>

    <div className="rounded-xl bg-white p-6 shadow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">
            vs {match.opponent}
          </h1>
          <p className="text-gray-600">
            {new Date(match.date).toLocaleString()} · {match.venue}
          </p>
          <p className="mt-2 capitalize text-sm text-gray-500">
            Status: {match.state}
          </p>
        </div>

        {!match.isCompleted && (
          <button
            onClick={() => setShowPostponeModal(true)}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Postpone
          </button>
        )}
      </div>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <section className="xl:col-span-2 rounded-xl bg-white p-6 shadow min-h-[520px]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-blue-900">Team Selection</h2>

			<button
				type="button"
				onClick={() => toggleLineupLocked(match.id)}
				disabled={match.selectedPlayers.length === 0}
				className={`rounded-xl px-5 py-3 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${
					match.isLineupLocked
					? "bg-slate-900 text-white hover:bg-slate-800"
					: "bg-blue-700 text-white hover:bg-blue-800"
				}`}
				>
				{match.isLineupLocked ? "Edit Team" : "Save Team"}
			</button>
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-green-50 min-h-[420px] flex items-center justify-center text-gray-500">
			<TeamPicker matchId={match.id} />
        </div>
      </section>

      <div className="space-y-6">
        <section className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-lg font-bold text-blue-900">Result</h2>

          {match.result ? (
            <p className="mt-3 text-2xl font-bold">
              {match.result.homeGoals} - {match.result.awayGoals}
            </p>
          ) : (
            <button
              onClick={() => setShowResultModal(true)}
              className="mt-4 rounded-lg bg-blue-900 px-4 py-2 text-white"
            >
              Set Result
            </button>
          )}
        </section>

        <section className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-lg font-bold text-blue-900">Postponement Audit</h2>

          {match.postponements.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">
              No postponements recorded.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {match.postponements.map((audit) => (
                <div key={audit.id} className="rounded-lg bg-gray-50 p-3 text-sm">
                  <p>
                    {new Date(audit.oldDate).toLocaleString()} →{" "}
                    {new Date(audit.newDate).toLocaleString()}
                  </p>
                  {audit.reason && (
                    <p className="mt-1 text-gray-600">{audit.reason}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>

      <Modal
        isOpen={showResultModal}
        title="Set match as completed?"
        message="Are you sure you want to set this game as completed? You will not be able to update it after that."
        confirmText="Set Completed"
        onClose={() => setShowResultModal(false)}
        onConfirm={() => {
          setResult(match.id, { homeGoals, awayGoals });
          setShowResultModal(false);
        }}
      >
        <div className="flex gap-3">
          <input
            type="number"
            value={homeGoals}
            onChange={(e) => setHomeGoals(Number(e.target.value))}
            className="w-full rounded-lg border px-3 py-2"
          />
          <input
            type="number"
            value={awayGoals}
            onChange={(e) => setAwayGoals(Number(e.target.value))}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
      </Modal>

      <Modal
        isOpen={showPostponeModal}
        title="Postpone match"
        confirmText="Postpone"
        onClose={() => setShowPostponeModal(false)}
        onConfirm={() => {
          postponeMatch(match.id, newDate);
          setShowPostponeModal(false);
        }}
      >
        <input
          type="datetime-local"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
        />
      </Modal>
    </div>
  );
}