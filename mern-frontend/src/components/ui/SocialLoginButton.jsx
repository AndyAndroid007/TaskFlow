function SocialLoginButton({ provider, disabled = false }) {
    const logos = {
        google: "https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png",
        github: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
        linkedin: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png",
        discord: "https://cdn.prod.website-files.com/6257adef93867e3c84519eb1/625744017ab25a81ca756d73_icon_clyde_blurple_RGB.png"
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