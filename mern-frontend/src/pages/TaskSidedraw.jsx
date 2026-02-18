import {useState} from 'react'

function TaskSidedraw (action, task) {
    return (
        <div className = "flex flex-col items-center p-4">
            {/* Side Draw Header */}
            <div className = "w-full flex justify-between items0center bg-zinc-900">
                <h2 className = "text-xl font-semibold text-white">{action ? "Add Task" : "Edit Task"}</h2>
                <button className = "text-white/80 hover:text-white transition" onClick = {() => console.log("close sidedraw")}>X</button>
            </div>
            {/* Side Draw Body */}
            <div className = "w-full flex flex-col gap-4 mt-4">
                <form>
                    <div className = "flex flex-col gap-1">
                        <label className = "text-sm text-white/80">Title</label>
                        <input type = "text" className = "w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value = {task ? task.title : ""} onChange={(e) => console.log("update title", e.target.value)}/>
                    </div>
                    <div className = "flex flex-col gap-1">
                        <label className = "text-sm text-white/80">Description</label>
                        <textarea className = "w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" value = {task ? task.description : ""} onChange={(e) => console.log("update description", e.target.value)}></textarea>
                    </div>
                    <button type = "submit" className = "bg-blue-500 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl mt-4">{action ? "Add Task" : "Save Changes"}</button>
                </form>
            </div>
            {/* Side Draw Footer */}
            <div className = "w-full flex justify-end items-center mt-4">
                {action ? <button onClick = {()=> console.log("Task Added Successfully!")}>Save</button> : 
                <button onClick = {()=>console.log("Task Updated Successfully!")}>Edit</button>}
            </div>
        </div>
    )
}
export default TaskSidedraw;