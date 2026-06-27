import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, isMock } from "../lib/firebase";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Check, X, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

export default function Auth() {
  const navigate = useNavigate();
  const { user, showToast, refreshProfile } = useApp();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password checklist rules
  const [hasEightChars, setHasEightChars] = useState(false);
  const [hasUppercase, setHasUppercase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecialChar, setHasSpecialChar] = useState(false);

  // Sync checklist when password changes
  useEffect(() => {
    setHasEightChars(password.length >= 8);
    setHasUppercase(/[A-Z]/.test(password));
    setHasNumber(/[0-9]/.test(password));
    setHasSpecialChar(/[^A-Za-z0-9]/.test(password));
  }, [password]);

  // If user is already logged in, redirect them to home or onboarding
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!email || !password) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    if (isSignUp) {
      // Validate confirm password
      if (password !== confirmPassword) {
        showToast("Passwords do not match.", "error");
        return;
      }

      // Check checklist criteria
      if (!hasEightChars || !hasUppercase || !hasNumber || !hasSpecialChar) {
        showToast("Password must fulfill all requirements.", "error");
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(email, password);
        showToast("Account successfully created! Let's get onboarded.", "success");
        navigate("/onboarding");
      } else {
        await signInWithEmailAndPassword(email, password);
        showToast("Welcome back to StudyBuddy!", "success");
        // Pull profile
        await refreshProfile();
        navigate("/");
      }
    } catch (err: any) {
      console.error("Auth process failed", err);
      let errorMsg = "Authentication failed. Please verify credentials.";
      
      // Map standard firebase codes to comforting, readable text
      if (err.message) {
        if (err.message.includes("auth/user-not-found") || err.message.includes("auth/wrong-password") || err.message.includes("auth/invalid-credential")) {
          errorMsg = "We couldn't find a student account matching those credentials. Double check spelling!";
        } else if (err.message.includes("auth/email-already-in-use")) {
          errorMsg = "This email is already registered. If it belongs to you, try Signing In instead!";
        } else if (err.message.includes("auth/weak-password")) {
          errorMsg = "The password is too simple. Please choose a safer password!";
        } else if (err.message.includes("auth/invalid-email")) {
          errorMsg = "The email format is invalid. Please type a valid address.";
        }
      }
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showToast("Please enter your email address first so we can dispatch a reset link.", "info");
      return;
    }
    try {
      await sendPasswordResetEmail(email);
      showToast(`A secure password reset link was dispatched to: ${email}`, "success");
    } catch (err: any) {
      showToast("Failed to initiate password reset. Double check your email address.", "error");
    }
  };

  return (
    <div 
      className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors"
      id="auth-page-container"
    >
      <div className="max-w-md w-full mx-auto space-y-6">
        
        {/* Banner Card */}
        <div className="text-center" id="auth-header">
          <h2 className="text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            {isSignUp ? "Begin Your Calm Journey" : "Welcome Back, Buddy"}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {isSignUp 
              ? "Create your account to start customized exam preparation." 
              : "Rejoin your personalized workspace and check your wellbeing."}
          </p>
        </div>

        {/* Authentication Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 md:p-8" id="auth-card">
          
          {/* Explicit Warning Callout */}
          <div className="p-3.5 mb-6 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-xs text-amber-800 dark:text-amber-300 font-semibold" id="auth-notice-callout">
            ⚠️ Please ensure you provide a valid and accessible email address.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" id="auth-form">
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="e.g. rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    id="forgot-password-link"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-hidden transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                  id="password-visibility-btn"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (only for Sign Up) */}
            {isSignUp && (
              <div>
                <label htmlFor="confirm-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-hidden transition-all"
                  />
                </div>
              </div>
            )}

            {/* Password Validation Checklist (only for Sign Up) */}
            {isSignUp && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 text-xs space-y-2 mt-2" id="password-checklist">
                <p className="font-bold text-slate-600 dark:text-slate-400 mb-2">Password Requirements:</p>
                
                <div className="flex items-center gap-2" id="rule-length">
                  <span className={`p-0.5 rounded-full ${hasEightChars ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600" : "bg-slate-200 dark:bg-slate-800 text-slate-400"}`}>
                    <Check className="w-3 h-3" />
                  </span>
                  <span className={hasEightChars ? "text-emerald-700 dark:text-emerald-300 font-medium" : "text-slate-500"}>
                    At least 8 characters
                  </span>
                </div>

                <div className="flex items-center gap-2" id="rule-uppercase">
                  <span className={`p-0.5 rounded-full ${hasUppercase ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600" : "bg-slate-200 dark:bg-slate-800 text-slate-400"}`}>
                    <Check className="w-3 h-3" />
                  </span>
                  <span className={hasUppercase ? "text-emerald-700 dark:text-emerald-300 font-medium" : "text-slate-500"}>
                    At least 1 uppercase letter (A-Z)
                  </span>
                </div>

                <div className="flex items-center gap-2" id="rule-number">
                  <span className={`p-0.5 rounded-full ${hasNumber ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600" : "bg-slate-200 dark:bg-slate-800 text-slate-400"}`}>
                    <Check className="w-3 h-3" />
                  </span>
                  <span className={hasNumber ? "text-emerald-700 dark:text-emerald-300 font-medium" : "text-slate-500"}>
                    At least 1 numerical digit (0-9)
                  </span>
                </div>

                <div className="flex items-center gap-2" id="rule-special">
                  <span className={`p-0.5 rounded-full ${hasSpecialChar ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600" : "bg-slate-200 dark:bg-slate-800 text-slate-400"}`}>
                    <Check className="w-3 h-3" />
                  </span>
                  <span className={hasSpecialChar ? "text-emerald-700 dark:text-emerald-300 font-medium" : "text-slate-500"}>
                    At least 1 special character (e.g. ! @ # $ % & *)
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/15 cursor-pointer transition-colors flex items-center justify-center gap-2 mt-4"
              id="auth-submit-btn"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{isSignUp ? "Create Student Profile" : "Sign In to Companion"}</span>
              )}
            </button>
          </form>

          {/* Toggle link */}
          <div className="text-center mt-6 border-t border-slate-100 dark:border-slate-800 pt-4" id="auth-toggle-box">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setPassword("");
                setConfirmPassword("");
              }}
              className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
              id="auth-mode-toggle"
            >
              {isSignUp 
                ? "Already have an account? Sign In" 
                : "Need an account? Sign Up for free"}
            </button>
          </div>

          {/* Simulated Mode Indicator */}
          {isMock && (
            <div className="text-center mt-4 text-[10px] font-bold text-slate-400 dark:text-slate-500">
              ⚡ Running in Secure Sandboxed Local Mode (Credentials Simulated)
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
