import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { 
  BookOpen, 
  FileText, 
  Eye, 
  Paintbrush, 
  Plus, 
  Save, 
  Sparkles, 
  Eraser, 
  Trash2, 
  AlertTriangle, 
  MessageCircle, 
  CheckCircle,
  Clock,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface JournalListEntry {
  id: string;
  timestamp: string;
  title: string;
  content: string;
  mode: "notepad" | "markdown" | "drawing";
  drawingData?: string;
}

export default function Diarium() {
  const navigate = useNavigate();
  const { user, profile, showToast, trackInteraction } = useApp();

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // View States
  const [journals, setJournals] = useState<JournalListEntry[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [crisisAlert, setCrisisAlert] = useState<any>(null);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<"notepad" | "markdown" | "drawing">("notepad");
  const [selectedEntry, setSelectedEntry] = useState<JournalListEntry | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [observing, setObserving] = useState(false);

  // Drawing Canvas States & Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#2C3E50"); // Charcoal default
  const [drawSize, setDrawSize] = useState(4);
  const [drawTool, setDrawTool] = useState<"pencil" | "crayon" | "eraser">("pencil");

  // Calming colors palette
  const colorsPalette = [
    { value: "#2C3E50", name: "Charcoal" },
    { value: "#4D96FF", name: "Sky Blue" },
    { value: "#6BCB77", name: "Emerald" },
    { value: "#FF6B6B", name: "Sunset" },
    { value: "#FFD93D", name: "Mustard" },
    { value: "#8F7BFF", name: "Pastel Purple" }
  ];

  // Load Journals from server
  const fetchJournals = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/journals?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setJournals(data.list.reverse()); // latest first
        setSuggestions(data.suggestions);
        if (data.crisisAlert && data.crisisAlert.length > 0) {
          setCrisisAlert(data.crisisAlert[data.crisisAlert.length - 1]);
        } else {
          setCrisisAlert(null);
        }
      }
    } catch (err) {
      console.error("Could not load journals", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchJournals();
    }
  }, [user]);

  // HTML5 Canvas Drawing setup & handlers
  useEffect(() => {
    if (mode === "drawing" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        // Fill canvas white initially
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [mode]);

  // Canvas Mouse Coordinates Helper
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    // Check if touch event
    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Prevent scrolling on mobile touches
    if (e.cancelable) e.preventDefault();

    const ctx = canvas.getContext("2d");
    const { x, y } = getCoordinates(e);
    
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      // Calibrate tool drawing properties
      if (drawTool === "eraser") {
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 24;
        ctx.globalAlpha = 1.0;
      } else if (drawTool === "crayon") {
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = drawSize * 2.5;
        ctx.globalAlpha = 0.35; // Crayon textured soft opacity
      } else {
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = drawSize;
        ctx.globalAlpha = 1.0; // Pencil solid
      }
      
      setIsDrawing(true);
      trackInteraction();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    if (e.cancelable) e.preventDefault();

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      showToast("Drawing board cleared.", "info");
    }
  };

  // Submit/Save Journal Entry
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    if (!title.trim()) {
      showToast("Please enter a title for your journal entry.", "info");
      return;
    }

    let drawingDataUrl = "";
    if (mode === "drawing" && canvasRef.current) {
      drawingDataUrl = canvasRef.current.toDataURL("image/png");
    } else if (mode !== "drawing" && !content.trim()) {
      showToast("Please write some content before saving.", "info");
      return;
    }

    setSaving(true);
    try {
      // 1. Save entry to db
      const response = await fetch("/api/journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          title,
          content: mode === "drawing" ? "Sketch Entry" : content,
          mode,
          drawingData: drawingDataUrl || null
        })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        showToast("Journal entry securely archived in Cloud SQL replica.", "success");
        
        // 2. Run passive AI observation asynchronously on content
        if (mode !== "drawing" && content.trim().length > 10) {
          setObserving(true);
          const aiRes = await fetch("/api/gemini/journal-observe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              content
            })
          });
          const aiData = await aiRes.json();
          if (aiRes.ok) {
            setSuggestions(aiData.suggestions || []);
            if (aiData.crisisAlert && aiData.crisisAlert.active) {
              setCrisisAlert({
                active: true,
                message: aiData.crisisAlert.message
              });
              showToast("🚨 StudyBuddy detected high stress. SOS notification dispatched.", "info");
            } else {
              showToast("StudyBuddy read your journal and updated study recommendations.", "success");
            }
          }
        }
        
        // Clear inputs
        setTitle("");
        setContent("");
        if (canvasRef.current) clearCanvas();
        
        // Reload list
        await fetchJournals();
      } else {
        throw new Error(data.error || "Save journal entry failed");
      }
    } catch (err: any) {
      showToast("StudyBuddy is taking a quick breather. Please try again in a moment.", "error");
    } finally {
      setSaving(false);
      setObserving(false);
    }
  };

  // Helper to format date cleanly
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors py-8 px-4 sm:px-6 lg:px-8" id="diarium-page-container">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: ACTIVE EDITOR & SELECTOR */}
        <div className="lg:col-span-8 space-y-6" id="editor-column">
          
          {/* Header & Modes Toggles */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm" id="editor-header">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Personal Diarium</span>
            </h2>

            {/* Mode selection group */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800/50" id="mode-tabs">
              {(["notepad", "markdown", "drawing"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setSelectedEntry(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    mode === m
                      ? "bg-white text-slate-950 shadow-xs dark:bg-slate-900 dark:text-white"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                  id={`mode-btn-${m}`}
                >
                  {m === "drawing" ? "Drawing Board" : m}
                </button>
              ))}
            </div>
          </div>

          {/* ACTIVE DIARY CREATOR FORM */}
          {!selectedEntry ? (
            <form onSubmit={handleSaveEntry} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-4" id="journal-create-form">
              
              {/* Title input */}
              <div className="space-y-1">
                <input
                  type="text"
                  required
                  placeholder="Give this entry an emotional title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-lg font-bold border-b border-slate-100 dark:border-slate-800 py-2 focus:border-indigo-500 outline-hidden bg-transparent text-slate-950 dark:text-white transition-colors"
                  id="journal-title-input"
                />
              </div>

              {/* notepad mode */}
              {mode === "notepad" && (
                <div id="notepad-text-box">
                  <textarea
                    rows={12}
                    required
                    placeholder="Write your heart out. Study Buddy passively reads this to suggest wellness actions, keeping details 100% confidential."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-4 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden outline-hidden transition-all resize-none font-sans"
                    id="journal-content-notepad"
                  />
                </div>
              )}

              {/* markdown split-view mode */}
              {mode === "markdown" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[300px]" id="markdown-split-panel">
                  {/* Editor */}
                  <textarea
                    required
                    placeholder="# My Study Day&#10;Use headings and lists to map your schedule...&#10;* **Physics:** Solved 20 HC Verma questions&#10;* **Mindset:** Feeling a bit anxious about mock test tomorrow..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-full p-3 border border-slate-100 dark:border-slate-800 rounded-xl text-xs bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden transition-all resize-none font-mono"
                    id="journal-content-md-edit"
                  />
                  {/* Previewer */}
                  <div className="w-full h-full p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/20 dark:bg-slate-950/20 text-xs overflow-y-auto font-sans" id="markdown-preview-pane">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-2">Live Markdown Output</span>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 space-y-2">
                      {content ? (
                        content.split("\n").map((line, idx) => {
                          if (line.startsWith("# ")) {
                            return <h1 key={idx} className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">{line.slice(2)}</h1>;
                          } else if (line.startsWith("## ")) {
                            return <h2 key={idx} className="text-base font-bold text-slate-900 dark:text-white mt-1">{line.slice(3)}</h2>;
                          } else if (line.startsWith("* ") || line.startsWith("- ")) {
                            return <li key={idx} className="list-disc ml-4">{line.slice(2)}</li>;
                          } else if (line.trim().length === 0) {
                            return <div key={idx} className="h-2"></div>;
                          } else {
                            return <p key={idx}>{line}</p>;
                          }
                        })
                      ) : (
                        <p className="italic text-slate-400">Formatted markdown preview will appear here...</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* drawing board canvas mode */}
              {mode === "drawing" && (
                <div className="space-y-4" id="canvas-sketch-panel">
                  {/* Canvas Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-800/50" id="canvas-toolbar">
                    
                    {/* Tool Picker */}
                    <div className="flex items-center gap-1.5" id="canvas-tool-selector">
                      <button
                        type="button"
                        onClick={() => setDrawTool("pencil")}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          drawTool === "pencil" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-xs" : "text-slate-500"
                        }`}
                        title="Pencil Brush"
                        id="tool-pencil"
                      >
                        <Paintbrush className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDrawTool("crayon")}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          drawTool === "crayon" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-xs" : "text-slate-500"
                        }`}
                        title="Textured Crayon Brush"
                        id="tool-crayon"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDrawTool("eraser")}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          drawTool === "eraser" ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-xs" : "text-slate-500"
                        }`}
                        title="Rubber Eraser"
                        id="tool-eraser"
                      >
                        <Eraser className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Color Swatches */}
                    {drawTool !== "eraser" && (
                      <div className="flex items-center gap-1.5" id="canvas-swatch-list">
                        {colorsPalette.map((col) => (
                          <button
                            key={col.value}
                            type="button"
                            onClick={() => setDrawColor(col.value)}
                            className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                              drawColor === col.value 
                                ? "scale-115 ring-2 ring-indigo-500 border-white" 
                                : "border-slate-300 dark:border-slate-700 hover:scale-105"
                            }`}
                            style={{ backgroundColor: col.value }}
                            title={col.name}
                            id={`swatch-${col.name.toLowerCase()}`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Thickness Slider */}
                    {drawTool !== "eraser" && (
                      <div className="flex items-center gap-2" id="canvas-thickness-adjust">
                        <span className="text-[10px] font-bold text-slate-400">Size:</span>
                        <input
                          type="range"
                          min="2"
                          max="16"
                          value={drawSize}
                          onChange={(e) => setDrawSize(Number(e.target.value))}
                          className="w-16 h-1 rounded-full appearance-none cursor-pointer bg-slate-300 dark:bg-slate-800 accent-indigo-600"
                        />
                        <span className="text-[10px] font-bold text-slate-500 w-4">{drawSize}px</span>
                      </div>
                    )}

                    {/* Clear Canvas */}
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 text-slate-500 hover:text-rose-600 cursor-pointer transition-colors"
                      title="Clear sketchbook board"
                      id="clear-canvas-btn"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                  </div>

                  {/* HTML5 Canvas Element Wrapper */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white shadow-inner flex justify-center">
                    <canvas
                      ref={canvasRef}
                      width={640}
                      height={340}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="cursor-crosshair max-w-full bg-white transition-opacity"
                      id="html5-journal-canvas"
                    />
                  </div>
                </div>
              )}

              {/* Submit panel */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4" id="journal-submit-area">
                <p className="text-xs text-slate-400 italic">
                  * Passive AI observation occurs automatically upon saving.
                </p>
                <button
                  type="submit"
                  disabled={saving || observing}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  id="save-journal-btn"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving to Cloud SQL...</span>
                    </>
                  ) : observing ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
                      <span>AI Reading Entry...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Lock & Log Entry</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          ) : (
            /* DETAILED RETRO JOURNAL VIEW */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6" id="journal-details-card">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDate(selectedEntry.timestamp)}</span>
                  </span>
                  <h3 className="text-2xl font-extrabold text-slate-950 dark:text-white leading-tight">
                    {selectedEntry.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                  id="close-entry-btn"
                >
                  Write New Entry
                </button>
              </div>

              {/* Content output */}
              {selectedEntry.mode === "drawing" && selectedEntry.drawingData ? (
                <div className="flex justify-center border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 max-h-[400px]">
                  <img
                    src={selectedEntry.drawingData}
                    alt={selectedEntry.title}
                    className="rounded-xl border max-w-full max-h-[350px] shadow-sm bg-white"
                  />
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed space-y-4 whitespace-pre-wrap text-sm font-sans">
                  {selectedEntry.content}
                </div>
              )}
            </div>
          )}

          {/* HISTORICAL ENTRIES TIMELINE GRID */}
          <div className="space-y-3" id="journal-timeline-section">
            <h3 className="text-base font-extrabold text-slate-950 dark:text-white">Your Past Stored Journals</h3>
            {journals.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center text-slate-400 text-sm">
                No past logs found. Write your first entry above!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="timeline-grid">
                {journals.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => {
                      setSelectedEntry(entry);
                      // Set modes dynamically to preview appropriately
                      setMode(entry.mode);
                    }}
                    className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 ${
                      selectedEntry?.id === entry.id
                        ? "bg-indigo-50/50 border-indigo-400 dark:bg-indigo-950/20 dark:border-indigo-500"
                        : "bg-white border-slate-200/60 hover:border-slate-300 hover:shadow-md dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700"
                    }`}
                    id={`diary-card-${entry.id}`}
                  >
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mb-1">
                      {formatDate(entry.timestamp)}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                      {entry.title}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-2">
                      {entry.mode === "drawing" ? "🎨 [Sketchpad drawing]" : entry.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: AI OBSERVER & WELLBEING INTERVENTIONS */}
        <div className="lg:col-span-4 space-y-6" id="ai-sidebar">
          
          {/* Active Crisis SOS alert display */}
          <AnimatePresence>
            {crisisAlert && crisisAlert.active && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-rose-50 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900 text-rose-900 dark:text-rose-100 p-6 rounded-3xl space-y-4 shadow-lg text-center"
                id="crisis-alert-panel"
              >
                <div className="mx-auto w-10 h-10 bg-rose-100 dark:bg-rose-900/50 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 animate-pulse" />
                </div>
                <h3 className="text-base font-bold tracking-tight">Heavy Stress Detected</h3>
                <p className="text-xs leading-relaxed text-rose-700 dark:text-rose-300">
                  {crisisAlert.message || "We can tell you're carrying a huge weight today. You do not have to walk this path alone."}
                </p>
                <button
                  onClick={() => navigate("/chat")}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-md shadow-rose-600/10 flex items-center justify-center gap-2"
                  id="crisis-talk-btn"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Talk to Me</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* STUDY SUGGESTIONS PANEL */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4" id="ai-observer-card">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              <div>
                <h3 className="font-extrabold text-slate-950 dark:text-white text-sm">AI Study Observer</h3>
                <p className="text-[10px] text-slate-400">Derived from passive journal analysis</p>
              </div>
            </div>

            {suggestions.length === 0 ? (
              <p className="text-xs text-slate-400 leading-relaxed italic text-center py-4">
                Write a detailed notepad/markdown journal. StudyBuddy will read it to offer customized academic and psychological suggestions here.
              </p>
            ) : (
              <div className="space-y-4.5" id="observer-suggestions-list">
                {suggestions.map((sug, idx) => (
                  <div
                    key={sug.id || idx}
                    className={`p-4 rounded-2xl border ${
                      sug.type === "academic"
                        ? "bg-indigo-50/20 border-indigo-100/50 dark:bg-indigo-950/10 dark:border-indigo-900/30 text-indigo-950 dark:text-indigo-100"
                        : "bg-emerald-50/20 border-emerald-100/50 dark:bg-emerald-950/10 dark:border-emerald-900/30 text-emerald-950 dark:text-emerald-100"
                    }`}
                    id={`suggestion-${idx}`}
                  >
                    <span className="text-[9px] font-extrabold uppercase tracking-widest block mb-1 text-slate-400">
                      {sug.type === "academic" ? "📚 Academic Strategy" : "🌸 Wellbeing Reset"}
                    </span>
                    <p className="text-xs font-semibold leading-relaxed">
                      {sug.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confidiality notice card */}
          <div className="p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed text-center">
            🔐 All journal entries are private. Data connections are secure. Your mental space is completely safe with StudyBuddy.
          </div>

        </div>

      </div>
    </div>
  );
}
