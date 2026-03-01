import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import TaskDashboard from "./pages/TaskDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />          {/* Login page */}
        <Route path="/dashboard" element={<TaskDashboard />} />  {/* Dashboard */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;