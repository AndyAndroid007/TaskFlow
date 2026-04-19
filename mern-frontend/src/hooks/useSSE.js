import { useEffect, useState } from "react";
import { clearNotifications, deleteNotification, getNotifications } from "../api/notification";

const useSSE = (token) => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!token) return;

        let isMounted = true;

        const hydrateNotifications = async () => {
            try {
                const data = await getNotifications();
                if (isMounted) {
                    setNotifications(data);
                }
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        };

        hydrateNotifications();

        const sse = new EventSource(`${import.meta.env.VITE_API_BASE_URL}/events/stream?token=${token}`);

        sse.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.status === 'connected') {
                return;
            }
            setNotifications((prev) => {
                const next = [data, ...prev.filter((notification) => notification._id !== data._id)];
                return next.slice(0, 10);
            });
        };
        sse.onerror = (error) => {
            console.error('SSE connection error:', error);
        };

        return () => {
            isMounted = false;
            sse.close();
        };
    }, [token]);

    const removeNotification = async (notificationId) => {
        try {
            await deleteNotification(notificationId);
            setNotifications((prev) => prev.filter((notification) => notification._id !== notificationId));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const clear = async () => {
        try {
            await clearNotifications();
            setNotifications([]);
        } catch (error) {
            console.error('Failed to clear notifications:', error);
        }
    };

    return {
        notifications: token ? notifications : [],
        removeNotification,
        clear,
    };
};
export default useSSE;
