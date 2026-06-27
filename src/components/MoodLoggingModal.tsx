import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Sliders, Flame, Heart, RefreshCw, Sparkles, Smile } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function MoodLoggingModal() {
  const { showMoodModal, setShowMoodModal, logMood, profile } = useApp();

  const [stress, setStress] = useState(5);
  const [anxiety, setAnxiety] = useState(5);
  const [happiness, setHappiness] = useState(5);
  const [confusion, setConfusion] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  if (!showMoodModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await logMood(stress, anxiety, happiness, confusion);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const sliders = [
    {
      label: "Stress Level",
      value: stress,
      setter: setStress,
      minLabel: "Relaxed",
      maxLabel: "Overwhelmed",
      color: "from-blue-400 to-rose-400",
      accent: "text-rose-500",
      emoji: "🤯"
    },
    {
      label: "Anxiety Level",
      value: anxiety,
      setter: setAnxiety,
      minLabel: "Serene / Calm",
      maxLabel: "Panic / Racing",
      color: "from-emerald-400 to-purple-400",
      accent: "text-purple-500",
      emoji: "😰"
    },
    {
      label: "Happiness Level",
      value: happiness,
      setter: setHappiness,
      minLabel: "Sad / Empty",
      maxLabel: "Joyful / Hopeful",
      color: "from-orange-300 to-amber-500",
      accent: "text-amber-500",
      emoji: "☀️"
    },
    {
      label: "Confusion Level",
      value: confusion,
      setter: setConfusion,
      minLabel: "Crystal Clear",
      maxLabel: "Completely Lost",
      color: "from-cyan-400 to-indigo-500",
      accent: "text-indigo-500",
      emoji: "🌀"
    }
  ];

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
        id="mood-logging-modal-overlay"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden p-6 md:p-8"
          id="mood-modal-container"
        >
          {/* Header */}
          <div className="text-center mb-6" id="mood-modal-header">
            <div className="mx-auto w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-full flex items-center justify-center mb-3">
              <Smile className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Pause for a Breather, Buddy
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
              You've been studying hard or stepping away. Let's do a quick mental wellbeing check. Your feelings are completely valid here.
            </p>
          </div>

          {/* Sliders Form */}
          <form onSubmit={handleSubmit} className="space-y-6" id="mood-modal-form">
            {sliders.map((slider) => (
              <div key={slider.label} className="space-y-2" id={`slider-box-${slider.label.toLowerCase().replace(" ", "-")}`}>
                <div className="flex justify-between items-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span>{slider.emoji}</span>
                    <span>{slider.label}</span>
                  </span>
                  <span className={`text-base font-bold ${slider.accent}`}>
                    {slider.value} <span className="text-xs text-slate-400">/ 10</span>
                  </span>
                </div>

                <div className="relative">
                  {/* Slider Line Gradient Accent */}
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={slider.value}
                    onChange={(e) => slider.setter(Number(e.target.value))}
                    className="w-full h-2 rounded-lg bg-slate-100 dark:bg-slate-800 appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400 focus:outline-hidden"
                    id={`mood-range-${slider.label.toLowerCase().substring(0, 4)}`}
                  />
                </div>

                <div className="flex justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 px-1">
                  <span>{slider.minLabel}</span>
                  <span>{slider.maxLabel}</span>
                </div>
              </div>
            ))}

            {/* Note */}
            <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/30 dark:border-indigo-900/30 flex items-start gap-2.5 text-xs text-indigo-700 dark:text-indigo-300">
              <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                StudyBuddy uses these inputs to calibrate its academic responses and wellness pacing. Your stats are stored securely on your Cloud SQL profile.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2" id="mood-modal-actions">
              <button
                type="button"
                onClick={() => setShowMoodModal(false)}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                id="mood-modal-skip-btn"
              >
                Skip For Now
              </button>
              
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-md shadow-indigo-600/10 transition-colors flex items-center justify-center gap-2"
                id="mood-modal-submit-btn"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Logging...</span>
                  </>
                ) : (
                  <span>Log Wellbeing State</span>
                )}
              </button>
            </div>
          </form>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
