import TaskCard from "../components/ui/TaskCard";
const mockTasks = [
    {
        _id: "507f1f77bcf86cd799439011",
        title: "Complete project documentation",
        description: "Write comprehensive documentation for the MERN stack project including setup instructions and API endpoints",
        completed: false,
        createdAt: new Date("2026-02-15T10:30:00Z"),
        updatedAt: new Date("2026-02-15T10:30:00Z"),
        __v: 0
    },
    {
        _id: "507f1f77bcf86cd799439012",
        title: "Fix login authentication bug",
        description: "Resolve the issue with JWT token validation in the authentication middleware",
        completed: true,
        createdAt: new Date("2026-02-14T14:20:00Z"),
        updatedAt: new Date("2026-02-16T09:45:00Z"),
        __v: 0
    },
    {
        _id: "507f1f77bcf86cd799439013",
        title: "Implement task filtering",
        description: "Add functionality to filter tasks by completion status and creation date",
        completed: false,
        createdAt: new Date("2026-02-13T16:15:00Z"),
        updatedAt: new Date("2026-02-13T16:15:00Z"),
        __v: 0
    },
    {
        _id: "507f1f77bcf86cd799439014",
        title: "Update UI components",
        description: "Redesign TaskCard component with better styling and responsive layout",
        completed: false,
        createdAt: new Date("2026-02-12T11:00:00Z"),
        updatedAt: new Date("2026-02-17T13:30:00Z"),
        __v: 0
    },
    {
        _id: "507f1f77bcf86cd799439015",
        title: "Set up automated testing",
        description: "Configure Jest and React Testing Library for unit and integration tests",
        completed: true,
        createdAt: new Date("2026-02-11T08:45:00Z"),
        updatedAt: new Date("2026-02-14T12:20:00Z"),
        __v: 0
    },
    {
        _id: "507f1f77bcf86cd799439016",
        title: "Optimize database queries",
        description: "Review and optimize MongoDB queries for better performance and add proper indexing",
        completed: false,
        createdAt: new Date("2026-02-10T15:30:00Z"),
        updatedAt: new Date("2026-02-10T15:30:00Z"),
        __v: 0
    },
    {
        _id: "507f1f77bcf86cd799439017",
        title: "Add error handling",
        description: "Implement comprehensive error handling across all API endpoints and frontend components",
        completed: false,
        createdAt: new Date("2026-02-09T12:15:00Z"),
        updatedAt: new Date("2026-02-18T10:00:00Z"),
        __v: 0
    },
    {
        _id: "507f1f77bcf86cd799439018",
        title: "Create user profile page",
        description: "Design and implement a user profile page with edit functionality and avatar upload",
        completed: true,
        createdAt: new Date("2026-02-08T09:20:00Z"),
        updatedAt: new Date("2026-02-15T14:50:00Z"),
        __v: 0
    },
    {
        _id: "507f1f77bcf86cd799439019",
        title: "Deploy to production",
        description: "Set up production environment on AWS with proper CI/CD pipeline and monitoring",
        completed: false,
        createdAt: new Date("2026-02-07T17:40:00Z"),
        updatedAt: new Date("2026-02-07T17:40:00Z"),
        __v: 0
    },
    {
        _id: "507f1f77bcf86cd799439020",
        title: "Code review and refactoring",
        description: "Conduct thorough code review and refactor components for better maintainability and performance",
        completed: false,
        createdAt: new Date("2026-02-06T13:25:00Z"),
        updatedAt: new Date("2026-02-16T16:10:00Z"),
        __v: 0
    }
];

function Dashboard({tasks = mockTasks}) {
    const handleEdit = (task) => {
        console.log("Edit task:", task);
    };
    const handleDelete = (task) => {
        console.log("Delete task:", task);
    };
    const tasksExist = tasks && tasks.length > 0;
    return (
        <div className="min-h-screen bg-zinc-950 px-4 sm:px-6 lg:px-8 pt-8 pb-8">
            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                {/*Header Section*/}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-white">Tasks</h1>
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl">Add Task</button>
                </div>
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {tasksExist ? (tasks.map((task) => (
                        <TaskCard key = {task._id} task = {task} onEdit = {() => handleEdit(task)} onDelete = {() => handleDelete(task)}/>
                    ))) : (<div className = "text-white/70 text-center py-10 col-span-full">No Tasks Yet</div>)}
                    
                </div>

            </div>
        </div>
    )
}

export default Dashboard;