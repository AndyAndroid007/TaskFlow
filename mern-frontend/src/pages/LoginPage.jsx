import LoginCard from "../components/auth/LoginCard";
import { useNavigate } from "react-router-dom";
function LoginPage() {
    const navigate = useNavigate();
    const handleSuccess = (data) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        navigate("/dashboard");

    };
    const handleGoogleLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
    }
    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-950 text-white">

            {/* Title Section */}
            <div className="
      w-full lg:w-1/2
      flex items-center justify-center
      py-6 lg:py-0
      min-h-[30vh] lg:min-h-screen
      bg-gradient-to-br from-blue-600/20 to-transparent
    ">
                <div className="max-w-md text-center lg:text-left">

                    <h1 className="text-5xl sm:text-4xl lg:text-6xl font-bold tracking-tight leading-tight">
                        <span className="text-white">Task</span>
                        <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                            Flow
                        </span>
                    </h1>

                    <p className="mt-2 lg:mt-4 text-sm sm:text-base text-neutral-400">
                        Flow through your tasks effortlessly.
                    </p>

                </div>
            </div>

            {/* Login Section */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-6 pb-10 lg:pb-0">
                <LoginCard onSuccess={handleSuccess} />
            </div>

        </div>
    );
}
export default LoginPage;