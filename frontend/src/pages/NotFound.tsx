import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function NotFound() {
  const location = useLocation();
  const { user } = useAuth();
  const homeTo = user ? "/" : "/login";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="text-center max-w-md">
        <p className="text-sm font-semibold text-brand-600 uppercase tracking-wide">404</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-3 text-gray-500">
          Sorry — we couldn't find{" "}
          <code className="text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded text-sm">
            {location.pathname}
          </code>
          .
        </p>
        <Link
          to={homeTo}
          className="mt-6 inline-block bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-5 py-2 rounded-lg"
        >
          {user ? "Back to dashboard" : "Back to sign in"}
        </Link>
      </div>
    </div>
  );
}
