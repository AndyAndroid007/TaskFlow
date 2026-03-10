import { customFetch } from "./apiClient";
const getTasks = async () => {
    const token = localStorage.getItem("token");
    const res = await customFetch(`/tasks`,
        {
            method: "GET",
            headers: {
                "Content-Type" : "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || "Failed to Fetch Tasks. Something went wrong. Please try again later.");
        }
        return res.json();
};
const addTask = async (newTask) => {
    const token = localStorage.getItem("token");
    const res = await customFetch(`/tasks`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({...newTask}),
    });

    if(!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Couldn't save task. Please try again sometime later.");
    }
    return res.json();
};

const editTask = async(id, updatedTask) => {
    const token = localStorage.getItem("token");
    const res = await customFetch(`/tasks/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({...updatedTask}),
    });

    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Couldn't update task. Please try again sometime later.");
    }
    return res.json();
}

const deleteTask  = async (taskId) => {
    const token = localStorage.getItem("token");
    const res = await customFetch(`/tasks/${taskId}`, {
        method: "DELETE",
        headers:
        {
            "content-type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });

    if(!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Couldn't delete task. Please try again sometime later.");
    }
    return res.json();
}

export {getTasks, addTask, editTask, deleteTask};
