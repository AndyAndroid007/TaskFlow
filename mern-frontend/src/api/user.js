import  apiClient from "./apiClient";
export const getUsers = async () => {
    const res = await apiClient.get('/users');
    return res;
};
