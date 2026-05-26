import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  // Close the mobile menu whenever the route changes
  function closeMenu() {
    setMenuOpen(false);
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium ${isActive ? "text-brand-600" : "text-gray-600 hover:text-gray-900"}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Brand + desktop links */}
          <div className="flex items-center gap-6">
            <span className="font-semibold text-brand-600 text-lg">JobTracker</span>
            <div className="hidden sm:flex items-center gap-6">
              <NavLink to="/" end className={navLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/jobs" className={navLinkClass}>
                Jobs
              </NavLink>
            </div>
          </div>

          {/* Desktop user controls */}
          <div className="hidden sm:flex items-center gap-4">
            <span className="text-sm text-gray-500 truncate max-w-[200px]">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Sign out
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="sm:hidden p-2 -mr-2 text-gray-600 hover:text-gray-900"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="sm:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-3">
              <NavLink to="/" end onClick={closeMenu} className={navLinkClass}>
                <span className="block">Dashboard</span>
              </NavLink>
              <NavLink to="/jobs" onClick={closeMenu} className={navLinkClass}>
                <span className="block">Jobs</span>
              </NavLink>
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500 truncate">{user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8" key={location.pathname}>
        <Outlet />
      </main>
    </div>
  );
}
