import React from "react";
import { useApp } from "../context/AppContext";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export default function CustomToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none"
      id="custom-toast-container"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const isError = toast.type === "error";
          const isSuccess = toast.type === "success";

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all ${
                isError
                  ? "bg-rose-50/95 border-rose-200 text-rose-950 dark:bg-rose-950/95 dark:border-rose-900 dark:text-rose-100"
                  : isSuccess
                  ? "bg-emerald-50/95 border-emerald-200 text-emerald-950 dark:bg-emerald-950/95 dark:border-emerald-900 dark:text-emerald-100"
                  : "bg-slate-50/95 border-slate-200 text-slate-950 dark:bg-slate-900/95 dark:border-slate-800 dark:text-slate-100"
              }`}
              id={`toast-${toast.id}`}
            >
              {/* Icon Selection */}
              <div className="shrink-0 mt-0.5">
                {isError && <AlertCircle className="w-5 h-5 text-rose-500" />}
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {!isError && !isSuccess && <Info className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
              </div>

              {/* Message */}
              <div className="flex-1 text-sm font-medium leading-relaxed">
                {toast.message}
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
