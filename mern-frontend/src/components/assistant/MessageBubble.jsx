export default function MessageBubble({ message }) {
    const isUser = message.role === "user";

    // Basic markdown-like rendering for bold text and paragraphs
    const renderContent = (content) => {
        return content.split('\n').map((line, i) => {
            if (!line.trim()) return <br key={i} />;
            
            // Simple bold replacement (**text**)
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
                <p key={i} className="mb-2 last:mb-0">
                    {parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j} className="font-semibold text-cyan-100">{part.slice(2, -2)}</strong>;
                        }
                        return part;
                    })}
                </p>
            );
        });
    };

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div
                className={[
                    "max-w-[85%] rounded-2xl border px-5 py-4 shadow-lg backdrop-blur-sm",
                    isUser
                        ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-50 shadow-cyan-500/10"
                        : "border-white/8 bg-zinc-900/80 text-zinc-100 shadow-black/30",
                ].join(" ")}
            >
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em]">
                    <span className={isUser ? "text-cyan-300" : "text-blue-300"}>
                        {isUser ? "You" : "TaskFlow AI"}
                    </span>
                </div>
                <div className="text-sm leading-7">
                    {renderContent(message.content)}
                </div>
            </div>
        </div>
    );
}
