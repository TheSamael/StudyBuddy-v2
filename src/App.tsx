import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import TopNav from "./components/TopNav";
import MoodLoggingModal from "./components/MoodLoggingModal";
import CustomToastContainer from "./components/CustomToast";

// Pages
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Diarium from "./pages/Diarium";
import Chat from "./pages/Chat";
import Materials from "./pages/Materials";

export default function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
          
          {/* Top Navbar */}
          <TopNav />

          {/* Main Routing Stage */}
          <main className="flex-1" id="app-main-view">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/diarium" element={<Diarium />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/materials" element={<Materials />} />
            </Routes>
          </main>

          {/* Persistent global dialogs and notification structures */}
          <MoodLoggingModal />
          <CustomToastContainer />

        </div>
      </Router>
    </AppProvider>
  );
}
