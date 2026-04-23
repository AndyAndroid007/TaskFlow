import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import NavBar from "../components/ui/NavBar";
import AlertBox from "../components/ui/AlertBox";
import AssistantPage from "./AssistantPage";
import { currentUser } from "../api/auth";
import {
    clearConversation,
    confirmTaskProposal,
    getConversation,
    sendChatMessage,
} from "../api/ai";
import { CheckOAuthToken } from "../utils/OAuthValidator";

function AssistantDashboard({ user, setUser }) {
    const [messages, setMessages] = useState([]);
    const [pendingTaskProposal, setPendingTaskProposal] = useState(null);
    const [activeIntent, setActiveIntent] = useState(null);
    const [taskCreationState, setTaskCreationState] = useState(null);
    const [messageInput, setMessageInput] = useState("");
    const [isConversationLoading, setIsConversationLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [alertInfo, setAlertInfo] = useState({
        show: false,
        description: "",
        type: "",
    });
    const [activeToken, setActiveToken] = useState(localStorage.getItem("token"));

    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const tokenFromURL = new URLSearchParams(window.location.search).get("token");
    const isAuthenticated = Boolean(tokenFromURL || token);

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
        const hydrateConversation = async () => {
            setIsConversationLoading(true);
            try {
                const data = await getConversation();
                setMessages(data.messages || []);
                setPendingTaskProposal(data.pendingTaskProposal || null);
                setActiveIntent(data.activeIntent || null);
                setTaskCreationState(data.taskCreationState || null);
            } catch (error) {
                console.error("Error fetching conversation:", error);
                triggerAlert(error.message, "error");
            } finally {
                setIsConversationLoading(false);
            }
        };

        if (activeToken) {
            hydrateConversation();
        }
    }, [activeToken]);

    const triggerAlert = (description, type) => {
        setAlertInfo({
            show: true,
            description,
            type,
        });

        setTimeout(() => {
            setAlertInfo({
                show: false,
                description: "",
                type: "",
            });
        }, 3000);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const appendAssistantReply = (reply) => {
        if (!reply) {
            return;
        }

        setMessages((previous) => [
            ...previous,
            { role: "model", content: reply },
        ]);
    };

    const handleSendMessage = async (nextMessage) => {
        const trimmedMessage = nextMessage.trim();
        if (!trimmedMessage || isSending) {
            return;
        }

        setIsSending(true);
        setMessages((previous) => [
            ...previous,
            { role: "user", content: trimmedMessage },
        ]);
        setMessageInput("");

        try {
            const response = await sendChatMessage(trimmedMessage);
            setActiveIntent(response.intent || null);
            setPendingTaskProposal(response.taskProposal || null);
            if (response.taskProposal) {
                setTaskCreationState(null);
            }
            appendAssistantReply(response.reply);
        } catch (error) {
            console.error("Error sending message:", error);
            appendAssistantReply("I ran into a problem while processing that message. Please try again.");
            triggerAlert(error.message, "error");
        } finally {
            setIsSending(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        await handleSendMessage(messageInput);
    };

    const handlePromptClick = async (prompt) => {
        setMessageInput(prompt);
        await handleSendMessage(prompt);
    };

    const handleConfirmTask = async (confirmed, updatedData = null) => {
        if (!pendingTaskProposal || isSending) {
            return;
        }

        setIsSending(true);
        try {
            const response = await confirmTaskProposal(confirmed, updatedData);
            setPendingTaskProposal(response.taskProposal || null);
            setActiveIntent(response.intent || null);
            setTaskCreationState(null);
            appendAssistantReply(response.reply);

            if (confirmed && response.task) {
                triggerAlert("AI task confirmed and created successfully", "success");
            }
        } catch (error) {
            console.error("Error confirming task proposal:", error);
            triggerAlert(error.message, "error");
        } finally {
            setIsSending(false);
        }
    };

    const handleResetConversation = async () => {
        if (isSending) {
            return;
        }

        setIsSending(true);
        try {
            await clearConversation();
            setMessages([]);
            setPendingTaskProposal(null);
            setActiveIntent(null);
            setTaskCreationState(null);
            triggerAlert("Conversation cleared successfully", "success");
        } catch (error) {
            console.error("Error clearing conversation:", error);
            triggerAlert(error.message, "error");
        } finally {
            setIsSending(false);
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
                activeIntent={taskCreationState?.stage || activeIntent}
                currentUserId={user?._id}
                inputValue={messageInput}
                isConversationLoading={isConversationLoading}
                isSending={isSending}
                messages={messages}
                onConfirmTask={handleConfirmTask}
                onInputChange={setMessageInput}
                onPromptClick={handlePromptClick}
                onResetConversation={handleResetConversation}
                onSubmit={handleSubmit}
                pendingTaskProposal={pendingTaskProposal}
            />
        </>
    );
}

export default AssistantDashboard;
