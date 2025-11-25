export function isDevMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function getDevModeLabel(): string | null {
  if (!isDevMode()) return null;
  return "DEV MODE";
}

