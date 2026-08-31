import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useOrganizationLocationsStore } from "../../stores/organizationLocations";
import {
	formatOrganizationLocation,
	type OrganizationLocation,
} from "../../types/locations";

export default function LocationPicker({
	value,
	onChange,
	label = "Location",
	required = false,
}: {
	value: string;
	onChange: (value: string) => void;
	label?: string;
	required?: boolean;
}) {
	const locations = useOrganizationLocationsStore((state) => state.locations);
	const loadLocations = useOrganizationLocationsStore((state) => state.loadLocations);
	const isLoading = useOrganizationLocationsStore((state) => state.isLoading);
	const loadError = useOrganizationLocationsStore((state) => state.error);
	const activeLocations = useMemo(
		() => locations.filter((location) => location.isActive),
		[locations]
	);
	const matchingLocation = activeLocations.find(
		(location) => formatOrganizationLocation(location) === value
	);
	const [modeChoice, setModeChoice] = useState<"known" | "custom" | null>(null);
	const mode = modeChoice ?? (value && !matchingLocation ? "custom" : "known");
	const [search, setSearch] = useState("");

	useEffect(() => {
		void loadLocations();
	}, [loadLocations]);

	const results = useMemo(() => {
		const query = search.trim().toLowerCase();
		return activeLocations
			.filter((location) => !query || `${location.name} ${location.address} ${location.notes}`.toLowerCase().includes(query))
			.slice(0, 8);
	}, [activeLocations, search]);

	function chooseLocation(location: OrganizationLocation) {
		onChange(formatOrganizationLocation(location));
		setModeChoice("known");
		setSearch("");
	}

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between gap-3">
				<span className="text-sm font-semibold text-slate-700">{label}{required ? " *" : ""}</span>
				<div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-bold">
					<button type="button" onClick={() => setModeChoice("known")} className={`rounded-md px-2.5 py-1.5 ${mode === "known" ? "bg-white text-yepset-700 shadow-sm" : "text-slate-500"}`}>Known</button>
					<button type="button" onClick={() => setModeChoice("custom")} className={`rounded-md px-2.5 py-1.5 ${mode === "custom" ? "bg-white text-yepset-700 shadow-sm" : "text-slate-500"}`}>Custom</button>
				</div>
			</div>

			{mode === "custom" ? (
				<input
					value={value}
					onChange={(event) => onChange(event.target.value)}
					required={required}
					className="w-full rounded-lg border border-slate-300 px-3 py-2"
					placeholder="Venue name and full address"
				/>
			) : (
				<div className="space-y-2">
					<input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						className="w-full rounded-lg border border-slate-300 px-3 py-2"
						placeholder="Search known venues or addresses"
					/>
					{matchingLocation && !search && (
						<div className="rounded-xl border border-green-200 bg-green-50 p-3">
							<p className="text-sm font-bold text-green-900">{matchingLocation.name}</p>
							<p className="mt-0.5 text-xs text-green-700">{matchingLocation.address}</p>
						</div>
					)}
					{(!matchingLocation || search) && (
						<div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white">
							{results.map((location) => (
								<button key={location.id} type="button" onClick={() => chooseLocation(location)} className="block w-full border-b border-slate-100 px-3 py-2.5 text-left last:border-0 hover:bg-yepset-50">
									<span className="block text-sm font-bold text-slate-900">{location.name}</span>
									<span className="mt-0.5 block text-xs text-slate-500">{location.address}</span>
								</button>
							))}
							{!isLoading && results.length === 0 && <p className="px-3 py-3 text-sm text-slate-500">No known locations match this search.</p>}
						</div>
					)}
				</div>
			)}

			{isLoading && <p className="text-xs font-medium text-slate-500">Loading known locations…</p>}
			{loadError && <p className="text-xs font-semibold text-amber-700">{loadError} You can still enter a custom location.</p>}
			{activeLocations.length === 0 && !isLoading && !loadError && mode === "known" && (
				<p className="text-xs text-slate-500">No known locations yet. <Link to="/organization" className="font-bold text-yepset-700">Add them in Organization</Link> or use a custom location.</p>
			)}
		</div>
	);
}
