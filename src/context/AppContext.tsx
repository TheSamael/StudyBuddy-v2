import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { UserProfile, MoodLog } from "../types";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface AppContextType {
  user: User | { email: string; uid: string } | null;
  profile: UserProfile | null;
  theme: "light" | "dark";
  toasts: ToastMessage[];
  loading: boolean;
  showMoodModal: boolean;
  latestMood: MoodLog | null;
  setTheme: (t: "light" | "dark") => void;
  showToast: (msg: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  onboardUser: (targetExam: string, customExam: string, chibi: UserProfile["chibi"]) => Promise<void>;
  updateChibi: (chibi: UserProfile["chibi"]) => Promise<void>;
  logMood: (stress: number, anxiety: number, happiness: number, confusion: number) => Promise<void>;
  setShowMoodModal: (val: boolean) => void;
  trigger2HourSimulation: () => void;
  refreshProfile: () => Promise<void>;
  trackInteraction: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | { email: string; uid: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [latestMood, setLatestMood] = useState<MoodLog | null>(null);

  // Show a custom toast
  const showToast = (message: string, type: ToastType = "info") => {
    const id = Date.now().toString() + "_" + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    // Auto remove after 4.5 seconds
    setTimeout(() => removeToast(id), 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Toggle/Set theme (Enforces light theme only)
  const setTheme = (t: "light" | "dark") => {
    setThemeState("light");
    localStorage.setItem("studybuddy_theme", "light");
    const root = window.document.documentElement;
    root.classList.remove("dark");
  };

  // Setup interaction tracker for 2-hour idle mood interceptor
  const trackInteraction = () => {
    if (!user) return;
    localStorage.setItem("studybuddy_last_activity", Date.now().toString());
  };

  // Simulate 2-hour gap for reviewers
  const trigger2HourSimulation = () => {
    localStorage.setItem("studybuddy_last_activity", (Date.now() - 7300000).toString()); // 2 hours + 10 mins
    checkIdleSession();
  };

  // Inspect if 2 hours elapsed
  const checkIdleSession = () => {
    if (!user) return;
    const lastActivity = localStorage.getItem("studybuddy_last_activity");
    if (lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10);
      if (elapsed >= 7200000) { // 2 hours
        setShowMoodModal(true);
      }
    } else {
      // First time logging in, seed activity timestamp
      localStorage.setItem("studybuddy_last_activity", Date.now().toString());
    }
  };

  // Refresh user profile and current moods
  const refreshProfile = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/profile?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
      } else {
        setProfile(null);
      }

      // Fetch latest mood
      const moodRes = await fetch(`/api/moods?email=${encodeURIComponent(user.email)}`);
      const moodData = await moodRes.json();
      if (moodData.success && moodData.logs && moodData.logs.length > 0) {
        setLatestMood(moodData.logs[moodData.logs.length - 1]);
      } else {
        setLatestMood(null);
      }
    } catch (err) {
      console.error("Failed to load profile", err);
    }
  };

  // Trigger onboard
  const onboardUser = async (targetExam: string, customExam: string, chibi: UserProfile["chibi"]) => {
    if (!user?.email) {
      showToast("Authentication is required to complete onboarding.", "error");
      return;
    }
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          targetExam,
          customExam,
          chibi,
          onboarded: true
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setProfile(data.profile);
        showToast(`Welcome aboard! Initialized profile for ${targetExam}.`, "success");
        trackInteraction();
      } else {
        throw new Error(data.error || "Save profile request failed");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to initialize profile. Please try again.", "error");
      throw err;
    }
  };

  // Update Chibi customization
  const updateChibi = async (chibi: UserProfile["chibi"]) => {
    if (!user?.email || !profile) return;
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          chibi
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setProfile(data.profile);
        showToast("Chibi buddy updated successfully!", "success");
      }
    } catch (err: any) {
      showToast("Could not update Chibi config.", "error");
    }
  };

  // Log active 1-10 mood slider metrics
  const logMood = async (stress: number, anxiety: number, happiness: number, confusion: number) => {
    if (!user?.email) return;
    try {
      const response = await fetch("/api/moods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          stress,
          anxiety,
          happiness,
          confusion
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setLatestMood(data.log);
        setShowMoodModal(false);
        showToast("Your mood is securely logged. StudyBuddy has adjusted its coaching parameters.", "success");
        // Reset interaction timer
        localStorage.setItem("studybuddy_last_activity", Date.now().toString());
      } else {
        throw new Error(data.error || "Mood log request failed");
      }
    } catch (err: any) {
      showToast("StudyBuddy is taking a quick breather. Please try again in a moment.", "error");
    }
  };

  // Effect to sync auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((fbUser) => {
      setUser(fbUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch profile when user changes
  useEffect(() => {
    if (user) {
      refreshProfile();
      checkIdleSession();
      // Setup window activity listeners to passively update interaction time
      const handleActivity = () => {
        // Debounce simple logs
        const lastActivity = localStorage.getItem("studybuddy_last_activity");
        if (lastActivity && Date.now() - parseInt(lastActivity, 10) > 60000) {
          localStorage.setItem("studybuddy_last_activity", Date.now().toString());
        }
      };
      window.addEventListener("click", handleActivity);
      window.addEventListener("keydown", handleActivity);
      return () => {
        window.removeEventListener("click", handleActivity);
        window.removeEventListener("keydown", handleActivity);
      };
    } else {
      setProfile(null);
      setLatestMood(null);
      setShowMoodModal(false);
    }
  }, [user]);

  // Sync theme on load
  useEffect(() => {
    setTheme("light");
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        theme,
        toasts,
        loading,
        showMoodModal,
        latestMood,
        setTheme,
        showToast,
        removeToast,
        onboardUser,
        updateChibi,
        logMood,
        setShowMoodModal,
        trigger2HourSimulation,
        refreshProfile,
        trackInteraction
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
