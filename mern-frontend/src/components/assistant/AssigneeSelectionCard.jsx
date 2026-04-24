import React from 'react';

export default function AssigneeSelectionCard({ users, currentUserId, onSelect, onCancel, disabled }) {
    // Include Self as the first option
    const currentUser = users.find(u => String(u._id) === String(currentUserId));
    const otherUsers = users.filter(u => String(u._id) !== String(currentUserId));

    return (
        <div className="rounded-3xl border border-cyan-400/20 bg-zinc-900/95 p-5 shadow-[0_24px_80px_rgba(8,145,178,0.2)] backdrop-blur-sm transition-all duration-300">
            <div className="mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-400">
                    Assign Task To
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">Select Assignee</h3>
            </div>

            <div className="no-scrollbar max-h-[280px] overflow-y-auto pr-1 space-y-2">
                {/* Self Option */}
                <button
                    onClick={() => onSelect('me')}
                    disabled={disabled}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-white/5 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 overflow-hidden rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-slate-950 font-bold border border-white/10">
                            {currentUser?.avatar ? (
                                <img 
                                    src={currentUser.avatar} 
                                    alt="Me" 
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                "ME"
                            )}
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-semibold text-white">Self (Personal Task)</p>
                            <p className="text-[10px] text-zinc-500">{currentUser?.email}</p>
                        </div>
                    </div>
                    <div className="w-5 h-5 rounded-full border border-zinc-600 group-hover:border-cyan-400 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </button>

                <div className="py-2 flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Teammates</span>
                    <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* Other Users */}
                {otherUsers.map(user => {
                    const initials = (user?.name || "").split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2) || (user?.email || "").charAt(0).toUpperCase();
                    
                    return (
                        <button
                            key={user._id}
                            onClick={() => onSelect(user.email)}
                            disabled={disabled}
                            className="w-full flex items-center justify-between p-3 rounded-2xl border border-white/5 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 overflow-hidden rounded-full border border-white/10 flex items-center justify-center bg-zinc-800">
                                    {user.avatar ? (
                                        <img 
                                            src={user.avatar} 
                                            alt={user.name || user.email} 
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-cyan-400 font-bold uppercase text-xs tracking-tighter">
                                            {initials}
                                        </div>
                                    )}
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-white">{user.name || 'User'}</p>
                                    <p className="text-[10px] text-zinc-500">{user.email}</p>
                                </div>
                            </div>
                            <div className="w-5 h-5 rounded-full border border-zinc-600 group-hover:border-cyan-400 flex items-center justify-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-6">
                <button
                    onClick={onCancel}
                    disabled={disabled}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-300 transition-all hover:bg-rose-500/10 hover:border-rose-500/25 hover:text-rose-200"
                >
                    Cancel Creation
                </button>
            </div>
        </div>
    );
}
