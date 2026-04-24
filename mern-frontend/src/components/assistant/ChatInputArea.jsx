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
        <form className="space-y-3" onSubmit={onSubmit}>
            <div className="relative overflow-hidden rounded-[1.75rem] border border-cyan-400/18 bg-zinc-950/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent" />
                <textarea
                    ref={textareaRef}
                    rows={2}
                    value={inputValue}
                    onChange={(event) => onInputChange(event.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            onSubmit(e);
                        }
                    }}
                    placeholder="Message TaskFlow AI about planning, prioritization, or creating a task..."
                    disabled={isSending}
                    className="w-full resize-none bg-transparent px-5 py-4 text-sm leading-7 text-zinc-100 outline-none placeholder:text-zinc-500"
                />
            </div>
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isSending || !inputValue.trim()}
                    className="rounded-2xl border border-cyan-400/25 bg-gradient-to-r from-cyan-400 to-cyan-500 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSending ? "Sending..." : "Send Message"}
                </button>
            </div>
        </form>
    );
}
