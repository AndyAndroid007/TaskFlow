import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from '../components/ui/NavBar';
import Analytics from './Analytics';
import { getTaskSummary } from '../api/analytics';
import { currentUser } from '../api/auth';
import AlertBox from '../components/ui/AlertBox';
import { CheckOAuthToken } from '../utils/OAuthValidator';

function AnalyticsDashboard({ user, setUser }) {
    const [summary, setSummary] = useState(null);
    const [alertInfo, setAlertInfo] = useState({
        show: false,
        description: "",
        type: ""
    });
    const [activeToken, setActiveToken] = useState(localStorage.getItem("token"));

    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const tokenFromURL = new URLSearchParams(window.location.search).get("token");
    
    if (!tokenFromURL && !token) {
        return <Navigate to="/" replace />;
    }

    useEffect(() => {
        CheckOAuthToken();
        setActiveToken(localStorage.getItem("token"));
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await currentUser();
                setUser(data.user);
                localStorage.setItem("user", JSON.stringify(data.user));
            } catch (err) {
                console.error("Error fetching user:", err);
            }
        }
        if (activeToken) {
            fetchUser();
        }
    }, [activeToken, setUser]);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const data = await getTaskSummary();
                setSummary(data);
            } catch (err) {
                console.error("Error fetching analytics summary:", err);
                triggerAlert(err.message, "error");
            }
        };
        if (activeToken) {
            fetchSummary();
        }
    }, [activeToken]);

    const triggerAlert = (description, type) => {
        setAlertInfo({
            show: true,
            description: description,
            type: type
        });
        setTimeout(() => {
            setAlertInfo({
                show: false,
                description: "",
                type: ""
            });
        }, 3000);
    }

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    }

    return (
        <>
            <Navbar user={user} onLogout={handleLogout} />
            {alertInfo.show &&
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] sm:w-auto sm:min-w-[300px] flex justify-center">
                    <AlertBox description={alertInfo.description} type={alertInfo.type} />
                </div>
            }
            <Analytics summary={summary} />
        </>
    );
};

export default AnalyticsDashboard;
