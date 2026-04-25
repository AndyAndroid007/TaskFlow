import { useRef, useEffect } from 'react';

export default function ChatInputArea({ inputValue, onInputChange, onSubmit, isSending }) {
    const textareaRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [inputValue]);

    return (
        <form className="relative flex items-end gap-2 overflow-hidden rounded-[1.75rem] border border-cyan-400/18 bg-zinc-950/80 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]" onSubmit={onSubmit}>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent" />
            
            <textarea
                ref={textareaRef}
                rows={1}
                value={inputValue}
                onChange={(event) => onInputChange(event.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (inputValue.trim() && !isSending) {
                            onSubmit(e);
                        }
                    }
                }}
                placeholder="Message TaskFlow AI..."
                disabled={isSending}
                className="max-h-[150px] w-full resize-none bg-transparent py-2.5 pl-4 pr-1 text-sm leading-6 text-zinc-100 outline-none placeholder:text-zinc-500 custom-scrollbar"
            />
            
            <button
                type="submit"
                disabled={isSending || !inputValue.trim()}
                className="mb-1 mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-slate-950 transition-all hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
            >
                {isSending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent disabled:border-zinc-500 disabled:border-t-transparent" />
                ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                )}
            </button>
        </form>
    );
}
