import { API_BASE_URL } from "./config";
import axios from 'axios';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
},
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        let errorMessage = "An unexpected error occured. Try again after sometime.";
        if(error.response) {
            errorMessage = error.response.data?.message || errorMessage;
        }
        else if (error.request) {
            errorMessage = "Unable to connect to the server. Please check your internet connection or try again later.";
        }
        return Promise.reject(new Error(errorMessage));
    }
);
export default apiClient;