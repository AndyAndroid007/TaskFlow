import { useState, useEffect } from "react";
 
export default function TaskProposalCard({ proposal, currentUserId, users = [], onConfirm, disabled }) {
    const isDelete = proposal.action === "delete";
    const isUpdate = proposal.action === "update";
    const displayTask = isDelete || isUpdate ? proposal.taskData : proposal;
    
    const [isEditing, setIsEditing] = useState(false);
    const [editedProposal, setEditedProposal] = useState(displayTask);

    // Synchronize internal state with props when the proposal is refined by AI
    useEffect(() => {
        setEditedProposal(displayTask);
    }, [displayTask]);

    const handleChange = (field, value) => {
        setEditedProposal((prev) => ({ ...prev, [field]: value }));
    };

    const isPersonalTask = String(editedProposal.assignee) === String(currentUserId);

    const cardTheme = isDelete 
        ? "border-rose-400/20 bg-zinc-950/95 shadow-[0_24px_80px_rgba(244,63,94,0.15)]" 
        : "border-cyan-400/20 bg-zinc-900/95 shadow-[0_24px_80px_rgba(8,145,178,0.2)]";

    const accentColor = isDelete ? "text-rose-400" : "text-cyan-400";
    const accentBorder = isDelete ? "border-rose-400/30" : "border-cyan-400/30";
    const badgeText = isDelete ? "Confirm Deletion" : isUpdate ? "Confirm Updates" : "Awaiting confirmation";

    const renderFieldWithDiff = (label, field, currentValue, isDate = false) => {
        const originalValue = proposal.originalTask?.[field];
        const hasChanged = isUpdate && originalValue !== undefined && String(originalValue) !== String(currentValue);

        return (
            <div className="rounded-2xl border border-white/6 bg-black/30 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{label}</p>
                <div className="mt-2 space-y-1">
                    {hasChanged && !isEditing && (
                        <p className="text-[10px] text-zinc-500 line-through">
                            {isDate && originalValue 
                                ? new Date(originalValue).toISOString().split('T')[0] 
                                : (field === "assignee" 
                                    ? (String(originalValue) === String(currentUserId) ? "Personal task" : (users.find(u => String(u._id) === String(originalValue))?.name || "Assigned"))
                                    : String(originalValue || "None"))}
                        </p>
                    )}
                    {isEditing && !isDelete ? (
                        field === "priority" ? (
                            <select
                                value={currentValue}
                                onChange={(e) => handleChange(field, e.target.value)}
                                className="w-full bg-transparent text-sm font-medium text-cyan-300 outline-none"
                            >
                                <option value="Low" className="bg-zinc-900 text-white">Low</option>
                                <option value="Medium" className="bg-zinc-900 text-white">Medium</option>
                                <option value="High" className="bg-zinc-900 text-white">High</option>
                            </select>
                        ) : isDate ? (
                            <input
                                type="date"
                                value={currentValue ? new Date(currentValue).toISOString().split('T')[0] : ""}
                                onChange={(e) => handleChange(field, e.target.value)}
                                className="w-full bg-transparent text-sm font-medium text-cyan-300 outline-none [color-scheme:dark]"
                            />
                        ) : field === "assignee" ? (
                            <select
                                value={currentValue || ""}
                                onChange={(e) => handleChange(field, e.target.value)}
                                className="w-full bg-transparent text-sm font-medium text-cyan-300 outline-none"
                            >
                                <option value="" disabled className="bg-zinc-900 text-zinc-500">Select Assignee</option>
                                {users.map((user) => (
                                    <option key={user._id} value={user._id} className="bg-zinc-900 text-white">
                                        {String(user._id) === String(currentUserId) ? "Self" : (user.name || user.email)}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={Array.isArray(currentValue) ? currentValue.join(", ") : currentValue || ""}
                                onChange={(e) => handleChange(field, field === "tags" ? e.target.value.split(",").map(t => t.trim()) : e.target.value)}
                                className="w-full bg-transparent text-sm font-medium text-cyan-300 outline-none"
                                placeholder={`Enter ${label.toLowerCase()}...`}
                            />
                        )
                    ) : (
                        <p className={`text-sm font-medium ${hasChanged ? "text-emerald-400" : "text-zinc-100"}`}>
                            {field === "assignee" 
                                ? (String(currentValue) === String(currentUserId) ? "Personal task" : users.find(u => String(u._id) === String(currentValue))?.name || "Assigned")
                                : isDate && currentValue ? new Date(currentValue).toISOString().split('T')[0] : (Array.isArray(currentValue) ? (currentValue.length ? currentValue.join(", ") : "No tags") : String(currentValue || "Not specified"))}
                        </p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={`rounded-3xl border p-5 backdrop-blur-sm transition-all duration-300 ${cardTheme}`}>
            <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex-1">
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${accentColor}`}>
                        {isDelete ? "Delete Task" : isUpdate ? "Update Task" : "Pending Task Proposal"}
                    </p>
                    {isEditing && !isDelete ? (
                        <input
                            type="text"
                            value={editedProposal.title}
                            onChange={(e) => handleChange("title", e.target.value)}
                            className={`mt-3 w-full rounded-xl border bg-black/40 px-4 py-2 text-lg font-semibold text-white outline-none focus:border-opacity-60 ${accentBorder}`}
                            placeholder="Task Title"
                        />
                    ) : (
                        <div className="mt-2">
                            {isUpdate && proposal.originalTask?.title !== editedProposal.title && (
                                <p className="text-xs text-zinc-500 line-through mb-1">{proposal.originalTask?.title}</p>
                            )}
                            <h3 className={`text-xl font-semibold ${isUpdate && proposal.originalTask?.title !== editedProposal.title ? "text-emerald-400" : "text-white"}`}>
                                {editedProposal.title}
                            </h3>
                        </div>
                    )}
                </div>
                {!isEditing && (
                    <div className={`rounded-full border bg-opacity-10 px-3 py-1 text-xs font-medium ${accentBorder} ${isDelete ? "bg-rose-400 text-rose-100" : "bg-cyan-400 text-cyan-100"}`}>
                        {badgeText}
                    </div>
                )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {renderFieldWithDiff("Priority", "priority", editedProposal.priority)}
                {renderFieldWithDiff("Due Date", "dueDate", editedProposal.dueDate, true)}
                {renderFieldWithDiff("Assignment", "assignee", editedProposal.assignee)}
                {renderFieldWithDiff("Tags", "tags", editedProposal.tags)}
            </div>

            {/* Description */}
            <div className="mt-4 rounded-2xl border border-white/6 bg-black/30 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Description</p>
                <div className="mt-2 space-y-1">
                    {isUpdate && proposal.originalTask?.description !== editedProposal.description && !isEditing && (
                        <p className="text-[10px] text-zinc-500 line-through italic">
                            {proposal.originalTask?.description || "No previous description"}
                        </p>
                    )}
                    {isEditing && !isDelete ? (
                        <textarea
                            value={editedProposal.description || ""}
                            onChange={(e) => handleChange("description", e.target.value)}
                            className="min-h-[80px] w-full resize-none bg-transparent text-sm leading-6 text-zinc-200 outline-none"
                            placeholder="Task details..."
                        />
                    ) : (
                        <p className={`text-sm leading-6 line-clamp-3 ${isUpdate && proposal.originalTask?.description !== editedProposal.description ? "text-emerald-400 font-medium" : "text-zinc-200"}`}>
                            {editedProposal.description || "No description provided."}
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                    type="button"
                    onClick={() => onConfirm(true, isDelete ? null : editedProposal)}
                    disabled={disabled}
                    className={`flex-1 rounded-2xl border py-3 text-sm font-semibold transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 ${
                        isDelete 
                        ? "border-rose-400/30 bg-rose-500 text-white hover:bg-rose-400" 
                        : "border-cyan-400/30 bg-cyan-500/90 text-slate-950 hover:bg-cyan-400"
                    }`}
                >
                    {isDelete ? "Confirm Delete" : isUpdate ? "Apply Updates" : "Confirm Task"}
                </button>
                {!isDelete && (
                    <button
                        type="button"
                        onClick={() => setIsEditing(!isEditing)}
                        disabled={disabled}
                        className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                            isEditing 
                            ? "border-zinc-400/30 bg-zinc-700/50 text-white hover:bg-zinc-700" 
                            : "border-cyan-400/25 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20"
                        }`}
                    >
                        {isEditing ? "Save View" : "Edit Proposal"}
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => onConfirm(false)}
                    disabled={disabled}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
