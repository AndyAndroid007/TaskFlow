import TaskCard from "../components/ui/TaskCard";

function Dashboard({ user, taskView, onTaskViewChange, tasks = [], onAdd, onEdit, onDelete }) {
    const tasksExist = tasks && tasks.length > 0;
    return (
        <div className="min-h-screen bg-zinc-950 px-4 sm:px-6 lg:px-8 pt-8 pb-8">
            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                {/*Header Section*/}
                <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-3">
                        <h1 className="text-3xl font-extrabold text-white">Tasks</h1>
                        <div className="inline-flex items-center gap-2 bg-black/20 p-1 rounded-xl border border-white/5 w-fit">
                            <button
                                onClick={() => onTaskViewChange('created')}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${taskView === 'created' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}
                            >
                                Created By You
                            </button>
                            <button
                                onClick={() => onTaskViewChange('assigned')}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${taskView === 'assigned' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}
                            >
                                Assigned To You
                            </button>
                        </div>
                    </div>
                    {taskView === 'created' && (
                        <button onClick={onAdd} className="bg-blue-500 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl">Add Task</button>
                    )}
                </div>
                <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                    {tasksExist ? (tasks.map((task) => (
                        <TaskCard
                            key={task._id}
                            task={task}
                            canDelete={String(task.userId) === String(user?._id)}
                            ownerName={String(task.userId) !== String(user?._id) ? task.ownerName : null}
                            onEdit={() => onEdit(task)}
                            onDelete={() => onDelete(task)}
                        />
                    ))) : (<div className = "text-white/70 text-center py-10 col-span-full">{taskView === 'assigned' ? 'No Tasks Assigned To You' : 'No Tasks Created Yet'}</div>)}
                    
                </div>

            </div>
        </div>
    )
}

export default Dashboard;
