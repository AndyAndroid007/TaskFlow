import apiClient from "./apiClient";

const getTaskSummary = async () => {
    const res = await apiClient.get('/analytics/summary');
    return res;
};

export { getTaskSummary };
