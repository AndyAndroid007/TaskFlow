function AlertBox({ description, type }) {
    const isSuccess = type === "success";
    const isWarning = type === "warning";

    const colorClasses = isSuccess
        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/10"
        : isWarning
        ? "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-amber-500/10"
        : "bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-rose-500/10";

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 ${colorClasses}`}>
            {isSuccess ? (
                <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            ) : isWarning ? (
                <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
            ) : (
                <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )}
            <p className="text-sm font-medium tracking-wide">
                {description}
            </p>
        </div>
    );
}

export default AlertBox;