import { useState } from "react";

function TaskSidedraw({ action, task, onClose }) {
    // Step 1: Create local state for the form
    const [title, setTitle] = useState(task ? task.title : "");
    const [description, setDescription] = useState(task ? task.description : "");
    const [completed, setCompleted] = useState(task ? task.completed : false);

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

            {/* Drawer */}
            <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-zinc-900 shadow-2xl z-50 flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-zinc-800">
                    <h2 className="text-xl font-semibold text-white">
                        {action === "add" ? "Add Task" : "Edit Task"}
                    </h2>
                    <button className="text-white/70 hover:text-white transition" onClick={onClose}>✕</button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4">
                    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); console.log({ title, description, completed }) }}>

                        {/* Title */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-white/80">Title</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-white/80">Description</label>
                            <textarea
                                className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {/* Completed Checkbox */}
                        <div className="flex items-center gap-2">
                            <input
                                id="completed"
                                type="checkbox"
                                checked={completed}
                                onChange={(e) => setCompleted(e.target.checked)}
                                className="hidden"
                            />
                            <label
                                htmlFor="completed"
                                className={`cursor-pointer w-5 h-5 rounded flex items-center justify-center border transition-colors duration-200 
      ${completed ? 'bg-green-500 border-green-500' : 'bg-white border-zinc-700'}`}
                            >
                                {completed && (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="white"
                                        strokeWidth={4}  // <-- thicker tick
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </label>
                            <span className="text-white/80 select-none">Completed</span>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl mt-2"
                        >
                            {action === "add" ? "Add Task" : "Save Changes"}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}

export default TaskSidedraw;