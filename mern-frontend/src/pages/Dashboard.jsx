import TaskCard from "../components/ui/TaskCard";

function Dashboard({tasks = [], onAdd, onEdit, onDelete}) {
    const tasksExist = tasks && tasks.length > 0;
    return (
        <div className="min-h-screen bg-zinc-950 px-4 sm:px-6 lg:px-8 pt-8 pb-8">
            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                {/*Header Section*/}
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-extrabold text-white">Tasks</h1>
                    <button onClick = {onAdd} className="bg-blue-500 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl">Add Task</button>
                </div>
                <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                    {tasksExist ? (tasks.map((task) => (
                        <TaskCard key = {task._id} task = {task} onEdit = {() => onEdit(task)} onDelete = {() => onDelete(task)}/>
                    ))) : (<div className = "text-white/70 text-center py-10 col-span-full">No Tasks Yet</div>)}
                    
                </div>

            </div>
        </div>
    )
}

export default Dashboard;