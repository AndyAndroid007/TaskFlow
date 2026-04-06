import React, {createContext, useContext} from 'react';
import useSSE from '../hooks/useSSE';

const NotificationContext = createContext();

export const NotificationProvider = ({children}) => {
    const token = localStorage.getItem('token');
    const {notifications, removeNotification, clear} = useSSE(token);
    
    return (
        <NotificationContext.Provider value={{notifications, removeNotification, clear}}>
            {children}
        </NotificationContext.Provider>
    );
};
export const useNotifications = () => useContext(NotificationContext);