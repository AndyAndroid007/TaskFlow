import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import TaskDashboard from "./pages/TaskDashboard";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import AssistantDashboard from "./pages/AssistantDashboard";
import NotFoundPage from "./pages/NotFoundPage";
import { NotificationProvider } from "./context/NotificationContext";

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  return (
    <BrowserRouter>
      <NotificationProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<TaskDashboard user={user} setUser={setUser} />} />
          <Route path="/analytics" element={<AnalyticsDashboard user={user} setUser={setUser} />} />
          <Route path="/assistant" element={<AssistantDashboard user={user} setUser={setUser} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;
