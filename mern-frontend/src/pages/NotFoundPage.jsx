import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-center px-6">
      <p className="text-8xl font-extrabold text-white tracking-tight">404</p>
      <h1 className="mt-4 text-2xl font-bold text-zinc-300">Page not found</h1>
      <p className="mt-2 text-sm text-zinc-500 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 transition"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}

export default NotFoundPage;
