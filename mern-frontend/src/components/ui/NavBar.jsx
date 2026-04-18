import { useState } from "react";
import { useNotifications } from "../../context/NotificationContext";
import { Link, useLocation } from "react-router-dom";

const ExtractUserName = (user) => (user?.name || "").split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2) || "";

function UserAvatar({ user }) {
  return (
    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10 cursor-pointer text-white/70 hover:text-white">
      {ExtractUserName(user)}
    </div>
  );
}

function NavBar({ user, onLogout }) {
  const { notifications, removeNotification, clear } = useNotifications();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex justify-between items-center p-4 bg-zinc-900 border-b border-white/5 relative">
      <div className="flex items-center gap-8">
        <h2 className="text-2xl sm:text-2xl lg:text-3xl font-bold tracking-tight leading-tight">
          <span className="text-white">Task</span>
          <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            Flow
          </span>
        </h2>
      </div>

      {/* Global Overlay to handle clicking outside */}
      {(isNotificationsOpen || avatarMenuOpen) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => { setIsNotificationsOpen(false); setAvatarMenuOpen(false); }}
        />
      )}

      <div className="flex items-center gap-4">
        {/* Navigation Links */}
        <div className="hidden sm:flex items-center gap-2 bg-black/20 p-1 rounded-xl border border-white/5 mr-2">
          <Link 
            to="/dashboard"
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${location.pathname === '/dashboard' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}
          >
            Tasks
          </Link>
          <Link 
            to="/analytics"
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${location.pathname === '/analytics' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}
          >
            Analytics
          </Link>
        </div>

        {/* Bell and Badge */}
        <div className="relative z-50">
          <div 
            className="cursor-pointer p-2 hover:bg-white/5 rounded-full transition-colors"
            onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setAvatarMenuOpen(false); }}
          >
            <svg className="w-6 h-6 text-zinc-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 bg-blue-600 text-[10px] rounded-full h-4 w-4 flex items-center justify-center border border-zinc-900 text-white font-bold">
                {notifications.length}
              </span>
            )}
          </div>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute top-12 right-0 w-80 bg-zinc-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-3 border-b border-white/10 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Notifications</span>
                {notifications.length > 0 && (
                  <button onClick={clear} className="text-[10px] text-blue-500 hover:text-blue-400 font-bold uppercase">Clear all</button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-sm italic">No notifications yet</div>
                ) : (
                  notifications.map((n, i) => (
                    <div key={i} className="group p-3 border-b border-white/5 text-sm hover:bg-white/5 flex justify-between items-start gap-4">
                      <p className="text-zinc-300 leading-snug">
                        <span className="font-bold text-white">{n.title}</span> was {n.type.split('_').pop().toLowerCase()}
                      </p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeNotification(i); }}
                        className="text-zinc-600 hover:text-white transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Menu */}
        <div className="relative z-50">
          <div data-cy="nav-avatar" onClick={() => { setAvatarMenuOpen(!avatarMenuOpen); setIsNotificationsOpen(false); }}>
            <UserAvatar user={user} />
          </div>
          {avatarMenuOpen && (
            <div className="absolute top-10 right-0 w-48 bg-zinc-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
              <button onClick={onLogout} className="w-full text-left p-3 text-sm text-red-500 hover:bg-white/5">Logout</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NavBar;
