import {API_BASE_URL} from "./config";
export const login = async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`,
        {
            method: "POST",
            headers: {"Content-Type" : "application/json"},
            body: JSON.stringify({email, password})
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || "Login Failed. Something went wrong. Please try again later.");
        }
        return res.json();
};
export const signup = async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, password}),
    });

    if(!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Couldn't register. Please try again sometime later.");
    }
    return res.json();
};
