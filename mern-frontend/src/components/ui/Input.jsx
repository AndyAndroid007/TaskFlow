function Input({ type = "text", value, onChange, placeholder, disabled = false, className = "", id }) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-3 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    />
  );
}

export default Input;
