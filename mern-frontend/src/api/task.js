import  apiClient from "./apiClient";
const getTasks = async () => {
    const res = await apiClient.get(`/tasks`);
    return res;
};
const addTask = async (newTask) => {
    const res = await apiClient.post('/tasks',newTask);
    return res;
};

const editTask = async(id, updatedTask) => {
    const res = await apiClient.put(`/tasks/${id}`, updatedTask);
    return res;
}

const deleteTask  = async (taskId) => {
    const res = await apiClient.delete(`/tasks/${taskId}`);
    return res;
}

export {getTasks, addTask, editTask, deleteTask};
