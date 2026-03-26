import { useState } from "react";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";
import { signup, login } from "../services/auth";
import type { AuthUser } from "../services/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuth: (user: AuthUser) => void;
}

export function AuthModal({ isOpen, onClose, onAuth }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError("");
    setShowPassword(false);
  };

  const switchMode = (newMode: "login" | "signup") => {
    setMode(newMode);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let user: AuthUser;
      if (mode === "signup") {
        if (!name.trim()) {
          setError("Name is required");
          setLoading(false);
          return;
        }
        user = await signup(name.trim(), email.trim(), password);
      } else {
        user = await login(email.trim(), password);
      }
      resetForm();
      onAuth(user);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl border border-[--border-subtle] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ background: "#FFFFFF" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[--bg-tertiary] transition-colors z-10"
        >
          <X className="w-4 h-4 text-[--text-secondary]" />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-2">
          <h2 className="text-2xl font-bold text-[--text-primary] tracking-tight">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-sm text-[--text-secondary] mt-1">
            {mode === "login"
              ? "Sign in to your RankForge account"
              : "Start generating SEO-optimized content"}
          </p>
        </div>

        {/* Tabs */}
        <div className="px-8 pt-4">
          <div className="flex gap-1 p-1 rounded-lg bg-[--bg-tertiary]">
            <button
              onClick={() => switchMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === "login"
                  ? "bg-white text-[--text-primary] shadow-sm"
                  : "text-[--text-secondary] hover:text-[--text-primary]"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => switchMode("signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === "signup"
                  ? "bg-white text-[--text-primary] shadow-sm"
                  : "text-[--text-secondary] hover:text-[--text-primary]"
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pt-6 pb-8 space-y-4">
          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-100">
              {error}
            </div>
          )}

          {/* Name (signup only) */}
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium text-[--text-primary] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2.5 rounded-lg border border-[--border-subtle] bg-white text-[--text-primary] text-sm placeholder:text-[--text-tertiary] focus:outline-none focus:ring-2 focus:ring-[#2D2B55]/20 focus:border-[#2D2B55] transition-all"
                autoComplete="name"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[--text-primary] mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-lg border border-[--border-subtle] bg-white text-[--text-primary] text-sm placeholder:text-[--text-tertiary] focus:outline-none focus:ring-2 focus:ring-[#2D2B55]/20 focus:border-[#2D2B55] transition-all"
              autoComplete="email"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-[--text-primary] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Min. 6 characters" : "Your password"}
                className="w-full px-4 py-2.5 rounded-lg border border-[--border-subtle] bg-white text-[--text-primary] text-sm placeholder:text-[--text-tertiary] focus:outline-none focus:ring-2 focus:ring-[#2D2B55]/20 focus:border-[#2D2B55] transition-all pr-10"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[--text-tertiary] hover:text-[--text-secondary] transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {mode === "login" ? "Signing in…" : "Creating account…"}
              </>
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>

          {/* Footer */}
          <p className="text-center text-xs text-[--text-tertiary] pt-2">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="text-[#2D2B55] font-medium hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-[#2D2B55] font-medium hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
