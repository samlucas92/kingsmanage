import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/auth";

export type ProtectedRole = "Admin" | "Coach" | "Player";

type ProtectedRouteProps = {
	allowedRoles?: ProtectedRole[];
};

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
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
		return null;
	}

	if (!isAuthenticated || !currentUser) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	if (allowedRoles && !allowedRoles.includes(currentUser.role as ProtectedRole)) {
		return <Navigate to="/access-denied" replace />;
	}

	return <Outlet />;
}
