import { formatDistanceToNow, isValid } from 'date-fns';

// Helper for status badge
const getStatusBadge = (status) => {
    const styles = {
        'Open': 'bg-zinc-800 text-zinc-300 border-zinc-700',
        'In Progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'In Review': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        'Completed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };

    const selectedStyle = styles[status] || styles['Open'];

    return (
        <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full border ${selectedStyle}`}>
            {status}
        </span>
    );
};

// Helper for priority indicator
const getPriorityIndicator = (priority) => {
    const styles = {
        'Low': 'bg-zinc-500',
        'Medium': 'bg-yellow-500',
        'High': 'bg-red-500'
    };
    const color = styles[priority] || 'bg-zinc-500';
    return (
        <div className="flex items-center gap-1.5" title={`Priority: ${priority}`}>
            <span className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-xs text-zinc-400 font-medium">{priority || 'Low'}</span>
        </div>
    );
};

function TaskCard({ task, onEdit, onDelete }) {
    // Fallbacks provided for new fields in case existing DB entries don't have them
    const { title, description, updatedAt, dueDate, priority = 'Low', tags = [], status = 'Open' } = task;

    // Safety check for dates
    const safeDueDate = dueDate && isValid(new Date(dueDate)) ? new Date(dueDate) : null;
    const safeUpdatedAt = updatedAt && isValid(new Date(updatedAt)) ? new Date(updatedAt) : null;

    return (
        <div
            className="group flex flex-col justify-between bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 min-h-[160px] transition duration-200 cursor-pointer hover:shadow-lg hover:shadow-black/50"
            onClick={onEdit}
        >
            <div className="flex flex-col gap-3">
                {/* 1. Header: Title and Delete Button */}
                <div className="flex justify-between items-start gap-4">
                    <h3 className="text-gray-100 font-semibold tracking-tight text-base leading-snug">
                        {title}
                    </h3>
                    <button
                        className="text-zinc-600 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        {/* CSS styled red hover icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                    </button>
                </div>

                {/* 2. Description snippet */}
                {description && (
                    <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                        {description}
                    </p>
                )}

                {/* Tags mapping */}
                {tags && tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                        {tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px] font-medium border border-zinc-700/50">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer containing Status, Date and Priority */}
            <div className="flex flex-col gap-3 mt-5 pt-4 border-t border-zinc-800/50">

                <div className="flex items-center justify-between">
                    {/* 3. Status Badge */}
                    {getStatusBadge(status)}

                    {/* 5. Priority Indicator */}
                    {getPriorityIndicator(priority)}
                </div>

                {/* 4. Date Indicator (DueDate prioritized over updatedAt) */}
                <div className="text-xs font-medium text-zinc-500 flex justify-between">
                    {safeDueDate ? (
                        <span className="text-indigo-400/80">Due {formatDistanceToNow(safeDueDate, { addSuffix: true })}</span>
                    ) : safeUpdatedAt ? (
                        <span>Updated {formatDistanceToNow(safeUpdatedAt, { addSuffix: true })}</span>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export default TaskCard;