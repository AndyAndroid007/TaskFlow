import { customFetch } from "./apiClient";
export const getUsers = async () => {
    const token = localStorage.getItem("token");
    const res = await customFetch(`/users`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });

    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to fetch users. Please try again.");
    }
    return res.json();
};
