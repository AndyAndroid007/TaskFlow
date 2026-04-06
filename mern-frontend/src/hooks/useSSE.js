import { useState, useEffect } from "react"; 
const useSSE = (token) => {
    const [notifications, setNotifications] = useState([]);
    useEffect(() => {
        if (!token) return;
        const sse = new EventSource(`${import.meta.env.VITE_API_BASE_URL}/events/stream?token=${token}`);

        sse.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.status === 'connected') {
                return;
            }
            setNotifications(prev => [data,...prev].slice(0,10));
        };
        sse.onerror = (error) => {
            throw new Error({error: error.message});
        }
        return () => sse.close();
    },[token]);
    const removeNotification = (index) => {
        setNotifications(prev => prev.filter((_, i) => i !== index));
    };

    return { 
        notifications, 
        removeNotification, 
        clear: () => setNotifications([]) 
    };
}
export default useSSE;