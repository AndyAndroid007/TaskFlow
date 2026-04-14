import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import TaskDashboard from "./pages/TaskDashboard";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import { NotificationProvider } from "./context/NotificationContext";
function App() {
  const [user,setUser] = useState(JSON.parse(localStorage.getItem("user")));
  return (
    <BrowserRouter>
    <NotificationProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />          {/* Login page */}
        <Route path="/dashboard" element={<TaskDashboard user={user} setUser={setUser}/>} />  {/* Dashboard */}
        <Route path="/analytics" element={<AnalyticsDashboard user={user} setUser={setUser}/>} /> {/* Analytics Dashboard */}
      </Routes>
    </NotificationProvider>
      
    </BrowserRouter>
  );
}

export default App;