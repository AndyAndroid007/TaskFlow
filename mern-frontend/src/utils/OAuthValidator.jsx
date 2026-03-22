export const CheckOAuthToken = () => {
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get("token");

    if (token) {
        localStorage.setItem("token", token);
        window.history.replaceState({},
            document.title, window.location.pathname)
    }
}