import apiClient from "./apiClient";

const getConversation = async () => {
    const res = await apiClient.get("/ai/conversation");
    return res;
};

const sendChatMessage = async (message) => {
    const res = await apiClient.post("/ai/chat", { message });
    return res;
};

const confirmTaskProposal = async (confirmed, updatedData = null) => {
    const res = await apiClient.post("/ai/confirm-task", { confirmed, updatedData });
    return res;
};

const clearConversation = async () => {
    const res = await apiClient.delete("/ai/conversation");
    return res;
};

export {
    clearConversation,
    confirmTaskProposal,
    getConversation,
    sendChatMessage,
};
