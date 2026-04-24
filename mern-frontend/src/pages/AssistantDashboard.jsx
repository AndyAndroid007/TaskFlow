import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import NavBar from "../components/ui/NavBar";
import AlertBox from "../components/ui/AlertBox";
import AssistantPage from "./AssistantPage";
import { currentUser } from "../api/auth";
import { getUsers } from "../api/user";
import { CheckOAuthToken } from "../utils/OAuthValidator";
import { useAssistantConversation } from "../hooks/useAssistantConversation";

function AssistantDashboard({ user, setUser }) {
    const [alertInfo, setAlertInfo] = useState({
        show: false,
        description: "",
        type: "",
    });
    const [activeToken, setActiveToken] = useState(localStorage.getItem("token"));
    const [allUsers, setAllUsers] = useState([]);

    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const tokenFromURL = new URLSearchParams(window.location.search).get("token");
    const isAuthenticated = Boolean(tokenFromURL || token);

    const conversation = useAssistantConversation(activeToken);

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
            } catch (error) {
                console.error("Error fetching user:", error);
            }
        };

        if (activeToken) {
            fetchUser();
        }
    }, [activeToken, setUser]);

    useEffect(() => {
        const fetchAllUsers = async () => {
            try {
                const users = await getUsers();
                setAllUsers(users);
            } catch (error) {
                console.error("Error fetching all users:", error);
            }
        };

        if (activeToken) {
            fetchAllUsers();
        }
    }, [activeToken]);

    useEffect(() => {
        if (conversation.error) {
            triggerAlert(conversation.error, "error");
            conversation.clearError();
        }
    }, [conversation.error, conversation]);

    const triggerAlert = (description, type) => {
        setAlertInfo({ show: true, description, type });
        setTimeout(() => {
            setAlertInfo({ show: false, description: "", type: "" });
        }, 3000);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const handleConfirmTask = async (confirmed, updatedData = null) => {
        try {
            const response = await conversation.confirmTask(confirmed, updatedData);
            if (confirmed && response?.task) {
                triggerAlert("AI task confirmed and created successfully", "success");
            }
        } catch (error) {
            // Error is handled by the hook and shown via the useEffect
        }
    };

    const handleResetConversation = async () => {
        try {
            await conversation.resetConversation();
            triggerAlert("Conversation cleared successfully", "success");
        } catch (error) {
            // Error handled by hook
        }
    };

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return (
        <>
            <NavBar user={user} onLogout={handleLogout} />
            {alertInfo.show && (
                <div className="fixed left-1/2 top-20 z-50 flex w-[90%] -translate-x-1/2 justify-center sm:w-auto sm:min-w-[300px]">
                    <AlertBox description={alertInfo.description} type={alertInfo.type} />
                </div>
            )}
            <AssistantPage
                currentUserId={user?._id}
                users={allUsers}
                isConversationLoading={conversation.isConversationLoading}
                isSending={conversation.isSending}
                messages={conversation.messages}
                pendingTaskProposal={conversation.pendingTaskProposal}
                showUserSelection={conversation.showUserSelection}
                onConfirmTask={handleConfirmTask}
                onResetConversation={handleResetConversation}
                onSubmitMessage={conversation.sendMessage}
            />
        </>
    );
}

export default AssistantDashboard;
