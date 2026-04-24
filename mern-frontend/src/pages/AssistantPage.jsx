import { useEffect, useRef, useState } from "react";
import MessageBubble from "../components/assistant/MessageBubble";
import QuickPromptButton from "../components/assistant/QuickPromptButton";
import TaskProposalCard from "../components/assistant/TaskProposalCard";
import AssigneeSelectionCard from "../components/assistant/AssigneeSelectionCard";
import ChatInputArea from "../components/assistant/ChatInputArea";

const STARTER_PROMPTS = [
    "What should I work on today?",
    "Create a task to review the analytics dashboard",
    "Help me plan my highest-priority work for this week",
    "Create a personal reminder to follow up on deployment",
];

function AssistantPage({
    currentUserId,
    users = [],
    isConversationLoading,
    isSending,
    messages,
    onConfirmTask,
    onResetConversation,
    onSubmitMessage,
    pendingTaskProposal,
    showUserSelection,
}) {
    const [inputValue, setInputValue] = useState("");
    const endRef = useRef(null);

    useEffect(() => {
        if (typeof endRef.current?.scrollIntoView === "function") {
            endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    }, [messages, pendingTaskProposal, isSending]);

    const hasMessages = messages.length > 0;

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        onSubmitMessage(inputValue);
        setInputValue("");
    };

    const handlePromptClick = (prompt) => {
        setInputValue(prompt);
        onSubmitMessage(prompt);
        setInputValue("");
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-zinc-950 px-4 pb-8 pt-8 sm:px-6 lg:px-8">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-y-10 left-0 w-px bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent" />
                <div className="absolute inset-y-10 right-0 w-px bg-gradient-to-b from-transparent via-blue-500/35 to-transparent" />
                <div className="absolute left-[-10rem] top-24 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
                <div className="absolute bottom-16 right-[-8rem] h-72 w-72 rounded-full bg-blue-600/12 blur-3xl" />
                <div className="absolute left-1/2 top-0 h-px w-[60%] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            </div>

            <div className="relative mx-auto flex max-w-6xl flex-col gap-6">
                {/* Simplified Header */}
                <div className="flex items-center justify-between rounded-[2rem] border border-white/6 bg-zinc-900/75 px-6 py-5 shadow-[0_30px_120px_rgba(2,6,23,0.65)] backdrop-blur-xl">
                    <h1 className="text-2xl font-extrabold tracking-tight text-white">
                        TaskFlow AI
                    </h1>
                    <button
                        type="button"
                        onClick={onResetConversation}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-cyan-400/20 hover:bg-cyan-400/10"
                    >
                        Reset Conversation
                    </button>
                </div>

                <div className="relative rounded-[2rem] border border-cyan-400/12 bg-zinc-900/70 shadow-[0_24px_100px_rgba(6,182,212,0.12)] backdrop-blur-xl">
                    <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/45 to-transparent" />
                    
                    <div className="no-scrollbar max-h-[70vh] min-h-[60vh] overflow-y-auto px-4 py-5 sm:px-6">
                        {isConversationLoading ? (
                            <div className="flex min-h-[48vh] items-center justify-center">
                                <div className="flex items-center gap-3 text-sm text-zinc-400">
                                    <div className="h-8 w-8 rounded-full border-2 border-cyan-400/40 border-t-cyan-300 animate-spin" />
                                    Restoring your workspace...
                                </div>
                            </div>
                        ) : !hasMessages ? (
                            <div className="flex min-h-[48vh] flex-col items-center justify-center text-center">
                                <h2 className="mt-5 text-4xl font-bold tracking-tight text-white">
                                    How can I help you today?
                                </h2>
                                <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
                                    Ask what to work on, generate a new task from plain language, or refine your plan through one continuous conversation.
                                </p>
                                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                                    {STARTER_PROMPTS.map((prompt) => (
                                        <QuickPromptButton key={prompt} prompt={prompt} onClick={handlePromptClick} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 pt-4">
                                {messages.map((message, index) => (
                                    <MessageBubble
                                        key={`${message.role}-${index}-${message.content.slice(0, 24)}`}
                                        message={message}
                                    />
                                ))}

                                {pendingTaskProposal && (
                                    <TaskProposalCard
                                        proposal={pendingTaskProposal}
                                        currentUserId={currentUserId}
                                        users={users}
                                        onConfirm={onConfirmTask}
                                        disabled={isSending}
                                    />
                                )}

                                {showUserSelection && (
                                    <AssigneeSelectionCard
                                        users={users}
                                        currentUserId={currentUserId}
                                        onSelect={(val) => onSubmitMessage(val)}
                                        onCancel={onResetConversation}
                                        disabled={isSending}
                                    />
                                )}

                                {isSending && (
                                    <div className="flex justify-start">
                                        <div className="rounded-2xl border border-cyan-400/10 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-300 animate-pulse">
                                            Thinking...
                                        </div>
                                    </div>
                                )}
                                <div ref={endRef} />
                            </div>
                        )}
                    </div>

                    <div className="border-t border-white/6 bg-black/10 px-4 py-4 sm:px-6">
                        <ChatInputArea 
                            inputValue={inputValue}
                            onInputChange={setInputValue}
                            onSubmit={handleSubmit}
                            isSending={isSending}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AssistantPage;
