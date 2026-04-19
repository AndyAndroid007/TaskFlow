import apiClient from "./apiClient";

export const getNotifications = async () => {
    return apiClient.get('/notifications');
};

export const deleteNotification = async (notificationId) => {
    return apiClient.delete(`/notifications/${notificationId}`);
};

export const clearNotifications = async () => {
    return apiClient.delete('/notifications');
};
