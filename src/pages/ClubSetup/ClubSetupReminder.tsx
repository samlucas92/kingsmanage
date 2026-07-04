import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { clubTeamsApi } from "../../services/clubTeamsApi";
import { organizationApi } from "../../services/organizationApi";
import { useAuthStore } from "../../stores/auth";
import type { ClubTeamProfile } from "../../stores/clubTeams";
import type { SportsClub } from "../../types/organization";
import { buildSetupChecklist } from "./setupModel";

export function ClubSetupReminder() {
	const currentUser = useAuthStore((state) => state.currentUser);
	const activeClubId = useAuthStore(
		(state) => state.availableClubs.find((club) => club.isCurrent)?.id
	);
	const canManage =
		currentUser?.role === "Admin" &&
		(currentUser.isPlatformAdmin ||
			currentUser.tenantRole === "OrganizationAdmin" ||
			currentUser.tenantRole === "ClubAdmin");
	const [club, setClub] = useState<SportsClub | null>(null);
	const [teams, setTeams] = useState<ClubTeamProfile[]>([]);

	useEffect(() => {
		if (!canManage) return;
		let active = true;
		Promise.all([organizationApi.getClubs(), clubTeamsApi.getAll()])
			.then(([clubs, loadedTeams]) => {
				if (!active) return;
				setClub(clubs.find((item) => item.id === activeClubId) ?? null);
				setTeams(loadedTeams);
			})
			.catch(() => undefined);
		return () => {
			active = false;
		};
	}, [activeClubId, canManage]);

	const checklist = useMemo(
		() => (club ? buildSetupChecklist(club, teams, currentUser) : []),
		[club, currentUser, teams]
	);
	const incomplete = checklist.filter((item) => !item.complete);

	if (
		!canManage ||
		!club ||
		club.setupCompletedAt ||
		(club.setupStep ?? 0) === 0 ||
		incomplete.length === 0
	) {
		return null;
	}

	return (
		<div className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<p className="text-sm font-black text-amber-950">Finish club setup</p>
				<p className="mt-1 text-xs text-amber-800">
					Still needed: {incomplete.map((item) => item.label).join(", ")}.
				</p>
			</div>
			<Link to="/club-setup" className="btn-secondary shrink-0 justify-center">
				Continue setup
			</Link>
		</div>
	);
}
