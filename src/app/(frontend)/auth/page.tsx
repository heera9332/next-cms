// app/user-auth/page.tsx
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { axios } from "@/lib/axios";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useApp } from "@/hooks/useApp";
import toast from "react-hot-toast";
import { AuthCardSkeleton } from "@/components/skeleton/AuthCardSkeleton";
import { slugify, usernameFromEmail } from "@/lib/slugify";

type ActionType =
  | "login"
  | "register"
  | "logout"
  | "forgot-password"
  | "reset-password";

function UserAuthPage() {
  const router = useRouter();
  const qp = useSearchParams();
  const redirectTo = qp.get("redirect_to") || "/dashboard";
  const action = (qp.get("action") as ActionType) || "login";
  const resetToken = qp.get("token") || "";
  const resetEmail = qp.get("email") || "";

  const { user, logout, login, setUser } = useApp();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: resetEmail || "",
    password: "",
    confirmPassword: "",
    token: resetToken,
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const title = useMemo(() => {
    switch (action) {
      case "register":
        return "Create your account";
      case "logout":
        return "Sign out";
      case "forgot-password":
        return "Forgot password";
      case "reset-password":
        return "Reset password";
      default:
        return "Welcome back";
    }
  }, [action]);

  const description = useMemo(() => {
    switch (action) {
      case "register":
        return "Start analyzing products — it’s free to get going.";
      case "logout":
        return "You are about to sign out of your account.";
      case "forgot-password":
        return "Enter your email and we’ll send a reset link.";
      case "reset-password":
        return "Set a new password for your account.";
      default:
        return "Log in to continue.";
    }
  }, [action]);

  const go = (nextAction: ActionType) => {
    const url = new URL(window.location.href);

    // just replace the action param (or add if missing)
    url.searchParams.set("action", nextAction);

    router.replace(url.toString());
  };

  const onField =
    <K extends keyof typeof form>(name: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [name]: e.target.value }));

  const prevent =
    (fn: () => Promise<void> | void) => async (e: React.FormEvent) => {
      e.preventDefault();
      setMsg(null);
      setLoading(true);
      try {
        await fn();
      } finally {
        setLoading(false);
      }
    };

  const AuthSwitcher = () => (
    <div className="text-sm text-muted-foreground gap-4 flex-wrap flex flex-col items-center">
      {action !== "login" && (
        <Link
          className="underline underline-offset-4"
          href={`/auth?action=login&redirect_to=${redirectTo}`}
        >
          Go to login
        </Link>
      )}
      {action !== "register" && (
        <Link
          className="underline underline-offset-4 text-blue-800"
          href={`/auth?action=register&redirect_to=${redirectTo}`}
        >
          Create an account
        </Link>
      )}
      {action !== "forgot-password" && (
        <Link
          className="underline underline-offset-4 text-blue-800"
          href={`/auth?action=forgot-password&redirect_to=${redirectTo}`}
        >
          Forgot password?
        </Link>
      )}
    </div>
  );

  useEffect(() => {
    if (action === "logout") {
      const url = new URL(window.location.href);
      url.searchParams.set("action", "login");
      logout();
    }
  }, [user, action, logout]);

  return (
    <div className="min-h-[calc(100dvh-80px)] flex items-center justify-center p-4">
      <Card className="w-full max-w-[480px] py-8">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {msg && (
            <Alert variant={msg.type === "error" ? "destructive" : "default"}>
              <AlertTitle>
                {msg.type === "error" ? "Oops" : "Success"}
              </AlertTitle>
              <AlertDescription>{msg.text}</AlertDescription>
            </Alert>
          )}

          {action === "login" && (
            <form
              onSubmit={async (ev) => {
                ev.preventDefault();
                try {
                  const { data } = await axios.post("/api/auth/login", {
                    identifier: form.email.trim(), // ✅ expected by route
                    password: form.password,
                  });
                  login(data?.user, data?.token); // token is cookie; arg kept for API parity
                  setMsg({ type: "success", text: "Logged in successfully." });
                  router.push(redirectTo);
                } catch (e: any) {
                  const errorMessage =
                    e?.response?.data?.error || "Login failed.";
                  setMsg({ type: "error", text: errorMessage });
                  toast.error(errorMessage);
                }
              }}
              className="space-y-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  onChange={onField("email")}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  onChange={onField("password")}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 py-2.5 px-4"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              <Separator />
              <AuthSwitcher />
            </form>
          )}

          {action === "register" && (
            <form
              noValidate
              onSubmit={prevent(async () => {
                if (
                  !form.firstName ||
                  !form.lastName ||
                  !form.email ||
                  !form.password
                ) {
                  setMsg({ type: "error", text: "Please fill all fields." });
                  return;
                }
                const email = form.email.trim().toLowerCase();
                const display =
                  `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
                const user_login = usernameFromEmail(email);
                const user_nicename = slugify(display || user_login);

                try {
                  const { data } = await axios.post("/api/auth/register", {
                    user_login,
                    user_nicename,
                    user_email: email,
                    display_name: display,
                    password: form.password,
                  });

                  setUser(data?.user ?? null);
                  setMsg({
                    type: "success",
                    text: "Account created. You can login now.",
                  });
                  toast.success("Account created, please login");
                  router.push(`/auth?action=login&redirect_to=${redirectTo}`);
                } catch (e: any) {
                  setMsg({
                    type: "error",
                    text: e?.response?.data?.error || "Registration failed.",
                  });
                }
              })}
              className="space-y-4"
            >
              <div className="grid md:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    onChange={onField("firstName")}
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    onChange={onField("lastName")}
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="regEmail">Email</Label>
                <Input
                  id="regEmail"
                  name="email"
                  type="email"
                  onChange={onField("email")}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="regPassword">Password</Label>
                <Input
                  id="regPassword"
                  name="password"
                  type="password"
                  onChange={onField("password")}
                  required
                  autoComplete="new-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create account"}
              </Button>
              <Separator />
              <AuthSwitcher />
            </form>
          )}

          {action === "forgot-password" && (
            <form
              noValidate
              onSubmit={prevent(async () => {
                if (!form.email) {
                  setMsg({ type: "error", text: "Enter your email." });
                  return;
                }
                try {
                  await axios.post("/api/auth/forgot-password", {
                    email: form.email.trim(),
                  });
                  setMsg({
                    type: "success",
                    text: "Reset link sent if the email exists.",
                  });
                } catch (e: any) {
                  setMsg({
                    type: "error",
                    text: e?.response?.data?.error || "Could not send link.",
                  });
                }
              })}
              className="space-y-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="fpEmail">Email</Label>
                <Input
                  id="fpEmail"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  onChange={onField("email")}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send reset link"}
              </Button>
              <Separator />
              <AuthSwitcher />
            </form>
          )}

          {action === "reset-password" && (
            <form
              noValidate
              onSubmit={prevent(async () => {
                if (
                  !form.email ||
                  !form.token ||
                  !form.password ||
                  form.password !== form.confirmPassword
                ) {
                  setMsg({
                    type: "error",
                    text: "Email, token and matching passwords are required.",
                  });
                  return;
                }
                try {
                  await axios.post("/api/auth/reset-password", {
                    email: form.email.trim(),
                    token: form.token.trim(),
                    newPassword: form.password,
                  });
                  setMsg({
                    type: "success",
                    text: "Password updated. Please log in.",
                  });
                  go("login");
                } catch (e: any) {
                  setMsg({
                    type: "error",
                    text: e?.response?.data?.error || "Reset failed.",
                  });
                }
              })}
              className="space-y-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="rpEmail">Email</Label>
                <Input
                  id="rpEmail"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onField("email")}
                  required
                />
              </div>
              <div className="grid gap-2" hidden>
                <Label htmlFor="token">Reset Token</Label>
                <Input
                  id="token"
                  name="token"
                  value={form.token}
                  onChange={onField("token")}
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="newPwd">New Password</Label>
                  <Input
                    id="newPwd"
                    name="password"
                    type="password"
                    onChange={onField("password")}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPwd">Confirm Password</Label>
                  <Input
                    id="confirmPwd"
                    name="confirmPassword"
                    type="password"
                    onChange={onField("confirmPassword")}
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update password"}
              </Button>
              <Separator />
              <AuthSwitcher />
            </form>
          )}

          {action === "logout" && (
            <form
              onSubmit={prevent(async () => {
                try {
                  await axios.post("/api/auth/logout", {});
                } catch {}
                setUser(null);
                if (typeof window !== "undefined")
                  window.localStorage.removeItem("user");
                setMsg({ type: "success", text: "Signed out." });
                const url = new URL(window.location.href);
                url.searchParams.set("action", "login");
                toast.success("User logged out");
              })}
              className="flex flex-col gap-4"
            >
              <p className="text-sm text-muted-foreground">
                You&apos;re currently{" "}
                {user
                  ? `signed in as ${user.user_email ?? "a user"}`
                  : "not signed in"}
              </p>
              <Link
                className="underline underline-offset-4"
                href={`/auth?action=login`}
              >
                Cancel
              </Link>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800"
                variant="destructive"
                disabled={loading}
              >
                {loading ? "Signing out..." : "Sign out"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const SuspenseUserAuthPage = () => {
  return (
    <Suspense fallback={<AuthCardSkeleton action="login" />}>
      <UserAuthPage />
    </Suspense>
  );
};

export default SuspenseUserAuthPage;
