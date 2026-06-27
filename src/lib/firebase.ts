import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword as fbSignIn, 
  createUserWithEmailAndPassword as fbSignUp, 
  signOut as fbSignOut, 
  sendPasswordResetEmail as fbPasswordReset,
  onAuthStateChanged as fbOnAuthChange,
  Auth,
  User
} from "firebase/auth";

// Standard Firebase config - defaults to empty or environment variables
const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || "",
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || ""
};

let app;
let auth: Auth;
let isMock = false;

// Mock listeners list for simulation mode
let mockListeners: ((user: any) => void)[] = [];

// Helper to get simulated user from local storage safely
const getSavedMockUser = () => {
  try {
    const saved = localStorage.getItem("studybuddy_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

// Listen to storage events to keep other tabs synced in mock mode
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "studybuddy_user") {
      const u = getSavedMockUser();
      mockListeners.forEach(cb => cb(u));
    }
  });
}

// Helper to notify active listeners in current tab immediately
function notifyMockListeners(u: any) {
  if (isMock) {
    mockListeners.forEach(cb => {
      try {
        cb(u);
      } catch (err) {
        console.error("Error in mock auth listener:", err);
      }
    });
  }
}

// If API key is missing, fall back to mock Auth system for sandboxed safety
if (!firebaseConfig.apiKey) {
  console.warn("VITE_FIREBASE_API_KEY not found. Falling back to localized secure simulation auth.");
  isMock = true;
  
  // Dummy Auth interface mimicking Firebase Auth
  auth = {
    get currentUser() {
      return getSavedMockUser();
    },
    onAuthStateChanged: (callback: any) => {
      mockListeners.push(callback);
      // Immediately invoke with the initial/current state
      callback(getSavedMockUser());
      return () => {
        mockListeners = mockListeners.filter(l => l !== callback);
      };
    }
  } as unknown as Auth;
} else {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
}

// Wrapper auth operations with detailed error interceptors
export { auth, isMock };

export async function signInWithEmailAndPassword(email: string, pass: string): Promise<User | any> {
  if (isMock) {
    if (pass.length < 6) throw new Error("auth/weak-password");
    const mockUser = { email, uid: "mock_user_" + btoa(email) };
    localStorage.setItem("studybuddy_user", JSON.stringify(mockUser));
    notifyMockListeners(mockUser);
    return mockUser;
  }
  return fbSignIn(auth, email, pass).then(res => res.user);
}

export async function createUserWithEmailAndPassword(email: string, pass: string): Promise<User | any> {
  if (isMock) {
    if (pass.length < 8) throw new Error("auth/weak-password");
    const mockUser = { email, uid: "mock_user_" + btoa(email) };
    localStorage.setItem("studybuddy_user", JSON.stringify(mockUser));
    notifyMockListeners(mockUser);
    return mockUser;
  }
  return fbSignUp(auth, email, pass).then(res => res.user);
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  if (isMock) {
    console.log("Mock password reset email successfully dispatched to:", email);
    return Promise.resolve();
  }
  return fbPasswordReset(auth, email);
}

export async function signOut(): Promise<void> {
  if (isMock) {
    localStorage.removeItem("studybuddy_user");
    notifyMockListeners(null);
    window.location.reload();
    return Promise.resolve();
  }
  return fbSignOut(auth);
}
