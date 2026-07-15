import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, X } from "lucide-react";
import { AuthPayload, AuthMode } from "../services/authService";
import { useI18n } from "../i18n";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: AuthPayload) => Promise<void>;
}

const AuthModal = ({ isOpen, onClose, onSubmit }: AuthModalProps) => {
  const { t } = useI18n();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFeedback(null);
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);

    if (!email.trim() || !password.trim()) {
      setFeedback(t("auth.missingEmailPassword"));
      return;
    }

    if (mode === "signup" && !fullName.trim()) {
      setFeedback(t("auth.missingName"));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        mode,
        email: email.trim(),
        password,
        fullName: fullName.trim(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t("auth.genericError");
      setFeedback(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/80 p-5 backdrop-blur-xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            className="w-full max-w-xl rounded-[36px] border border-white/10 bg-zinc-950 p-7 shadow-2xl shadow-black/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-300">Supabase Auth</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{t("auth.title")}</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{t("auth.description")}</p>
              </div>
              <button onClick={onClose} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/60 transition-all hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex gap-3 rounded-2xl bg-white/5 p-1.5">
              {[
                { value: "signin" as const, label: t("auth.signin") },
                { value: "signup" as const, label: t("auth.signup") },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setMode(item.value)}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                    mode === item.value ? "bg-emerald-500 text-slate-950" : "text-white/55 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">{t("auth.fullName")}</label>
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all focus:border-emerald-400/30"
                    placeholder={t("auth.fullNamePlaceholder")}
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all focus:border-emerald-400/30"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">{t("auth.password")}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all focus:border-emerald-400/30"
                  placeholder={t("auth.passwordPlaceholder")}
                />
              </div>

              {feedback && <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">{feedback}</div>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-bold uppercase tracking-[0.22em] text-slate-950 transition-all hover:bg-emerald-400 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {mode === "signup" ? t("auth.createAccount") : t("auth.signin")}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
