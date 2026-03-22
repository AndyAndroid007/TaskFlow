import { useState } from "react";
function ExtractUserName(user) {
    return (user?.name || "").split(" ").map(word => word[0]).join("").toUpperCase().substring(0, 2) || "";

}
function UserAvatar({user}) {
    return (
        <div className="relative w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center border border-white/10 cursor-pointer hover:text-zinc-300/100 transition-colors duration-200">
            {ExtractUserName(user)}

            {user?.avatar && (
                <img src={user.avatar}
                    className="w-full h-full rounded-full object-cover absolute inset-0" alt={user.name} />
            )}
        </div>
    )
}
function NavBar({ user, onLogout }) {
    const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
    return (
        <div className="flex justify-between items-center p-4 bg-zinc-900">
            {/*Left Section*/}
            <div>
                <a className="text-lg text-zinc-300/80 font-semibold tracking-tight hover:text-zinc-300/100 cursor-pointer transition-colors duration-200">Task Dashboard</a>
            </div>
            {/*Right Section*/}
            <div className="relative">
                {/*Avatar Menu*/}
                <div className="flex items-center justify-center text-zinc-300/80 " onClick={() => setAvatarMenuOpen((prev) => !prev)}>
                    {<UserAvatar user={user}/>}
                </div>
                {/*/Dropdown Menu*/}
                {avatarMenuOpen && (
                    <div className="flex flex-col absolute right-0 mt-2 w-44 bg-zinc-800 rounded-xl border border-zinc-700">
                        <button className="w-full text-left text-white/80 text-md hover:text-white/100 px-4 py-2">Profile</button>
                        <button
                            onClick={() => { onLogout(); setAvatarMenuOpen(false); }}
                            className="w-full text-left text-red-500/80 text-md hover:text-red-500/100 px-4 py-2">
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default NavBar;