import { useState, useEffect } from "react";
import { getConversation, sendChatMessage, confirmTaskProposal, clearConversation } from "../api/ai";

export function useAssistantConversation(activeToken) {
    const [messages, setMessages] = useState([]);
    const [pendingTaskProposal, setPendingTaskProposal] = useState(null);
    const [activeIntent, setActiveIntent] = useState(null);
    const [taskCreationState, setTaskCreationState] = useState(null);
    const [isConversationLoading, setIsConversationLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [showUserSelection, setShowUserSelection] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const hydrateConversation = async () => {
            if (!activeToken) return;
            setIsConversationLoading(true);
            try {
                const data = await getConversation();
                setMessages(data.messages || []);
                setPendingTaskProposal(data.pendingTaskProposal || null);
                setActiveIntent(data.activeIntent || null);
                setTaskCreationState(data.taskCreationState || null);
                setShowUserSelection(data.showUserSelection || false);
            } catch (err) {
                console.error("Error fetching conversation:", err);
                setError(err.message);
            } finally {
                setIsConversationLoading(false);
            }
        };
        hydrateConversation();
    }, [activeToken]);

    const appendAssistantReply = (reply) => {
        if (reply) {
            setMessages((prev) => [...prev, { role: "model", content: reply }]);
        }
    };

    const sendMessage = async (message) => {
        const trimmedMessage = message.trim();
        if (!trimmedMessage || isSending) return;

        setIsSending(true);
        setMessages((prev) => [...prev, { role: "user", content: trimmedMessage }]);

        try {
            const response = await sendChatMessage(trimmedMessage);
            setActiveIntent(response.intent || null);
            // Only replace the proposal when the server explicitly returns a new one.
            // If response.taskProposal is null during a refinement turn, keep the
            // existing card visible rather than wiping it.
            // Exception: CANCEL intent must always clear the proposal.
            if (response.intent === 'CANCEL' || (response.taskProposal !== undefined && response.taskProposal !== null)) {
                setPendingTaskProposal(response.taskProposal || null);
            }
            setShowUserSelection(response.showUserSelection || false);
            if (response.taskProposal) setTaskCreationState(null);
            appendAssistantReply(response.reply);
        } catch (err) {
            console.error("Error sending message:", err);
            setError(err.message);
            appendAssistantReply("I ran into a problem while processing that message. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    const confirmTask = async (confirmed, updatedData = null) => {
        if (!pendingTaskProposal || isSending) return null;

        setIsSending(true);
        try {
            const response = await confirmTaskProposal(confirmed, updatedData);
            setPendingTaskProposal(response.taskProposal || null);
            setActiveIntent(response.intent || null);
            setTaskCreationState(null);
            setShowUserSelection(false);
            appendAssistantReply(response.reply);
            return response;
        } catch (err) {
            console.error("Error confirming task:", err);
            setError(err.message);
            throw err;
        } finally {
            setIsSending(false);
        }
    };

    const resetConversation = async () => {
        if (isSending) return;
        setIsSending(true);
        try {
            await clearConversation();
            setMessages([]);
            setPendingTaskProposal(null);
            setActiveIntent(null);
            setTaskCreationState(null);
            setShowUserSelection(false);
        } catch (err) {
            console.error("Error clearing conversation:", err);
            setError(err.message);
            throw err;
        } finally {
            setIsSending(false);
        }
    };

    const clearError = () => setError(null);

    return {
        messages,
        pendingTaskProposal,
        activeIntent,
        taskCreationState,
        showUserSelection,
        isConversationLoading,
        isSending,
        error,
        clearError,
        sendMessage,
        confirmTask,
        resetConversation
    };
}
