export default function QuickPromptButton({ prompt, onClick }) {
    return (
        <button
            type="button"
            onClick={() => onClick(prompt)}
            className="rounded-2xl border border-cyan-400/10 bg-zinc-900/40 px-5 py-4 text-left text-sm font-medium text-cyan-50/80 shadow-lg shadow-black/20 transition-all hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-zinc-800/60 hover:text-white hover:shadow-cyan-400/5 group"
        >
            <div className="flex flex-col gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400 transition-colors group-hover:bg-cyan-400/20">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <div className="flex items-center justify-between">
                    <span className="leading-snug">{prompt}</span>
                    <svg className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </div>
            </div>
        </button>
    );
}
