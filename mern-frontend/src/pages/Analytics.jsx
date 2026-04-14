import React from 'react';
import StatCard from '../components/ui/StatCard';

// Simple SVG Icons
const Icons = {
  Total: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  Open: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Completed: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  HighPriority: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  LowPriority: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

function Analytics({ summary }) {
  if (!summary) {
    return (
      <div className="min-h-screen bg-zinc-950 px-4 sm:px-6 lg:px-8 pt-8 pb-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate completion percentage for the ring chart
  const total = summary.TotalTasks || 0;
  const completed = summary.CompletedTasks || 0;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const dashArray = 283; // 2 * pi * r (r=45)
  const dashOffset = dashArray - (dashArray * percentage) / 100;

  return (
    <div className="min-h-screen bg-zinc-950 px-4 sm:px-6 lg:px-8 pt-8 pb-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-white">
            Analytics Overview
          </h1>
        </div>

        {/* Top Section: Progress Ring + Main Stats */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          
          {/* Main Visual: Completion Ring */}
          <div className="col-span-1 bg-zinc-900 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/5 blur-[100px] rounded-full"></div>
            <h2 className="text-zinc-400 font-medium mb-6 relative z-10 uppercase tracking-widest text-sm">Completion Rate</h2>
            <div className="relative w-48 h-48 flex items-center justify-center z-10">
              {/* Background Ring */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-zinc-800" strokeWidth="8"/>
                {/* Progress Ring with Glow effect */}
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="8"
                  strokeLinecap="round"
                  className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-all duration-1000 ease-out"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold text-white">{percentage}%</span>
                <span className="text-xs text-zinc-500 mt-1 uppercase tracking-wide">Done</span>
              </div>
            </div>
          </div>

          {/* Key Stats Grid */}
          <div className="col-span-1 lg:col-span-2 grid gap-6 grid-cols-1 sm:grid-cols-2">
            <StatCard 
              title="Total Tasks" 
              value={total} 
              icon={Icons.Total} 
              colorClass="from-blue-600 to-indigo-600" 
            />
            <StatCard 
              title="Completed Tasks" 
              value={completed} 
              icon={Icons.Completed} 
              colorClass="from-emerald-500 to-emerald-700" 
            />
            <StatCard 
              title="High Priority" 
              value={summary.HighPriorityTasks || 0} 
              icon={Icons.HighPriority} 
              colorClass="from-rose-500 to-orange-500" 
            />
            <StatCard 
              title="Open Tasks" 
              value={summary.OpenTasks || 0} 
              icon={Icons.Open} 
              colorClass="from-zinc-600 to-zinc-800" 
            />
          </div>

        </div>

      </div>
    </div>
  );
}

export default Analytics;
