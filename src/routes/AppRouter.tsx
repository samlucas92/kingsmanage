import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../pages/Dashboard/Dashboard";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Future routes */}
        {/* <Route path="/players" element={<Players />} /> */}
        {/* <Route path="/matches" element={<Matches />} /> */}
      </Routes>
    </BrowserRouter>
  );
}