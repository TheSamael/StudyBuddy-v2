import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { signOut } from "../lib/firebase";
import { LogOut, BookOpen, Smile, Compass, FileText, Sparkles, Clock } from "lucide-react";

export default function TopNav() {
  const { user, profile, showToast, trigger2HourSimulation } = useApp();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut();
      showToast("Successfully logged out. Take care!", "success");
    } catch (err: any) {
      showToast("Could not sign out properly.", "error");
    }
  };

  const navItems = [
    { name: "Home", path: "/", icon: Compass },
    { name: "Chat", path: "/chat", icon: Smile, requiresAuth: true },
    { name: "Diarium", path: "/diarium", icon: BookOpen, requiresAuth: true },
    { name: "Materials", path: "/materials", icon: FileText, requiresAuth: true }
  ];

  return (
    <nav 
      className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 transition-colors"
      id="global-top-navbar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Brand */}
          <Link 
            to="/" 
            className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xl tracking-tight"
            id="brand-logo"
          >
            <Sparkles className="w-6 h-6 animate-pulse" />
            <span>StudyBuddy</span>
          </Link>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-1" id="desktop-nav-menu">
            {navItems.map((item) => {
              // Hide authenticated routes if user is signed out
              if (item.requiresAuth && !user) return null;

              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                  id={`nav-link-${item.name.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Action Area */}
          <div className="flex items-center gap-3" id="nav-actions-area">
            
            {/* Developer Testing Simulate button */}
            {user && (
              <button
                onClick={trigger2HourSimulation}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 hover:bg-amber-100/50 dark:hover:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold cursor-pointer transition-colors"
                title="Evaluate mood slider intercept trigger immediately"
                id="dev-simulate-idle-btn"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Simulate 2h Gap</span>
              </button>
            )}

            {/* Profile Info & Logout */}
            {user ? (
              <div className="flex items-center gap-2">
                {/* Onboarded Exam Badge */}
                {profile?.onboarded && (
                  <span 
                    className="hidden lg:inline px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200"
                    id="user-exam-badge"
                  >
                    {profile.targetExam === "Other" ? profile.customExam : profile.targetExam}
                  </span>
                )}
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-950 bg-rose-50/50 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-all flex items-center justify-center"
                  title="Sign Out"
                  id="user-logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
                id="login-cta-btn"
              >
                Sign In
              </Link>
            )}

          </div>
        </div>
      </div>

      {/* Mobile Nav Submenu bar */}
      {user && (
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95" id="mobile-bottom-nav">
          {navItems.map((item) => {
            if (item.requiresAuth && !user) return null;
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-4 py-1 text-[11px] font-bold ${
                  isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"
                }`}
                id={`mobile-nav-${item.name.toLowerCase()}`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
