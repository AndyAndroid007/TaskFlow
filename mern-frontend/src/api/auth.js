import apiClient from "./apiClient";
export const login = async (email, password) => {
    const res = await apiClient.post(`/auth/login`,{email, password});
    return res;
};
export const signup = async (email, password, name) => {
    const res = await apiClient.post('/auth/register', {email, password, name});
    return res;
};
export const currentUser = async () => {
    const res = await apiClient.get('/auth/me');
    return res;
}
