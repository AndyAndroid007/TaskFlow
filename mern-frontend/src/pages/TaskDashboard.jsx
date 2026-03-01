import {useState, useEffect} from 'react';
import {Navigate, useNavigate} from "react-router-dom";
import Navbar from '../components/ui/NavBar';
import Dashboard from '../pages/Dashboard';
import TaskSidedraw from './TaskSidedraw';
import {getTasks, addTask, editTask, deleteTask} from "../api/task";
// const mockTasks = [
//     {
//         _id: "507f1f77bcf86cd799439011",
//         title: "Complete project documentation",
//         description: "Write comprehensive documentation for the MERN stack project including setup instructions and API endpoints",
//         completed: false,
//         createdAt: new Date("2026-02-15T10:30:00Z"),
//         updatedAt: new Date("2026-02-15T10:30:00Z"),
//         __v: 0
//     },
//     {
//         _id: "507f1f77bcf86cd799439012",
//         title: "Fix login authentication bug",
//         description: "Resolve the issue with JWT token validation in the authentication middleware",
//         completed: true,
//         createdAt: new Date("2026-02-14T14:20:00Z"),
//         updatedAt: new Date("2026-02-16T09:45:00Z"),
//         __v: 0
//     },
//     {
//         _id: "507f1f77bcf86cd799439013",
//         title: "Implement task filtering",
//         description: "Add functionality to filter tasks by completion status and creation date",
//         completed: false,
//         createdAt: new Date("2026-02-13T16:15:00Z"),
//         updatedAt: new Date("2026-02-13T16:15:00Z"),
//         __v: 0
//     },
//     {
//         _id: "507f1f77bcf86cd799439014",
//         title: "Update UI components",
//         description: "Redesign TaskCard component with better styling and responsive layout",
//         completed: false,
//         createdAt: new Date("2026-02-12T11:00:00Z"),
//         updatedAt: new Date("2026-02-17T13:30:00Z"),
//         __v: 0
//     },
//     {
//         _id: "507f1f77bcf86cd799439015",
//         title: "Set up automated testing",
//         description: "Configure Jest and React Testing Library for unit and integration tests",
//         completed: true,
//         createdAt: new Date("2026-02-11T08:45:00Z"),
//         updatedAt: new Date("2026-02-14T12:20:00Z"),
//         __v: 0
//     },
//     {
//         _id: "507f1f77bcf86cd799439016",
//         title: "Optimize database queries",
//         description: "Review and optimize MongoDB queries for better performance and add proper indexing",
//         completed: false,
//         createdAt: new Date("2026-02-10T15:30:00Z"),
//         updatedAt: new Date("2026-02-10T15:30:00Z"),
//         __v: 0
//     },
//     {
//         _id: "507f1f77bcf86cd799439017",
//         title: "Add error handling",
//         description: "Implement comprehensive error handling across all API endpoints and frontend components",
//         completed: false,
//         createdAt: new Date("2026-02-09T12:15:00Z"),
//         updatedAt: new Date("2026-02-18T10:00:00Z"),
//         __v: 0
//     },
//     {
//         _id: "507f1f77bcf86cd799439018",
//         title: "Create user profile page",
//         description: "Design and implement a user profile page with edit functionality and avatar upload",
//         completed: true,
//         createdAt: new Date("2026-02-08T09:20:00Z"),
//         updatedAt: new Date("2026-02-15T14:50:00Z"),
//         __v: 0
//     },
//     {
//         _id: "507f1f77bcf86cd799439019",
//         title: "Deploy to production",
//         description: "Set up production environment on AWS with proper CI/CD pipeline and monitoring",
//         completed: false,
//         createdAt: new Date("2026-02-07T17:40:00Z"),
//         updatedAt: new Date("2026-02-07T17:40:00Z"),
//         __v: 0
//     },
//     {
//         _id: "507f1f77bcf86cd799439020",
//         title: "Code review and refactoring",
//         description: "Conduct thorough code review and refactor components for better maintainability and performance",
//         completed: false,
//         createdAt: new Date("2026-02-06T13:25:00Z"),
//         updatedAt: new Date("2026-02-16T16:10:00Z"),
//         __v: 0
//     }
// ];

function TaskDashboard () {
    const [isOpen, setIsOpen] = useState(false);
    const [action, setAction] = useState("add");
    const [selectedTask, setSelectedTask] = useState(null);
    const [tasks, setTasks] = useState([]);

    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    if (!token) {
        return <Navigate to = "/" replace />;   
    }

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const data = await getTasks();
                setTasks(data);
            } catch (err) {
                console.error("Error fetching tasks:", err);
            }
        };
        fetchTasks();
    }, []);

    const handleAddTask = async (task) => {
        try {
            const newTask = await addTask(task);
            setTasks(prev => [...prev, newTask]);
            setIsOpen(false);
        } catch (err) {
            console.error("Error adding task:", err);
        }
    };

    const handleEditTask = async (id, taskData) => {
        try {
            const updatedTask = await editTask(id, taskData);
            setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
            setIsOpen(false);
        } catch (err) {
            console.error("Error editing task:", err);
        }
    };

    const handleDeleteTask = async (task) => {
        try {
            await deleteTask(task._id);
            setTasks(prev => prev.filter(t => t._id !== task._id));
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    }

    const openAddDrawer = () => {
        setIsOpen(true);
        setAction("add");
        setSelectedTask(null);
    };

    const openEditDrawer = (task) => {
        setIsOpen(true);
        setAction("edit");
        setSelectedTask(task);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    }

    return (
        <>
            <Navbar onLogout = {handleLogout}/>
            <Dashboard onAdd={openAddDrawer} onEdit={openEditDrawer} onDelete = {handleDeleteTask} tasks={tasks} />
            {isOpen && (
                <TaskSidedraw
                    action={action}
                    task={selectedTask}
                    onClose={() => setIsOpen(false)}
                    onSave={handleAddTask}
                    onUpdate={handleEditTask}
                />
            )}
        </>
    );
};

export default TaskDashboard;