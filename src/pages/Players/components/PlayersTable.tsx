import { Link } from "react-router-dom";

import type { Player } from "../../../stores/players";
import {
	getPlayerAvatarTone,
	getPlayerInitials,
	type PlayersViewMode,
} from "../playersViewModel";

type Props = {
	players: Player[];
	viewMode: PlayersViewMode;
	activeTogglePlayerId?: string | null;
	onEditPlayer: (player: Player) => void;
	onTogglePlayerActive: (playerId: string) => void;
};

export function PlayersTable({
	players,
	viewMode,
	activeTogglePlayerId,
	onEditPlayer,
	onTogglePlayerActive,
}: Props) {
	if (viewMode === "list") {
		return (
			<PlayersList
				players={players}
				activeTogglePlayerId={activeTogglePlayerId}
				onEditPlayer={onEditPlayer}
				onTogglePlayerActive={onTogglePlayerActive}
			/>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{players.map((player) => (
				<PlayerCard
					key={player.id}
					player={player}
					isUpdating={activeTogglePlayerId === player.id}
					onEditPlayer={onEditPlayer}
					onTogglePlayerActive={onTogglePlayerActive}
				/>
			))}
		</div>
	);
}

function PlayerCard({
	player,
	isUpdating,
	onEditPlayer,
	onTogglePlayerActive,
}: {
	player: Player;
	isUpdating: boolean;
	onEditPlayer: (player: Player) => void;
	onTogglePlayerActive: (id: string) => void;
}) {
	return (
		<article className={`relative rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${player.isActive ? "border-slate-200" : "border-slate-200 opacity-75"}`}>
			<div className="flex items-start gap-4">
				<Link to={`/players/${player.id}`} className={`grid h-16 w-16 shrink-0 place-items-center rounded-full text-lg font-black ring-4 ring-white shadow-sm ${getPlayerAvatarTone(player.name)}`} aria-label={`Open ${player.name}'s profile`}>
					{getPlayerInitials(player.name)}
				</Link>

				<div className="min-w-0 flex-1 pr-10">
					<Link to={`/players/${player.id}`} className="block break-words text-lg font-black leading-tight text-slate-950 hover:text-yepset-700">
						{player.name}
					</Link>
					<div className="mt-2 flex flex-wrap items-end gap-x-5 gap-y-1">
						<p className="text-sm font-bold text-slate-500">#{player.number}</p>
						<p className="text-sm font-black text-slate-700">
							{player.appearances} <span className="text-[10px] uppercase tracking-wider text-slate-400">apps</span>
						</p>
					</div>
				</div>

				<div className="absolute right-3 top-3 sm:right-4 sm:top-4">
					<PlayerActions
						player={player}
						isUpdating={isUpdating}
						onEditPlayer={onEditPlayer}
						onTogglePlayerActive={onTogglePlayerActive}
					/>
				</div>
			</div>

			<div className="mt-5 flex min-h-7 flex-wrap items-center gap-2">
				{player.positions.length > 0 ? player.positions.map((position) => <PositionBadge key={position} position={position} />) : <span className="text-xs font-semibold text-slate-400">No positions set</span>}
				<PlayerStatus active={player.isActive} className="ml-auto" />
			</div>
		</article>
	);
}

function PlayersList({ players, activeTogglePlayerId, onEditPlayer, onTogglePlayerActive }: Omit<Props, "viewMode">) {
	return (
		<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
			<div className="divide-y divide-slate-100 md:hidden">
				{players.map((player) => (
					<div key={player.id} className="flex items-center gap-3 p-3">
						<Link to={`/players/${player.id}`} className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-xs font-black ${getPlayerAvatarTone(player.name)}`}>{getPlayerInitials(player.name)}</Link>
						<Link to={`/players/${player.id}`} className="min-w-0 flex-1">
							<span className="block break-words text-sm font-black leading-tight text-slate-950">{player.name}</span>
							<span className="mt-1 block truncate text-xs font-semibold text-slate-500">#{player.number} · {player.positions.join(", ") || "No positions"} · {player.appearances} apps</span>
						</Link>
						<PlayerStatus active={player.isActive} />
						<PlayerActions player={player} isUpdating={activeTogglePlayerId === player.id} onEditPlayer={onEditPlayer} onTogglePlayerActive={onTogglePlayerActive} />
					</div>
				))}
			</div>

			<div className="hidden overflow-x-auto md:block">
				<table className="w-full min-w-[760px] text-left">
					<thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
						<tr><th className="px-5 py-4">Player</th><th className="px-4 py-4">Positions</th><th className="px-4 py-4">Appearances</th><th className="px-4 py-4">Status</th><th className="px-5 py-4 text-right"><span className="sr-only">Actions</span></th></tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						{players.map((player) => (
							<tr key={player.id} className="transition hover:bg-slate-50/80">
								<td className="px-5 py-4"><div className="flex items-center gap-3"><Link to={`/players/${player.id}`} className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-xs font-black ${getPlayerAvatarTone(player.name)}`}>{getPlayerInitials(player.name)}</Link><div><Link to={`/players/${player.id}`} className="font-black text-slate-900 hover:text-yepset-700">{player.name}</Link><p className="mt-0.5 text-xs font-bold text-slate-400">#{player.number}</p></div></div></td>
								<td className="px-4 py-4"><div className="flex flex-wrap gap-1.5">{player.positions.length > 0 ? player.positions.map((position) => <PositionBadge key={position} position={position} />) : <span className="text-xs text-slate-400">Not set</span>}</div></td>
								<td className="px-4 py-4 font-bold text-slate-700">{player.appearances}</td>
								<td className="px-4 py-4"><PlayerStatus active={player.isActive} /></td>
								<td className="px-5 py-4 text-right"><PlayerActions player={player} isUpdating={activeTogglePlayerId === player.id} onEditPlayer={onEditPlayer} onTogglePlayerActive={onTogglePlayerActive} /></td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function PlayerActions({ player, isUpdating, onEditPlayer, onTogglePlayerActive }: { player: Player; isUpdating: boolean; onEditPlayer: (player: Player) => void; onTogglePlayerActive: (id: string) => void }) {
	return (
		<details className="group relative inline-block shrink-0 text-left">
			<summary aria-label={`Actions for ${player.name}`} className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-lg text-xl font-black text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-yepset-500">⋮</summary>
			<div className="absolute right-0 z-20 mt-1 grid min-w-44 gap-1 rounded-xl border border-slate-200 bg-white p-2 text-left shadow-xl">
				<Link to={`/players/${player.id}`} className={actionClassName}>View profile</Link>
				<button type="button" onClick={() => onEditPlayer(player)} className={actionClassName}>Edit player</button>
				<button type="button" disabled={isUpdating} onClick={() => onTogglePlayerActive(player.id)} className={`${actionClassName} disabled:cursor-wait disabled:opacity-50`}>{isUpdating ? "Updating…" : player.isActive ? "Deactivate" : "Activate"}</button>
			</div>
		</details>
	);
}

const actionClassName = "rounded-lg px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50";

function PositionBadge({ position }: { position: string }) {
	return <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-800">{position}</span>;
}

function PlayerStatus({ active, className = "" }: { active: boolean; className?: string }) {
	return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"} ${className}`}>{active ? "Active" : "Inactive"}</span>;
}
