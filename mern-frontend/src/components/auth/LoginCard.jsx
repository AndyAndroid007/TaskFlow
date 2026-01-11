function LoginCard () {
    return (
        <div className = "w-full max-w-md bg-neutral-900 rounded-2xl p-8 border border-blue-500/20 shadow-lg">
            <div className = "mb-6">
                <h2 className = "text-2xl font-semibold mb-2">Sign In</h2>
                <p className = "text-sm text-neutral-400">
                    Enter your credentials to access your account
                </p>
            </div>
            <div className = "space-y-4">
                <div>
                    <label className = "block text-sm text-neutral-300 mb-1">Email</label>
                    <div className = "h-10 rounded-lg bg-neutral-800 border border-neutral-700"/>
                </div>
                <div>
                    <label className = "block text-sm text-neutral-300 mb-1">Password</label>
                    <div className = "h-10 rounded-lg bg-neutral-800 border border-neutral-700"/>
                </div>
            </div>
            <div className = "mt-6">
                <div className = "h-10 rounded-lg bg-blue-600"/>
            </div>
        </div>
    );
}
export default LoginCard;