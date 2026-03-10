import {API_BASE_URL} from "./config";
export const customFetch = async (endpoint, options = {}) => {
    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`,options);
        return res;
    } catch (networkError) {
        throw new Error ("Unable to connect to the server. Please check your internet connection or try again later.");
    }
}