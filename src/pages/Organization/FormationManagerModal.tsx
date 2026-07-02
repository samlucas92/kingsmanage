import { useState, type KeyboardEvent, type PointerEvent } from "react";
import {
	getSportDefinition,
	type FormationSlot,
	type SportFormation,
} from "../../constants/sports";
import type { SportsClub } from "../../types/organization";
import { SurfaceMarkings } from "../Matches/components/team-picker/TeamPitch";
import { clamp, getFormationPosition } from "./formationEditor";

interface FormationManagerModalProps {
	club: SportsClub;
	onClose: () => void;
	onSave: (formations: SportFormation[]) => Promise<void>;
}

export function FormationManagerModal({
	club,
	onClose,
	onSave,
}: FormationManagerModalProps) {
	const sport = getSportDefinition(club.sportKey);
	const [formations, setFormations] = useState<SportFormation[]>(() =>
		structuredClone(club.customFormations ?? [])
	);
	const [selectedKey, setSelectedKey] = useState(
		club.customFormations?.[0]?.key ?? ""
	);
	const [baseKey, setBaseKey] = useState(sport.formations[0].key);
	const [saving, setSaving] = useState(false);
	const selectedFormation = formations.find(
		(formation) => formation.key === selectedKey
	);

	function addFormation() {
		const base =
			sport.formations.find((formation) => formation.key === baseKey) ??
			sport.formations[0];
		const sequence = formations.length + 1;
		const key = getUniqueFormationKey(
			`custom-formation-${sequence}`,
			formations,
			sport.formations
		);
		const formation: SportFormation = {
			key,
			name: `Custom formation ${sequence}`,
			slots: base.slots.map((slot) => ({ ...slot })),
		};
		setFormations((current) => [...current, formation]);
		setSelectedKey(key);
	}

	function updateSelected(
		update: (formation: SportFormation) => SportFormation
	) {
		setFormations((current) =>
			current.map((formation) =>
				formation.key === selectedKey ? update(formation) : formation
			)
		);
	}

	function updateSlot(index: number, update: Partial<FormationSlot>) {
		updateSelected((formation) => ({
			...formation,
			slots: formation.slots.map((slot, slotIndex) =>
				slotIndex === index ? { ...slot, ...update } : slot
			),
		}));
	}

	function moveSlotFromPointer(
		index: number,
		event: PointerEvent<HTMLButtonElement>
	) {
		event.preventDefault();
		const surface = event.currentTarget.parentElement;
		if (!surface) return;
		const rect = surface.getBoundingClientRect();
		const move = (pointerEvent: globalThis.PointerEvent) => {
			updateSlot(
				index,
				getFormationPosition(
					pointerEvent.clientX,
					pointerEvent.clientY,
					rect
				)
			);
		};
		const stop = () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", stop);
			window.removeEventListener("pointercancel", stop);
		};
		move(event.nativeEvent);
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", stop);
		window.addEventListener("pointercancel", stop);
	}

	function moveSlotWithKeyboard(
		index: number,
		slot: FormationSlot,
		event: KeyboardEvent<HTMLButtonElement>
	) {
		const movement = {
			ArrowLeft: { x: -2, y: 0 },
			ArrowRight: { x: 2, y: 0 },
			ArrowUp: { x: 0, y: -2 },
			ArrowDown: { x: 0, y: 2 },
		}[event.key];
		if (!movement) return;
		event.preventDefault();
		updateSlot(index, {
			x: clamp(slot.x + movement.x, 5, 95),
			y: clamp(slot.y + movement.y, 5, 95),
		});
	}

	async function save() {
		setSaving(true);
		try {
			await onSave(formations);
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto bg-yepset-950/60 p-3 backdrop-blur-sm sm:p-6">
			<div className="mx-auto my-3 w-full max-w-6xl rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="text-xs font-black uppercase tracking-[.14em] text-yepset-600">
							{club.name}
						</p>
						<h2 className="mt-1 text-2xl font-black">Custom formations</h2>
						<p className="mt-1 text-sm text-slate-500">
							Start with a {sport.name} formation, then drag each shirt into
							place.
						</p>
					</div>
					<button type="button" onClick={onClose} aria-label="Close">
						✕
					</button>
				</div>

				<div className="mt-6 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
					<aside className="space-y-4">
						<div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
							<label className="text-sm font-semibold text-slate-700">
								Start from
								<select
									value={baseKey}
									onChange={(event) => setBaseKey(event.target.value)}
									className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
								>
									{sport.formations.map((formation) => (
										<option key={formation.key} value={formation.key}>
											{formation.name}
										</option>
									))}
								</select>
							</label>
							<button
								type="button"
								onClick={addFormation}
								className="btn-primary mt-3 w-full"
							>
								Add custom formation
							</button>
						</div>

						<div className="space-y-2">
							{formations.length === 0 && (
								<p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
									No custom formations yet. Built-in formations remain
									available.
								</p>
							)}
							{formations.map((formation) => (
								<button
									key={formation.key}
									type="button"
									onClick={() => setSelectedKey(formation.key)}
									className={`w-full rounded-xl border px-3 py-3 text-left text-sm font-bold ${
										selectedKey === formation.key
											? "border-yepset-500 bg-yepset-50 text-yepset-800"
											: "border-slate-200 hover:bg-slate-50"
									}`}
								>
									{formation.name}
								</button>
							))}
						</div>
					</aside>

					{selectedFormation ? (
						<section className="min-w-0">
							<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
								<label className="flex-1 text-sm font-semibold text-slate-700">
									Formation name
									<input
										value={selectedFormation.name}
										maxLength={60}
										onChange={(event) =>
											updateSelected((formation) => ({
												...formation,
												name: event.target.value,
											}))
										}
										className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
									/>
								</label>
								<button
									type="button"
									onClick={() => {
										setFormations((current) =>
											current.filter(
												(formation) => formation.key !== selectedKey
											)
										);
										setSelectedKey("");
									}}
									className="btn-secondary text-red-700"
								>
									Delete formation
								</button>
							</div>

							<div
								className={`relative h-[500px] touch-none overflow-hidden rounded-xl border-4 border-white shadow-inner ${
									sport.surface === "netball-court"
										? "bg-blue-700"
										: sport.surface === "cricket-field"
											? "bg-green-600"
											: "bg-green-700"
								}`}
								data-testid="formation-editor-surface"
							>
								<SurfaceMarkings surface={sport.surface} />
								{selectedFormation.slots.map((slot, index) => (
									<button
										key={slot.key}
										type="button"
										onPointerDown={(event) =>
											moveSlotFromPointer(index, event)
										}
										onKeyDown={(event) =>
											moveSlotWithKeyboard(index, slot, event)
										}
										className="absolute z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center text-xs font-black text-white drop-shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-300"
										style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
										aria-label={`Move ${slot.label} position`}
									>
										<svg
											viewBox="0 0 64 64"
											className="absolute inset-0 h-full w-full text-blue-700"
											aria-hidden="true"
										>
											<path
												d="M20 6 27 2h10l7 4 15 8-8 15-7-4v35H20V25l-7 4-8-15Z"
												fill="currentColor"
												stroke="white"
												strokeWidth="2.5"
												strokeLinejoin="round"
											/>
										</svg>
										<span className="relative z-10">{slot.label}</span>
									</button>
								))}
							</div>

							<div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
								{selectedFormation.slots.map((slot, index) => (
									<label
										key={slot.key}
										className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
									>
										Position {index + 1}
										<select
											value={slot.label}
											onChange={(event) =>
												updateSlot(index, { label: event.target.value })
											}
											className="rounded-lg border border-slate-300 bg-white px-2 py-1"
										>
											{!sport.positions.some(
												(position) => position.key === slot.label
											) && <option value={slot.label}>{slot.label}</option>}
											{sport.positions.map((position) => (
												<option key={position.key} value={position.key}>
													{position.key} · {position.label}
												</option>
											))}
										</select>
									</label>
								))}
							</div>
						</section>
					) : (
						<div className="grid min-h-80 place-items-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
							Add or select a custom formation to edit it.
						</div>
					)}
				</div>

				<div className="mt-6 flex justify-end gap-2 border-t pt-4">
					<button type="button" onClick={onClose} className="btn-secondary">
						Cancel
					</button>
					<button
						type="button"
						onClick={() => void save()}
						disabled={
							saving ||
							formations.some((formation) => !formation.name.trim())
						}
						className="btn-primary disabled:opacity-50"
					>
						{saving ? "Saving..." : "Save formations"}
					</button>
				</div>
			</div>
		</div>
	);
}

function getUniqueFormationKey(
	preferredKey: string,
	customFormations: SportFormation[],
	builtInFormations: SportFormation[]
) {
	const keys = new Set(
		[...customFormations, ...builtInFormations].map(
			(formation) => formation.key
		)
	);
	let key = preferredKey;
	let suffix = 2;
	while (keys.has(key)) {
		key = `${preferredKey}-${suffix}`;
		suffix += 1;
	}
	return key;
}
