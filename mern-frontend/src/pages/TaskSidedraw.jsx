import { useState, useEffect } from "react";
import { getUsers } from "../api/user";

function TaskSidedraw({ action, task, onClose, onSave, onUpdate, triggerAlert }) {
    // Form States
    const [title, setTitle] = useState(task?.title || "");
    const [description, setDescription] = useState(task?.description || "");
    const [status, setStatus] = useState(task?.status || "Open");
    const [priority, setPriority] = useState(task?.priority || "Low");
    const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
    const [assignee, setAssignee] = useState(task?.assignee || "");
    const [tags, setTags] = useState(task?.tags || []);
    const [tagInput, setTagInput] = useState("");

    // Users state
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await getUsers();
                setUsers(data);

            } catch (err) {
                console.error("Failed to fetch users", err);
            }
        };
        fetchUsers();
    }, [action, task]);

    const handleAddTag = (e) => {
        e.preventDefault();
        const trimmed = tagInput.trim();
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed]);
        }
        setTagInput("");
    };

    const handleRemoveTag = (tagToRemove) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!title.trim() || !assignee || !dueDate) {
            triggerAlert("Please fill in all mandatory fields!", "error");
            return;
        }

        const taskData = {
            title,
            description,
            status,
            priority,
            dueDate: dueDate || undefined,
            assignee,
            tags
        };

        if (action === "add") {
            onSave(taskData);
        } else {
            onUpdate(task._id, taskData);
        }
    };

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

            {/* Drawer */}
            <div className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-zinc-900 shadow-2xl z-50 flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-zinc-800">
                    <h2 className="text-xl font-semibold text-white">
                        {action === "add" ? "Add Task" : "Edit Task"}
                    </h2>
                    <button className="text-zinc-500 hover:text-white transition" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    <form id="task-form" className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>

                        {/* Title */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-white/80">Title <span className="text-red-400">*</span></label>
                            <input
                                type="text"
                                className="w-full px-3 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-colors"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-white/80">Description</label>
                            <textarea
                                className="w-full px-3 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-colors"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {/* 2-Column Grid for Status & Priority */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Status */}
                            <div className="flex flex-col gap-1.5 relative">
                                <label className="text-sm font-medium text-white/80">Status</label>
                                <div className="relative">
                                    <select
                                        className="w-full px-3 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 appearance-none pr-10"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <option value="Open">Open</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="In Review">In Review</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Priority */}
                            <div className="flex flex-col gap-1.5 relative">
                                <label className="text-sm font-medium text-white/80">Priority</label>
                                <div className="relative">
                                    <select
                                        className="w-full px-3 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 appearance-none pr-10"
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2-Column Grid for Assignee & Due Date */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Assignee */}
                            <div className="flex flex-col gap-1.5 relative">
                                <label className="text-sm font-medium text-white/80">Assignee <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <select
                                        className="w-full px-3 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 appearance-none pr-10"
                                        value={assignee}
                                        onChange={(e) => setAssignee(e.target.value)}
                                    >
                                        <option value="" disabled>Select User</option>
                                        {users.map(user => (
                                            <option key={user._id} value={user._id}>
                                                {user.name || user.email}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Due Date */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-white/80">Due Date <span className="text-red-400">*</span></label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-white/60 focus:text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-colors uppercase [color-scheme:dark]"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-white/80">Tags</label>

                            {/* Display pill array */}
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {tags.map((tag, idx) => (
                                        <div key={idx} className="flex items-center gap-1 bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md text-sm border border-zinc-700/50">
                                            <span>#{tag}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tag)}
                                                className="text-zinc-500 hover:text-red-400 transition ml-1 focus:outline-none"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add Tag Input group */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 px-3 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-colors"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddTag(e);
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddTag}
                                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg border border-blue-500 transition"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer (Submit Button) */}
                <div className="p-5 border-t border-zinc-800 bg-zinc-900">
                    <button
                        type="submit"
                        form="task-form"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-lg shadow-blue-500/20"
                    >
                        {action === "add" ? "Create Task" : "Save Changes"}
                    </button>
                </div>
            </div>
        </>
    );
}

export default TaskSidedraw;