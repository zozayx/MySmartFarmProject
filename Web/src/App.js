import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage"; // ✅ 홈페이지 추가

import SmartFarmNavbar from "./components/UserNavbar";
import AdminNavbar from "./components/AdminNavbar";

// 유저 페이지
import UserDashboardControlPanel from "./pages/User/UserDashboardControlPanel";
import DataVisualization from "./pages/User/UserDataVisualization";
import Settings from "./pages/User/UserSettings";
import Profile from "./pages/User/UserProfile";
import Help from "./pages/Help";
import Logout from "./pages/Logout";
import UserEnvironmentSettings from "./pages/User/UserEnvironmentSettings";

// 어드민 페이지
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUserList from "./pages/admin/AdminUserList";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminMonitoring from "./pages/admin/AdminMonitoring";
import AdminEventLogs from "./pages/admin/AdminEventLogs";
import AdminEnvironmentSettings from "./pages/admin/AdminEnvironmentSettings";
import AdminSecuritySettings from "./pages/admin/AdminSecuritySettings";
import AdminSystemSettings from "./pages/admin/AdminSystemSettings";
import AdminProfile from "./pages/admin/AdminProfile";

import NotFoundPage from "./pages/NotFoundPage";

function App() {
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const storedRole = sessionStorage.getItem("userRole");
    if (storedRole) {
      setUserRole(storedRole);
    }
  }, []);

  return (
    <Router>
      {userRole === "user" && <SmartFarmNavbar />}
      {userRole === "admin" && <AdminNavbar />}

      <Routes>
        {/* ✅ 홈페이지 - 홍보용 */}
        <Route path="/" element={<HomePage />} />

        {/* ✅ 로그인 */}
        <Route path="/login" element={<LoginPage setUserRole={setUserRole} />} />

        {/* ✅ 유저용 페이지 */}
        {userRole === "user" && (
          <>
            <Route path="/user" element={<Navigate to="/user/dashboard-control" />} />
            <Route path="/user/dashboard-control" element={<UserDashboardControlPanel />} />
            <Route path="/data" element={<DataVisualization />} />
            <Route path="/env-settings" element={<UserEnvironmentSettings />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/help" element={<Help />} />
            <Route path="/logout" element={<Logout setUserRole={setUserRole} />} />
          </>
        )}

        {/* ✅ 어드민용 페이지 */}
        {userRole === "admin" && (
          <>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUserList />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/monitoring" element={<AdminMonitoring />} />
            <Route path="/admin/eventlogs" element={<AdminEventLogs />} />
            <Route path="/admin/environment" element={<AdminEnvironmentSettings />} />
            <Route path="/admin/security" element={<AdminSecuritySettings />} />
            <Route path="/admin/system" element={<AdminSystemSettings />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
            <Route path="/logout" element={<Logout setUserRole={setUserRole} />} />
          </>
        )}

        {/* ✅ 잘못된 경로 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
