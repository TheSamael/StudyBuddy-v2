import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Sparkles, Brain, Shield, Heart, ArrowRight, BookOpen, Compass, FileText } from "lucide-react";
import { motion } from "motion/react";

export default function Home() {
  const { user, profile } = useApp();

  const features = [
    {
      title: "Active Empathetic Chat",
      desc: "An intelligent conversational buddy that adapts its response tone dynamically depending on your logged stress, confusion, and anxiety indicators.",
      icon: Brain,
      color: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400"
    },
    {
      title: "Modular Private Diarium",
      desc: "Write journals in freeform prose, structured Markdown, or paint on an HTML5 canvas sketching pad. Gemini passively monitors entries to log helpful tips.",
      icon: BookOpen,
      color: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "The Chibi Visual Companion",
      desc: "Customize a personalized human-like SVG buddy that sits inside a cozy, softly blurred virtual room, reacting with real-time breathing, bobbing, or concerned states.",
      icon: Heart,
      color: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
    },
    {
      title: "Materials Summary Hub",
      desc: "Upload PDFs, docs, or study images to receive an elegant, non-overwhelming, bulleted visual summary, and instantly query it in back-and-forth Q&A.",
      icon: FileText,
      color: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors" id="homepage-container">
      
      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
        
        {/* Soft Background Accents */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-indigo-200/40 dark:bg-indigo-950/20 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-100/30 dark:bg-emerald-950/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="text-center space-y-6 max-w-3xl mx-auto" id="hero-header-box">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900/40 dark:text-indigo-300 text-xs font-bold"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Empathetic AI Companion for Indian Exam Aspirants</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-tight"
          >
            Your Exam Preparation. <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-400 dark:from-indigo-400 dark:to-indigo-300">
              Your Mental Wellbeing.
            </span> <br />
            Hand in Hand.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Preparing for JEE, NEET, UPSC, GATE, or CAT is a long, demanding journey. StudyBuddy offers supportive, stress-free Q&A, active mood-tracking, canvas journaling, and summarization to ensure you thrive both academically and emotionally.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            id="hero-cta-group"
          >
            {user ? (
              <Link
                to={profile?.onboarded ? "/chat" : "/onboarding"}
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-base transition-all shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 group cursor-pointer"
                id="hero-cta-workspace"
              >
                <span>Go to Workspace</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="w-full sm:w-auto px-8 py-4 border border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-base hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer flex items-center justify-center"
                  id="hero-cta-explore"
                >
                  <span>Explore StudyBuddy</span>
                </Link>
              </>
            )}
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="mt-24 md:mt-32 border-t border-slate-200 dark:border-slate-800 pt-16" id="homepage-features-grid">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Built Specifically for the Stresses of Aspirants
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto text-sm">
              We focus on minimizing cognitive load so you stay calm, concentrated, and emotionally balanced.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-6 md:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-start gap-4"
                  id={`feature-card-${idx}`}
                >
                  <div className={`p-3.5 rounded-2xl shrink-0 ${feat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {feat.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Indian Context Encouragement Banner */}
        <div className="mt-20 max-w-4xl mx-auto rounded-3xl bg-indigo-900 dark:bg-indigo-950/40 border border-indigo-800/30 p-8 md:p-12 text-center text-white space-y-4 shadow-xl" id="encouragement-banner">
          <Heart className="w-10 h-10 text-rose-400 mx-auto animate-pulse" />
          <h3 className="text-2xl font-bold tracking-tight">Your Mental Health Matters</h3>
          <p className="text-indigo-200 max-w-2xl mx-auto text-sm leading-relaxed">
            Exam scores can open doors, but they do not define your human worth. StudyBuddy is built on deep empathy, keeping your wellbeing as high a priority as your academic comprehension. Remember to breathe, stretch, and step outside.
          </p>
        </div>

      </div>
    </div>
  );
}
