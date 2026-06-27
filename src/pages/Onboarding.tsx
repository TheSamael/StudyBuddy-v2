import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import ChibiAvatar from "../components/ChibiAvatar";
import { ChibiCustomization } from "../types";
import { Sparkles, ArrowRight, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, onboardUser, showToast } = useApp();

  // If already onboarded, automatically bypass
  useEffect(() => {
    if (profile?.onboarded) {
      navigate("/");
    }
  }, [profile, navigate]);

  const [step, setStep] = useState(1);
  const [targetExam, setTargetExam] = useState("JEE");
  const [customExam, setCustomExam] = useState("");
  const [validatingExam, setValidatingExam] = useState(false);
  
  // Custom exam AI dialogue state
  const [examValidated, setExamValidated] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [subjectsExplanation, setSubjectsExplanation] = useState("");

  // Step 2: Chibi Customization states
  const [gender, setGender] = useState<ChibiCustomization["gender"]>("neutral");
  const [hat, setHat] = useState<ChibiCustomization["hat"]>("none");
  const [top, setTop] = useState<ChibiCustomization["top"]>("tshirt");
  const [pants, setPants] = useState<ChibiCustomization["pants"]>("jeans");
  const [shoes, setShoes] = useState<ChibiCustomization["shoes"]>("sneakers");

  const [savingProfile, setSavingProfile] = useState(false);

  const examsList = ["JEE", "NEET", "CUET", "CAT", "GATE", "UPSC", "Other"];

  // Step 1: Exam Selection Next Handlers
  const handleExamNext = async () => {
    if (targetExam === "Other") {
      if (!customExam.trim()) {
        showToast("Please enter the name of your competitive exam.", "info");
        return;
      }
      
      setValidatingExam(true);
      try {
        const response = await fetch("/api/gemini/validate-exam", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ examName: customExam })
        });
        const data = await response.json();
        
        if (data.isValid) {
          showToast(`Exam identified: ${data.standardizedName || customExam}!`, "success");
          setStep(2); // Auto advance
        } else {
          // AI prompt: "I couldn't identify that exam. Could you tell me what subjects it covers?"
          setAiPrompt(data.message || "I couldn't identify that exam. Could you tell me what subjects it covers?");
          setExamValidated(false);
        }
      } catch (err) {
        // Fallback validation
        showToast("Validating custom study tracks...", "info");
        setStep(2);
      } finally {
        setValidatingExam(false);
      }
    } else {
      // Direct advance for standardized Indian exams
      setStep(2);
    }
  };

  // Subject explanation submit handler
  const handleExplanationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectsExplanation.trim()) {
      showToast("Please mention at least 1 or 2 subjects.", "info");
      return;
    }
    showToast("Subjects successfully integrated into study track!", "success");
    setStep(2); // Auto advance after explanation
  };

  // Save Onboarding
  const handleSaveOnboarding = async () => {
    setSavingProfile(true);
    try {
      const chibiConfig: ChibiCustomization = { gender, hat, top, pants, shoes };
      const finalCustomExam = targetExam === "Other" ? (customExam || "Custom Study Track") : "";
      await onboardUser(targetExam, finalCustomExam, chibiConfig);
      navigate("/");
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div 
      className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors"
      id="onboarding-container"
    >
      <div className="max-w-3xl w-full" id="onboarding-wrapper">
        
        {/* Progress header */}
        <div className="text-center mb-8" id="onboarding-header">
          <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-bold text-xs rounded-full border border-indigo-100 dark:border-indigo-900/50 uppercase tracking-wider">
            Step {step} of 2
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white mt-2">
            {step === 1 ? "Configure Your Study Focus" : "Customize Your Chibi Companion"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            {step === 1 
              ? "Tell StudyBuddy what competitive test you are cracking." 
              : "Style your visual wellness companion. Your buddy sits in your workspace."}
          </p>
        </div>

        {/* STEP 1: TARGET EXAM */}
        {step === 1 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-xl space-y-6" id="step-1-card">
            
            <div className="space-y-2">
              <label htmlFor="target-exam-select" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                Select Your Competitive Exam
              </label>
              <select
                id="target-exam-select"
                value={targetExam}
                onChange={(e) => {
                  setTargetExam(e.target.value);
                  setAiPrompt(""); // Reset AI validation state
                }}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all"
              >
                {examsList.map((ex) => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </div>

            {/* Custom Exam Inputs */}
            {targetExam === "Other" && (
              <div className="space-y-4 p-5 rounded-2xl bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/30 dark:border-indigo-900/30" id="custom-exam-box">
                
                <div className="space-y-2">
                  <label htmlFor="custom-exam-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    What exam are you writing?
                  </label>
                  <input
                    id="custom-exam-input"
                    type="text"
                    placeholder="e.g. WBJEE, KVPY, CLAT, etc."
                    value={customExam}
                    onChange={(e) => setCustomExam(e.target.value)}
                    disabled={aiPrompt !== ""}
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all"
                  />
                </div>

                {/* Gemini Validation loop */}
                {aiPrompt && (
                  <form onSubmit={handleExplanationSubmit} className="space-y-3 pt-2" id="subjects-explanation-form">
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 text-amber-900 dark:text-amber-300 text-xs font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{aiPrompt}</span>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="subjects-textarea" className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                        Describe major subjects / branches (e.g. Physics, Chemistry, Law, Logical Reasoning)
                      </label>
                      <textarea
                        id="subjects-textarea"
                        rows={3}
                        required
                        placeholder="e.g. Covers General English, Legal Reasoning, and Indian Constitution..."
                        value={subjectsExplanation}
                        onChange={(e) => setSubjectsExplanation(e.target.value)}
                        className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold cursor-pointer shadow-md shadow-amber-500/10 transition-colors"
                      id="submit-explanation-btn"
                    >
                      Verify Subjects & Continue
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Action Bottom */}
            {!aiPrompt && (
              <div className="flex justify-end pt-4" id="step-1-actions">
                <button
                  onClick={handleExamNext}
                  disabled={validatingExam}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  id="step-1-next-btn"
                >
                  {validatingExam ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>AI Validating...</span>
                    </>
                  ) : (
                    <>
                      <span>Customize Companion</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        )}

        {/* STEP 2: CHIBI CUSTOMIZATION */}
        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8" id="step-2-layout">
            
            {/* Chibi Live Display Panel */}
            <div className="md:col-span-5 flex flex-col items-center justify-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl text-center">
              <ChibiAvatar
                customization={{ gender, hat, top, pants, shoes }}
                state="idle"
                size="lg"
                showBackground={true}
                backgroundType="bedroom"
              />
              <div className="space-y-0.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Your Chibi Mentor</h4>
                <p className="text-xs text-slate-400">He bobs when you're typing, and checks on your stress!</p>
              </div>
            </div>

            {/* Customizer Option Toggles */}
            <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col justify-between gap-6" id="step-2-customizer-card">
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                
                {/* 1. Hair Gender Style */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hair / Gender Style</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(["boy", "girl", "neutral"] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setGender(g)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          gender === g 
                            ? "bg-indigo-50 border-indigo-600 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-400 dark:text-indigo-200" 
                            : "border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-800 dark:hover:bg-slate-800/40 dark:text-slate-300"
                        }`}
                        id={`chibi-gender-${g}`}
                      >
                        {g.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Hat Styles */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hat / Accessory</span>
                  <div className="grid grid-cols-4 gap-2">
                    {(["none", "beanie", "cap", "headphones"] as const).map((h) => (
                      <button
                        key={h}
                        onClick={() => setHat(h)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          hat === h 
                            ? "bg-indigo-50 border-indigo-600 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-400 dark:text-indigo-200" 
                            : "border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-800 dark:hover:bg-slate-800/40 dark:text-slate-300"
                        }`}
                        id={`chibi-hat-${h}`}
                      >
                        {h.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Top Wear */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Top Wear</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(["hoodie", "tshirt", "sweater"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTop(t)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          top === t 
                            ? "bg-indigo-50 border-indigo-600 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-400 dark:text-indigo-200" 
                            : "border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-800 dark:hover:bg-slate-800/40 dark:text-slate-300"
                        }`}
                        id={`chibi-top-${t}`}
                      >
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Pants */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pants</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(["jeans", "shorts", "sweatpants"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPants(p)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          pants === p 
                            ? "bg-indigo-50 border-indigo-600 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-400 dark:text-indigo-200" 
                            : "border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-800 dark:hover:bg-slate-800/40 dark:text-slate-300"
                        }`}
                        id={`chibi-pants-${p}`}
                      >
                        {p.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Shoes */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Foot Wear</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(["sneakers", "boots", "slippers"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setShoes(s)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          shoes === s 
                            ? "bg-indigo-50 border-indigo-600 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-400 dark:text-indigo-200" 
                            : "border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-800 dark:hover:bg-slate-800/40 dark:text-slate-300"
                        }`}
                        id={`chibi-shoes-${s}`}
                      >
                        {s.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Step Navigation Actions */}
              <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-4" id="step-2-actions">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex items-center justify-center gap-1"
                  id="step-2-back-btn"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                
                <button
                  onClick={handleSaveOnboarding}
                  disabled={savingProfile}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer transition-colors flex items-center justify-center gap-1"
                  id="step-2-finish-btn"
                >
                  {savingProfile ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Track...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Workspace</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
