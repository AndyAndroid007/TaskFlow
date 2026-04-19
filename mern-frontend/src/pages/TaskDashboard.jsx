import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from '../components/ui/NavBar';
import Dashboard from '../pages/Dashboard';
import TaskSidedraw from './TaskSidedraw';
import { getTasks, addTask, editTask, deleteTask } from "../api/task";
import { currentUser } from '../api/auth';
import AlertBox from '../components/ui/AlertBox';
import { CheckOAuthToken } from '../utils/OAuthValidator';

function TaskDashboard({ user, setUser }) {
    const [isOpen, setIsOpen] = useState(false);
    const [action, setAction] = useState("add");
    const [selectedTask, setSelectedTask] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [taskView, setTaskView] = useState('created');
    const [alertInfo, setAlertInfo] = useState({
        show: false,
        description: "",
        type: ""
    });
    const [activeToken, setActiveToken] = useState(localStorage.getItem("token"));

    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const tokenFromURL = new URLSearchParams(window.location.search).get("token");
    if (!tokenFromURL && !token) {
        return <Navigate to="/" replace />;
    }

    useEffect(() => {
        CheckOAuthToken();
        setActiveToken(localStorage.getItem("token"));
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await currentUser();
                setUser(data.user);
                localStorage.setItem("user", JSON.stringify(data.user));
            } catch (err) {
                throw new Error(err.message);
            }
        }
        if (activeToken) {
            fetchUser();
        }
    }, [activeToken]);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const data = await getTasks();
                setTasks(data);
            } catch (err) {
                console.error("Error fetching tasks:", err);
                triggerAlert(err.message, "warning");
            }
        };
        if (activeToken) {
            fetchTasks();
        }
    }, [activeToken]);

    const handleAddTask = async (task) => {
        try {
            const newTask = await addTask(task);
            setTasks(prev => [...prev, newTask]);
            setIsOpen(false);
            triggerAlert("Task Created Successfully", "success");
        } catch (err) {
            console.error("Error adding task:", err);
            triggerAlert(err.message, "error");
        }
    };

    const handleEditTask = async (id, taskData) => {
        try {
            const updatedTask = await editTask(id, taskData);
            setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
            setIsOpen(false);
            triggerAlert("Task Updated Successfully", "success");
        } catch (err) {
            console.error("Error editing task:", err);
            triggerAlert(err.message, "error");
        }
    };

    const handleDeleteTask = async (task) => {
        try {
            await deleteTask(task._id);
            setTasks(prev => prev.filter(t => t._id !== task._id));
            triggerAlert("Task Deleted Successfully", "success");
        } catch (err) {
            console.error("Error deleting task:", err);
            triggerAlert(err.message, "error");
        }
    }

    const triggerAlert = (description, type) => {
        setAlertInfo({
            show: true,
            description: description,
            type: type
        });
        setTimeout(() => {
            setAlertInfo({
                show: false,
                description: "",
                type: ""
            });
        }, 3000);
    }

    const openAddDrawer = () => {
        setTaskView('created');
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

    const createdTasks = tasks.filter((task) => String(task.userId) === String(user?._id));
    const assignedTasks = tasks.filter((task) => String(task.userId) !== String(user?._id));
    const visibleTasks = taskView === 'assigned' ? assignedTasks : createdTasks;

    return (
        <>
            <Navbar user={user} onLogout={handleLogout} />
            {alertInfo.show &&
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] sm:w-auto sm:min-w-[300px] flex justify-center">
                    <AlertBox description={alertInfo.description} type={alertInfo.type} />
                </div>
            }
            <Dashboard
                user={user}
                taskView={taskView}
                onTaskViewChange={setTaskView}
                onAdd={openAddDrawer}
                onEdit={openEditDrawer}
                onDelete={handleDeleteTask}
                tasks={visibleTasks}
            />
            {isOpen && (
                <TaskSidedraw
                    action={action}
                    currentUser={user}
                    task={selectedTask}
                    onClose={() => setIsOpen(false)}
                    onSave={handleAddTask}
                    onUpdate={handleEditTask}
                    triggerAlert={triggerAlert}
                />
            )}
        </>
    );
};

export default TaskDashboard;
