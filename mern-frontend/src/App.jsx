import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import TaskDashboard from "./pages/TaskDashboard";

function App() {
  const [user,setUser] = useState(JSON.parse(localStorage.getItem("user")));
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />          {/* Login page */}
        <Route path="/dashboard" element={<TaskDashboard user={user} setUser={setUser}/>} />  {/* Dashboard */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;