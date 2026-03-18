import apiClient from "./apiClient";
export const login = async (email, password) => {
    const res = await apiClient.post(`/auth/login`,{email, password});
    return res;
};
export const signup = async (email, password) => {
    const res = await apiClient.post('/auth/register', {email, password});
    return res;
};
