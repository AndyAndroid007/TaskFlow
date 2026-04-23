import { useEffect, useRef, useState } from "react";
import { getUsers } from "../api/user";

const STARTER_PROMPTS = [
    "What should I work on today?",
    "Create a task to review the analytics dashboard",
    "Help me plan my highest-priority work for this week",
    "Create a personal reminder to follow up on deployment",
];

function MessageBubble({ message }) {
    const isUser = message.role === "user";

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div
                className={[
                    "max-w-[85%] rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-sm",
                    isUser
                        ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-50 shadow-cyan-500/10"
                        : "border-white/8 bg-zinc-900/80 text-zinc-100 shadow-black/30",
                ].join(" ")}
            >
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em]">
                    <span className={isUser ? "text-cyan-300" : "text-blue-300"}>
                        {isUser ? "You" : "TaskFlow AI"}
                    </span>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-7 text-inherit">
                    {message.content}
                </div>
            </div>
        </div>
    );
}

function QuickPromptButton({ prompt, onClick }) {
    return (
        <button
            type="button"
            onClick={() => onClick(prompt)}
            className="rounded-full border border-cyan-400/15 bg-cyan-400/8 px-4 py-2 text-sm text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-400/14"
        >
            {prompt}
        </button>
    );
}

function TaskProposalCard({ proposal, currentUserId, onConfirm, disabled }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedProposal, setEditedProposal] = useState(proposal);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await getUsers();
                setUsers(data);
            } catch (err) {
                console.error("Failed to fetch users for proposal", err);
            }
        };
        fetchUsers();
    }, []);

    const handleChange = (field, value) => {
        setEditedProposal((prev) => ({ ...prev, [field]: value }));
    };

    const isPersonalTask = String(editedProposal.assignee) === String(currentUserId);

    return (
        <div className="rounded-3xl border border-cyan-400/20 bg-zinc-900/95 p-5 shadow-[0_24px_80px_rgba(8,145,178,0.2)] backdrop-blur-sm transition-all duration-300">
            <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-400">
                        Pending Task Proposal
                    </p>
                    {isEditing ? (
                        <input
                            type="text"
                            value={editedProposal.title}
                            onChange={(e) => handleChange("title", e.target.value)}
                            className="mt-3 w-full rounded-xl border border-cyan-400/30 bg-black/40 px-4 py-2 text-lg font-semibold text-white outline-none focus:border-cyan-400/60"
                            placeholder="Task Title"
                        />
                    ) : (
                        <h3 className="mt-2 text-xl font-semibold text-white">{editedProposal.title}</h3>
                    )}
                </div>
                {!isEditing && (
                    <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                        Awaiting confirmation
                    </div>
                )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {/* Priority */}
                <div className="rounded-2xl border border-white/6 bg-black/30 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Priority</p>
                    {isEditing ? (
                        <select
                            value={editedProposal.priority}
                            onChange={(e) => handleChange("priority", e.target.value)}
                            className="mt-2 w-full bg-transparent text-sm font-medium text-cyan-300 outline-none"
                        >
                            <option value="Low" className="bg-zinc-900 text-white">Low</option>
                            <option value="Medium" className="bg-zinc-900 text-white">Medium</option>
                            <option value="High" className="bg-zinc-900 text-white">High</option>
                        </select>
                    ) : (
                        <p className="mt-2 text-sm font-medium text-zinc-100">{editedProposal.priority || "Low"}</p>
                    )}
                </div>

                {/* Due Date */}
                <div className="rounded-2xl border border-white/6 bg-black/30 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Due Date</p>
                    {isEditing ? (
                        <input
                            type="date"
                            value={editedProposal.dueDate ? new Date(editedProposal.dueDate).toISOString().split('T')[0] : ""}
                            onChange={(e) => handleChange("dueDate", e.target.value)}
                            className="mt-2 w-full bg-transparent text-sm font-medium text-cyan-300 outline-none [color-scheme:dark]"
                        />
                    ) : (
                        <p className="mt-2 text-sm font-medium text-zinc-100">{editedProposal.dueDate || "Not specified"}</p>
                    )}
                </div>

                {/* Assignment */}
                <div className="rounded-2xl border border-white/6 bg-black/30 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Assignment</p>
                    {isEditing ? (
                        <select
                            value={editedProposal.assignee || ""}
                            onChange={(e) => handleChange("assignee", e.target.value)}
                            className="mt-2 w-full bg-transparent text-sm font-medium text-cyan-300 outline-none"
                        >
                            <option value="" disabled className="bg-zinc-900 text-zinc-500">Select Assignee</option>
                            {users.map((user) => (
                                <option key={user._id} value={user._id} className="bg-zinc-900 text-white">
                                    {String(user._id) === String(currentUserId) ? "Self" : (user.name || user.email)}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <p className="mt-2 text-sm font-medium text-zinc-100">
                            {isPersonalTask ? "Personal task" : users.find(u => String(u._id) === String(editedProposal.assignee))?.name || "Assigned to teammate"}
                        </p>
                    )}
                </div>

                {/* Tags */}
                <div className="rounded-2xl border border-white/6 bg-black/30 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Tags</p>
                    {isEditing ? (
                        <input
                            type="text"
                            value={editedProposal.tags?.join(", ") || ""}
                            onChange={(e) => handleChange("tags", e.target.value.split(",").map(t => t.trim()))}
                            className="mt-2 w-full bg-transparent text-sm font-medium text-cyan-300 outline-none"
                            placeholder="Comma separated tags"
                        />
                    ) : (
                        <p className="mt-2 text-sm font-medium text-zinc-100 line-clamp-1">
                            {editedProposal.tags?.length ? editedProposal.tags.map((tag) => `#${tag}`).join(", ") : "No tags"}
                        </p>
                    )}
                </div>
            </div>

            {/* Description */}
            <div className="mt-4 rounded-2xl border border-white/6 bg-black/30 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Description</p>
                {isEditing ? (
                    <textarea
                        value={editedProposal.description || ""}
                        onChange={(e) => handleChange("description", e.target.value)}
                        className="mt-2 min-h-[80px] w-full resize-none bg-transparent text-sm leading-6 text-zinc-200 outline-none"
                        placeholder="Task details..."
                    />
                ) : (
                    <p className="mt-2 text-sm leading-6 text-zinc-200 line-clamp-3">
                        {editedProposal.description || "No description provided."}
                    </p>
                )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                    type="button"
                    onClick={() => onConfirm(true, editedProposal)}
                    disabled={disabled}
                    className="flex-1 rounded-2xl border border-cyan-400/30 bg-cyan-500/90 px-4 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Confirm Task
                </button>
                <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={disabled}
                    className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                        isEditing 
                        ? "border-zinc-400/30 bg-zinc-700/50 text-white hover:bg-zinc-700" 
                        : "border-blue-500/25 bg-blue-500/10 text-blue-200 hover:bg-blue-500/15"
                    }`}
                >
                    {isEditing ? "Save View" : "Edit Proposal"}
                </button>
                <button
                    type="button"
                    onClick={() => onConfirm(null)}
                    disabled={disabled}
                    className="flex-1 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition-all hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

function AssistantPage({
    activeIntent,
    currentUserId,
    inputValue,
    isConversationLoading,
    isSending,
    messages,
    onConfirmTask,
    onInputChange,
    onPromptClick,
    onResetConversation,
    onSubmit,
    pendingTaskProposal,
}) {
    const endRef = useRef(null);

    useEffect(() => {
        if (typeof endRef.current?.scrollIntoView === "function") {
            endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    }, [messages, pendingTaskProposal, isSending]);

    const hasMessages = messages.length > 0;

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
                <div className="rounded-[2rem] border border-white/6 bg-zinc-900/75 px-6 py-5 shadow-[0_30px_120px_rgba(2,6,23,0.65)] backdrop-blur-xl">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            {/* <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-300">
                                Phase 9 Assistant
                            </p> */}
                            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                                Chat-first task intelligence
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                                A focused AI workspace built on the same TaskFlow shell, with the conversation as the primary surface for planning, creating, and refining work.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                                {activeIntent ? activeIntent.replaceAll("_", " ") : "Ready"}
                            </div>
                            <button
                                type="button"
                                onClick={onResetConversation}
                                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-cyan-400/20 hover:bg-cyan-400/10"
                            >
                                New conversation
                            </button>
                        </div>
                    </div>
                </div>

                <div className="relative rounded-[2rem] border border-cyan-400/12 bg-zinc-900/70 shadow-[0_24px_100px_rgba(6,182,212,0.12)] backdrop-blur-xl">
                    <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/45 to-transparent" />
                    <div className="flex items-center justify-between border-b border-white/6 px-6 py-4">
                        <div>
                            <p className="text-sm font-semibold text-white">Assistant Thread</p>
                            <p className="text-xs text-zinc-500">Modern, focused, and conversation-led.</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-cyan-200">
                            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
                            <span>{isSending ? "Thinking..." : "Online"}</span>
                        </div>
                    </div>

                    <div className="no-scrollbar max-h-[65vh] min-h-[55vh] overflow-y-auto px-4 py-5 sm:px-6">
                        {isConversationLoading ? (
                            <div className="flex min-h-[48vh] items-center justify-center">
                                <div className="flex items-center gap-3 text-sm text-zinc-400">
                                    <div className="h-8 w-8 rounded-full border-2 border-cyan-400/40 border-t-cyan-300 animate-spin" />
                                    Restoring your assistant workspace...
                                </div>
                            </div>
                        ) : !hasMessages ? (
                            <div className="flex min-h-[48vh] flex-col items-center justify-center text-center">
                                {/* <div className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">
                                    Chat Center Stage
                                </div> */}
                                <h2 className="mt-5 text-4xl font-bold tracking-tight text-white">
                                    TaskFlow AI
                                </h2>
                                <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
                                    Ask what to work on, generate a new task from plain language, or refine your plan through one continuous, high-focus conversation.
                                </p>
                                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                                    {STARTER_PROMPTS.map((prompt) => (
                                        <QuickPromptButton key={prompt} prompt={prompt} onClick={onPromptClick} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
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
                                        onConfirm={onConfirmTask}
                                        disabled={isSending}
                                    />
                                )}

                                {isSending && (
                                    <div className="flex justify-start">
                                        <div className="rounded-2xl border border-cyan-400/10 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-300">
                                            TaskFlow AI is composing a response...
                                        </div>
                                    </div>
                                )}
                                <div ref={endRef} />
                            </div>
                        )}
                    </div>

                    <div className="border-t border-white/6 bg-black/10 px-4 py-4 sm:px-6">
                        <form className="space-y-3" onSubmit={onSubmit}>
                            <div className="relative overflow-hidden rounded-[1.75rem] border border-cyan-400/18 bg-zinc-950/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent" />
                                <textarea
                                    value={inputValue}
                                    onChange={(event) => onInputChange(event.target.value)}
                                    onKeyDown = {(e) => {
                                        if(e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            onSubmit(e);
                                        }
                                    }}
                                    placeholder="Message the assistant about planning, prioritization, or creating a task..."
                                    rows={3}
                                    disabled={isSending}
                                    className="min-h-28 w-full resize-none bg-transparent px-5 py-4 text-sm leading-7 text-zinc-100 outline-none placeholder:text-zinc-500"
                                />
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-wrap gap-2">
                                    {STARTER_PROMPTS.slice(0, 3).map((prompt) => (
                                        <QuickPromptButton key={prompt} prompt={prompt} onClick={onPromptClick} />
                                    ))}
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSending || !inputValue.trim()}
                                    className="rounded-2xl border border-cyan-400/25 bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSending ? "Sending..." : "Send Message"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AssistantPage;
