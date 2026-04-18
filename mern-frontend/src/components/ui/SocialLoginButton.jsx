import googleLogo from '../../assets/google-logo.png';
import githubLogo from '../../assets/github-logo.png';
import linkedinLogo from '../../assets/linkedin-logo.png';

function SocialLoginButton({ provider, disabled = false }) {
    const logos = {
        google: googleLogo,
        github: githubLogo,
        linkedin: linkedinLogo
    };
    const url = `${import.meta.env.VITE_API_BASE_URL}/auth/${provider}`;
    return (
        <button
            disabled = {disabled}
            onClick={disabled ? undefined : () => window.location.href = url}
            className={`w-12 h-12 flex items-center justify-center bg-neutral-900 border border-neutral-800 rounded-xl hover:bg-neutral-800 transition-all shadow-xl ${disabled ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:scale-110'}`}
            aria-label={`Continue with ${provider}`}
        >
            <img src={logos[provider]} className="w-6 h-6" alt={provider} />
        </button>
    )
}
export default SocialLoginButton;