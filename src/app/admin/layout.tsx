"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import { getAdminPassword } from "@/lib/env";
import { isDevMode } from "@/lib/dev";

const COOKIE_NAME = "admin_authenticated";
const ADMIN_PASSWORD = getAdminPassword();

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? null;
  return null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

function subscribe(callback: () => void) {
  // Re-check when cookie might change (simple polling on focus)
  window.addEventListener("focus", callback);
  return () => window.removeEventListener("focus", callback);
}

function getAuthSnapshot(): boolean {
  return getCookie(COOKIE_NAME) === "true";
}

function getServerSnapshot(): boolean {
  return false;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticatedFromCookie = useSyncExternalStore(
    subscribe,
    getAuthSnapshot,
    getServerSnapshot
  );
  
  const [isAuthenticated, setIsAuthenticated] = useState(isAuthenticatedFromCookie);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setCookie(COOKIE_NAME, "true", 7);
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Incorrect password");
    }
  };

  const handleLogout = () => {
    setCookie(COOKIE_NAME, "", -1);
    setIsAuthenticated(false);
  };

  // Use the synced value or local state (local state takes precedence after login/logout)
  // In dev mode (localhost), bypass authentication entirely
  const devMode = isDevMode();
  const effectiveAuth = devMode || isAuthenticated || isAuthenticatedFromCookie;

  if (!effectiveAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-amber-500" />
            </div>
            <CardTitle className="text-2xl text-white">Admin Access</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                  autoFocus
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
              >
                Access Admin Panel
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-slate-900 font-bold text-sm">T</span>
              </div>
              <span className="text-white font-semibold text-lg">
                Trivia Admin
              </span>
              {devMode && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  DEV MODE
                </Badge>
              )}
            </div>
            {!devMode && (
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-slate-400 hover:text-white hover:bg-slate-700"
              >
                Logout
              </Button>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
