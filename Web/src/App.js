import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react"; // ✅ useEffect 추가

import LoginPage from "./pages/LoginPage";

import SmartFarmNavbar from "./components/Navbar";
import AdminNavbar from "./components/AdminNavbar";

import Dashboard from "./pages/Dashboard";
import ControlPanel from "./pages/ControlPanel";
import DataVisualization from "./pages/DataVisualization";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Help from "./pages/Help";
import Logout from "./pages/Logout";

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

  // ✅ 앱 시작 시 sessionStorage에서 role 불러오기
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
        <Route
          path="/"
          element={<LoginPage setUserRole={setUserRole} />}
        />

        {/* 유저용 페이지 */}
        {userRole === "user" && (
          <>
            <Route path="/user" element={<Dashboard />} />
            <Route path="/control" element={<ControlPanel />} />
            <Route path="/data" element={<DataVisualization />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/help" element={<Help />} />
            <Route path="/logout" element={<Logout setUserRole={setUserRole} />} />
          </>
        )}

        {/* 어드민용 페이지 */}
        {userRole === "admin" && (
          <>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUserList />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/monitoring" element={<AdminMonitoring />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
            <Route path="/admin/eventlogs" element={<AdminEventLogs />} />
            <Route path="/admin/environment" element={<AdminEnvironmentSettings />} />
            <Route path="/admin/security" element={<AdminSecuritySettings />} />
            <Route path="/admin/system" element={<AdminSystemSettings />} />
            <Route path="/logout" element={<Logout setUserRole={setUserRole} />} />
          </>
        )}

        {/* 잘못된 경로 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
