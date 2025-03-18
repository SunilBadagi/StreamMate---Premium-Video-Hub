import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageCircle, Video, Download, LogOut, Menu, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

export default function Navigation() {
  const location = useLocation();
  const { user, signOut } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false); // ✅ Mobile menu toggle

  if (!user) return null;

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          {/* ✅ App Title */}
          <Link to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
            MyApp
          </Link>

          {/* ✅ Desktop Menu */}
          <div className="hidden sm:flex sm:space-x-6">
            <NavLink to="/chat" icon={<MessageCircle className="w-5 h-5" />} label="Chat" />
            <NavLink to="/videos" icon={<Video className="w-5 h-5" />} label="Videos" />
            <NavLink to="/downloads" icon={<Download className="w-5 h-5" />} label="Downloads" />
          </div>

          {/* ✅ Sign Out Button */}
          <button
            onClick={() => signOut()}
            className="hidden sm:flex items-center px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <LogOut className="w-5 h-5 mr-1" />
            Sign out
          </button>

          {/* ✅ Mobile Menu Button */}
          <button
            className="sm:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* ✅ Mobile Menu */}
        {menuOpen && (
          <div className="sm:hidden flex flex-col space-y-2 pt-2">
            <NavLink to="/chat" icon={<MessageCircle className="w-5 h-5" />} label="Chat" />
            <NavLink to="/videos" icon={<Video className="w-5 h-5" />} label="Videos" />
            <NavLink to="/downloads" icon={<Download className="w-5 h-5" />} label="Downloads" />
            <button
              onClick={() => signOut()}
              className="w-full text-left px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <LogOut className="w-5 h-5 mr-1 inline" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

/* ✅ Reusable NavLink Component */
function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const location = useLocation();
  return (
    <Link
      to={to}
      className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
        location.pathname === to
          ? "border-b-2 border-blue-500 text-gray-900 dark:text-white"
          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
      }`}
    >
      {icon}
      <span className="ml-1">{label}</span>
    </Link>
  );
}
