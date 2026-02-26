import LoginPage from "./pages/LoginPage.jsx";
import NavBar from "./components/ui/NavBar.jsx";
import TaskCard from "./components/ui/TaskCard.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import TaskSidedraw from "./pages/TaskSidedraw.jsx";
function App() {
  return (
    <>
    {/* <LoginPage /> */}
    {/* <NavBar/> */}
    {/* <TaskCard task = {{
  "id": 1,
  "title": "Finish React Dashboard",
  "description": "Implement task card UI with badges, dates, and delete functionality. Make it responsive for mobile and desktop views.",
  "completed": false,
  "createdAt": "2026-02-10T09:30:00.000Z",
  "updatedAt": "2026-02-15T14:45:00.000Z",
  "assignedTo": "John Doe",
  "priority": "High"
}
} onEdit={()=> console.log("edit")} onDelete={()=>console.log("delete")}></TaskCard>
     */}
     {/* {<Dashboard />} */}
     {TaskSidedraw(true, null)} 
    </>
  );
}

export default App;
