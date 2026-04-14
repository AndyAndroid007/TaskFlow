import React from "react";

function StatCard({ title, value, icon, colorClass = "from-blue-500 to-blue-700" }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-white/5 p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-white/10 group">
      <div className="flex items-center justify-between z-10 relative">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-zinc-400 capitalize tracking-wider">{title}</p>
          <div className="text-4xl font-bold text-white transition-transform duration-300 group-hover:scale-105 origin-left">
            {value}
          </div>
        </div>
        <div className={`w-14 h-14 rounded-full bg-gradient-to-br flex items-center justify-center text-white shadow-lg ${colorClass}`}>
          {icon}
        </div>
      </div>
      
      {/* Decorative background glow */}
      <div className={`absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-to-br opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity ${colorClass}`}></div>
    </div>
  );
}

export default StatCard;
