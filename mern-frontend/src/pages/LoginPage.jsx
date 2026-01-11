import LoginCard from "../components/auth/LoginCard";
function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
            {/*Left Section*/}
            <div className="w-1/2 hidden: lg: flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600/20 to-transparent">
                <div className="max-w-md">
                    <h1 className="text-4xl font-semibold mb-4">
                        Welcome Back
                    </h1>
                    <p className="text-neutral-400">
                        Sign in to continue to your account
                    </p>
                </div>
            </div>
            <div className="w-full lg:w-1/2 flex items-center justify-center">
                <LoginCard />
            </div>
        </div>
    );
}
export default LoginPage;