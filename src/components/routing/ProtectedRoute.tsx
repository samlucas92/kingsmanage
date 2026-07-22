import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/auth";
import type { TenantRole } from "../../types/auth";
import ColdStartSplash from "../startup/ColdStartSplash";

export type ProtectedRole = "Admin" | "Coach" | "Player";

type ProtectedRouteProps = {
	allowedRoles?: ProtectedRole[];
	allowedTenantRoles?: TenantRole[];
	requirePlatformAdmin?: boolean;
};

export default function ProtectedRoute({
	allowedRoles,
	allowedTenantRoles,
	requirePlatformAdmin = false,
}: ProtectedRouteProps) {
	const location = useLocation();
	const currentUser = useAuthStore((state) => state.currentUser);
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const isInitialised = useAuthStore((state) => state.isInitialised);
	const isLoading = useAuthStore((state) => state.isLoading);
	const initialise = useAuthStore((state) => state.initialise);

	useEffect(() => {
		if (!isInitialised && !isLoading) {
			initialise();
		}
	}, [initialise, isInitialised, isLoading]);

	if (!isInitialised || isLoading) {
		return <ColdStartSplash />;
	}

	if (!isAuthenticated || !currentUser) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	if (allowedRoles && !allowedRoles.includes(currentUser.role as ProtectedRole)) {
		return <Navigate to="/access-denied" replace />;
	}

	if (
		requirePlatformAdmin &&
		!currentUser.isPlatformAdmin
	) {
		return <Navigate to="/access-denied" replace />;
	}

	if (
		allowedTenantRoles &&
		!currentUser.isPlatformAdmin &&
		(!currentUser.tenantRole ||
			!allowedTenantRoles.includes(currentUser.tenantRole))
	) {
		return <Navigate to="/access-denied" replace />;
	}

	return <Outlet />;
}
