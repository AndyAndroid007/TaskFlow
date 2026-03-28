import { useState } from "react";
import { login, signup } from "../../api/auth";
import SocialLoginButton from "../ui/SocialLoginButton";
function LoginCard({ onSuccess }) {
    const [isNewUser, setIsNewUser] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const data = isNewUser ? await signup(email, password) :
                await login(email, password);
            onSuccess(data);
            console.log("Success:", data);

            setEmail("");
            setPassword("");
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }

        console.log("Submitted Email: ", email)
        console.log("Submitted Password: ", password);
    };
    return (
        <div className="w-full max-w-md bg-neutral-900 rounded-2xl p-8 border border-blue-500/20 shadow-lg">
            <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">{isNewUser ? "SignUp" : "Login"}</h2>
                <p className="text-sm text-neutral-400">
                    Enter your credentials to access your account
                </p>
            </div>
            <form onSubmit={handleLoginSubmit}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-neutral-300 mb-1">Email</label>
                        <input type="email" className="h-10 w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm text-neutral-300 mb-1">Password</label>
                        <div className="relative w-full">
                            <input type={showPassword ? "text" : "password"} className="h-10 w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500" value={password} onChange={(e) => setPassword(e.target.value)} />
                            <button type="button" className="absolute inset-y-0 right-2 flex items-center text-neutral-400 hover:text-neutral-200 px-1" onClick={() => setShowPassword((prev) => !prev)}>{showPassword ? "🙈" : "👁"}</button>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col mt-6 items-center">
                    <button
                        type="submit"
                        className="h-10 rounded-lg bg-blue-600 hover:bg-blue-800 shadow-md w-full"
                        disabled={loading}
                    >
                        {loading ? "Please Wait..." : isNewUser ? "Sign Up" : "Login"}
                    </button>

                    {error && <p className="text-red-500 text-sm mt-2"> {error}</p>}
                </div>
            </form>
            <div className="flex flex-col items-center mt-6">
                <div className="flex items-center w-full mb-6">
                    <div className="flex-1 h-px bg-neutral-800"></div>
                    <span className="px-3 text-xs text-neutral-500 uppercase font-medium">Continue with</span>
                    <div className="flex-1 h-px bg-neutral-800"></div>
                </div>

                <div className="flex flex-wrap gap-4 items-center justify-center">
                    <SocialLoginButton provider="google" />
                    <SocialLoginButton provider="github" />
                    <SocialLoginButton provider="linkedin" />
                </div>
            </div>

            <div className="flex flex-col mt-2 items-center">
                <button className="text-sm text-blue-500 hover:text-blue-600 mt-2" onClick={() => { setIsNewUser(prev => !prev); setPassword(""); setShowPassword(false); setError(""); }}>{isNewUser ? "Already have an account? Login" : "New User? Signup first"}</button>
            </div>
        </div>
    );
}
export default LoginCard;