import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from '../components/ui/NavBar';
import Dashboard from '../pages/Dashboard';
import TaskSidedraw from './TaskSidedraw';
import { getTasks, addTask, editTask, deleteTask } from "../api/task";
import AlertBox from '../components/ui/AlertBox';

function TaskDashboard() {
    const [isOpen, setIsOpen] = useState(false);
    const [action, setAction] = useState("add");
    const [selectedTask, setSelectedTask] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [alertInfo, setAlertInfo] = useState({
        show: false,
        description: "",
        type: ""
    });

    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    if (!token) {
        return <Navigate to="/" replace />;
    }

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
        fetchTasks();
    }, []);

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
            <Navbar onLogout={handleLogout} />
            {alertInfo.show &&
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] sm:w-auto sm:min-w-[300px] flex justify-center">
                    <AlertBox description={alertInfo.description} type={alertInfo.type} />
                </div>
            }
            <Dashboard onAdd={openAddDrawer} onEdit={openEditDrawer} onDelete={handleDeleteTask} tasks={tasks} />
            {isOpen && (
                <TaskSidedraw
                    action={action}
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