import { useState } from "react";
import { createFileRoute, useNavigate, useRouter, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Clapperboard, Loader2, Mail, Lock, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TryBox" },
      { name: "description", content: "Sign in to manage the TryBox streaming catalog." },
      { property: "og:title", content: "Sign in — TryBox" },
      { property: "og:description", content: "Sign in to manage the TryBox streaming catalog." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type AuthMode = "signin" | "signup" | "otp";

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper to direct user based on admin status
  const redirectAfterAuth = async (userId: string) => {
    try {
      await router.invalidate();
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (roleData?.role === "admin") {
        void navigate({ to: "/admin" });
      } else {
        void navigate({ to: "/" });
      }
    } catch {
      void navigate({ to: "/" });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });

        if (error) throw error;

        if (data.session && data.user) {
          toast.success("Account created successfully!");
          await redirectAfterAuth(data.user.id);
        } else {
          toast.info("Check your inbox to verify your email address before signing in.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            toast.error("Please confirm your email address or use 'Send Email Login Code'.");
            return;
          }
          throw error;
        }

        if (data.user) {
          toast.success("Signed in successfully!");
          await redirectAfterAuth(data.user.id);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Enter your email first.");
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;

      toast.success("Verification code sent to your email!");
      setAwaitingOtp(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send login code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpToken.trim(),
        type: "email",
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Verified successfully!");
        await redirectAfterAuth(data.user.id);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (result.error) {
        toast.error("Google sign-in failed");
        return;
      }
      if (result.redirected) return;
      void navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "OAuth error");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-md">
        <Link to="/" className="mb-5 flex items-center gap-2">
          <Clapperboard className="size-5 text-primary" />
          <span className="font-bold text-foreground">TryBox</span>
        </Link>

        <h1 className="text-lg font-semibold text-foreground">
          {mode === "signin" && "Sign in to TryBox"}
          {mode === "signup" && "Create an Account"}
          {mode === "otp" && "Sign In with Email Code"}
        </h1>

        {mode === "otp" ? (
          !awaitingOtp ? (
            <form onSubmit={handleSendOtp} className="mt-4 space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {loading ? <Loader2 className="mx-auto size-4 animate-spin" /> : "Send Login Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="mt-4 space-y-3">
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-center font-mono text-sm tracking-widest text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {loading ? <Loader2 className="mx-auto size-4 animate-spin" /> : "Verify & Enter"}
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="mx-auto size-4 animate-spin" />
              ) : mode === "signin" ? (
                "Sign in"
              ) : (
                "Sign up"
              )}
            </button>
          </form>
        )}

        <button
          onClick={() => void handleGoogleSignIn()}
          className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          Continue with Google
        </button>

        <div className="mt-4 flex flex-col gap-2 text-center text-xs text-muted-foreground">
          {mode !== "otp" ? (
            <button
              type="button"
              onClick={() => {
                setMode("otp");
                setAwaitingOtp(false);
              }}
              className="text-primary hover:underline"
            >
              Sign in with Email Code (no password)
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="text-primary hover:underline"
            >
              Back to Password Sign In
            </button>
          )}

          {mode !== "otp" && (
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="hover:text-foreground"
            >
              {mode === "signin" ? "No account? Sign up" : "Already have an account? Sign in"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
