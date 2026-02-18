import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
function TaskCard({ task, onEdit, onDelete }) {
    const { title, description, createdAt, updatedAt, completed } = task;

    const isEdited = createdAt != updatedAt;

    return (
        <div className="group relative bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 pb-16 pr-16 transition cursor-pointer" onClick={onEdit}>
            {/*Date Section*/}
            <div className="absolute bottom-2 left-5 text-xs text-white/70 space-y-1">
                <span>Created: {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
                {isEdited && (
                    <>
                    <span className = "mx-1">·</span>
                    <span>Updated: {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}</span>
                    </>
                )}
            </div>
            {/* Delete Button */}
            <button
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering onEdit
                    onDelete();
                }}
            >
                🗑️
            </button>
            {/* Badge */}
            <div className={`absolute bottom-2 right-2 px-3 py-1 text-xs font-semibold rounded-full ${completed ? 'bg-green-500 text-white/90' : 'bg-yellow-500 text-black'
                }`}>
                {completed ? 'Completed' : 'Pending'}
            </div>
            {/*Header Section*/}
            <div className="flex flex-col gap-2">
                <h3 className="text-white font-semibold tracking-tight text-base">{title}</h3>
                {description && (<p className="text-sm text-white/70 line-clamp-2">{description}</p>)}
            </div>
        </div>
    )
}

export default TaskCard;