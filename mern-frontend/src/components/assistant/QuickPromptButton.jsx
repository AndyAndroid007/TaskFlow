export default function QuickPromptButton({ prompt, onClick }) {
    return (
        <button
            type="button"
            onClick={() => onClick(prompt)}
            className="rounded-full border border-cyan-400/15 bg-cyan-400/8 px-4 py-2 text-sm text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-400/14"
        >
            {prompt}
        </button>
    );
}
