import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import ChibiAvatar from "../components/ChibiAvatar";
import { ChatMessage } from "../types";
import { 
  Send, 
  Mic, 
  MicOff, 
  RefreshCw, 
  Trash2, 
  ArrowDownCircle, 
  Sparkles, 
  HelpCircle,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Chat() {
  const navigate = useNavigate();
  const { user, profile, latestMood, showToast, trackInteraction } = useApp();

  // Redirect if unauthenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  
  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history from SQLite/JSON mock Cloud SQL on start
  const fetchChats = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/chats?userEmail=${encodeURIComponent(user.email)}&email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Could not fetch chat history", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchChats();
      // Initialize Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-IN"; // Set to Indian English dialect

        rec.onstart = () => {
          setIsListening(true);
          showToast("Listening. Speak your academic doubt or feeling...", "info");
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => prev + " " + transcript);
          trackInteraction();
        };

        rec.onerror = (event: any) => {
          console.error("Speech Recognition Error", event.error);
          showToast("Speech recognition paused or unsupported.", "error");
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, [user]);

  // Voice Recognition toggle trigger
  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      showToast("Speech recognition is not fully supported in this browser environment.", "error");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Submit/Send chat message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user?.email || sending) return;

    const userMsgText = input.trim();
    setInput("");
    setSending(true);
    trackInteraction();

    try {
      // 1. Post user message to server db
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          role: "user",
          content: userMsgText
        })
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Optimistically add user message
        setMessages((prev) => [...prev, data.message]);

        // 2. Fetch Chat Q&A response from Gemini
        const geminiResponse = await fetch("/api/gemini/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            message: userMsgText,
            history: messages.concat(data.message)
          })
        });
        const geminiData = await geminiResponse.json();

        if (geminiResponse.ok && geminiData.reply) {
          // 3. Post bot message to server db
          const botResponse = await fetch("/api/chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              role: "model",
              content: geminiData.reply
            })
          });
          const botData = await botResponse.json();
          if (botResponse.ok && botData.success) {
            setMessages((prev) => [...prev, botData.message]);
          }
        } else {
          throw new Error(geminiData.error || "Failed to retrieve AI reply");
        }
      }
    } catch (err: any) {
      showToast("StudyBuddy is taking a quick breather. Please try again in a moment.", "error");
    } finally {
      setSending(false);
    }
  };

  // Clear messages
  const handleClearChat = async () => {
    if (!user?.email) return;
    if (window.confirm("Are you sure you want to clear your conversation history?")) {
      try {
        const response = await fetch("/api/chats/clear", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email })
        });
        if (response.ok) {
          setMessages([]);
          showToast("Chat history successfully cleared.", "success");
        }
      } catch (err) {
        showToast("Could not clear chat history.", "error");
      }
    }
  };

  // Check if Chibi is concerned based on stress metrics
  const isChibiConcerned = latestMood ? latestMood.stress >= 7 || latestMood.anxiety >= 7 : false;
  
  // Choose correct Chibi animation state
  const getChibiAnimationState = () => {
    if (sending) return "typing";
    if (isChibiConcerned) return "concerned";
    return "idle";
  };

  return (
    <div 
      className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors flex flex-col md:flex-row"
      id="chat-page-container"
    >
      
      {/* LEFT AREA: CHIBI ACTIVE MIRROR (On the far left on desktop) */}
      <div 
        className="w-full md:w-80 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 gap-4 text-center select-none"
        id="chibi-chat-sidebar"
      >
        <ChibiAvatar
          customization={profile?.chibi}
          state={getChibiAnimationState()}
          size="lg"
          showBackground={true}
          backgroundType="chat"
        />

        <div className="space-y-1">
          <h3 className="font-bold text-slate-950 dark:text-white flex items-center justify-center gap-1.5 text-sm">
            <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
            <span>Active StudyBuddy</span>
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mx-auto leading-relaxed">
            {sending 
              ? "Your buddy is typing an empathetic reply..." 
              : isChibiConcerned 
              ? "Your buddy noticed you're feeling highly stressed today. Take it easy!" 
              : "Your buddy is here to coach you. Ask questions or talk about feelings."}
          </p>
        </div>

        {/* Real-time Mood Indicator in Chat */}
        {latestMood && (
          <div className="w-full max-w-xs p-3.5 mt-2 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/10 text-left space-y-1.5">
            <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Current Calibrated Metrics</span>
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div>Stress: <span className="text-rose-500">{latestMood.stress}/10</span></div>
              <div>Anxiety: <span className="text-purple-500">{latestMood.anxiety}/10</span></div>
              <div>Joy: <span className="text-amber-500">{latestMood.happiness}/10</span></div>
              <div>Confusion: <span className="text-indigo-500">{latestMood.confusion}/10</span></div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT AREA: THE CONVERSATION PANEL */}
      <div className="flex-1 flex flex-col justify-between h-[calc(100vh-10rem)] md:h-[calc(100vh-4rem)] bg-white dark:bg-slate-900" id="chat-conversation-panel">
        
        {/* Chat Panel Header */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between" id="chat-header">
          <div>
            <h4 className="font-bold text-slate-950 dark:text-white text-sm">Doubts & Mental Support Room</h4>
            <p className="text-[10px] text-slate-400">Empathy-driven AI tutoring. Speak freely.</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
              title="Clear entire room history"
              id="clear-chat-history-btn"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Conversation messages list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar" id="chat-messages-container">
          {messages.length === 0 ? (
            /* Cozy welcome prompt */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4" id="chat-onboarding-card">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <HelpCircle className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">How are you holding up today?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Whether you have a confusing UPSC question, a tough JEE integration problem, or just feel highly burned out and need to vent, StudyBuddy is here to listen.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button
                  onClick={() => setInput("Can you explain how to manage mock exam anxiety?")}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px] font-bold rounded-full transition-colors text-slate-600 dark:text-slate-300"
                >
                  Manage Mock Anxiety
                </button>
                <button
                  onClick={() => setInput("Explain Physics integration step by step.")}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px] font-bold rounded-full transition-colors text-slate-600 dark:text-slate-300"
                >
                  JEE Physics Integration
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    id={`message-bubble-${msg.id}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isUser
                          ? "bg-indigo-600 text-white shadow-md rounded-br-none"
                          : "bg-slate-100 border border-slate-200/40 text-slate-950 dark:bg-slate-800 dark:border-slate-800 dark:text-slate-100 rounded-bl-none"
                      }`}
                    >
                      {/* Formatted body */}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
              
              {/* Typing state placeholder */}
              {sending && (
                <div className="flex justify-start" id="ai-typing-placeholder">
                  <div className="bg-slate-100 border border-slate-200/40 text-slate-400 dark:bg-slate-800 dark:border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 text-sm flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    <span>StudyBuddy is writing...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input form */}
        <form 
          onSubmit={handleSendMessage} 
          className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex gap-2.5 items-center"
          id="chat-input-form"
        >
          {/* Voice Mic Input */}
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`p-3.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
              isListening
                ? "bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-400 animate-pulse"
                : "bg-white border-slate-200 dark:border-slate-800 text-slate-500 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
            title="Dictate with Voice-To-Text (Web Speech API)"
            id="mic-dictate-btn"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input area */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening closely..." : "Ask StudyBuddy your doubt, or share what's on your mind..."}
            disabled={sending}
            className="flex-1 py-3 px-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden outline-hidden transition-all"
            id="chat-input-box"
          />

          {/* Send Action */}
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="p-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-white rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center"
            id="submit-chat-btn"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

    </div>
  );
}
