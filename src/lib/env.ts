type EnvVar = {
  key: string;
  required: boolean;
  description: string;
};

const requiredEnvVars: EnvVar[] = [
  {
    key: "NEXT_PUBLIC_CONVEX_URL",
    required: true,
    description: "Convex deployment URL (e.g., https://your-project.convex.cloud)",
  },
];

const optionalEnvVars: EnvVar[] = [
  {
    key: "NEXT_PUBLIC_ADMIN_PASSWORD",
    required: false,
    description: "Password for /admin panel access",
  },
];

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar.key];
    if (!value) {
      missing.push(`${envVar.key}: ${envVar.description}`);
    }
  }

  for (const envVar of optionalEnvVars) {
    const value = process.env[envVar.key];
    if (!value) {
      warnings.push(`${envVar.key} not set: ${envVar.description}`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

export function getEnvValidationMessage(result: EnvValidationResult): string {
  const lines: string[] = [];

  if (!result.valid) {
    lines.push("❌ Missing required environment variables:");
    lines.push("");
    for (const item of result.missing) {
      lines.push(`  • ${item}`);
    }
    lines.push("");
    lines.push("Please create a .env.local file with these variables.");
    lines.push("See https://docs.convex.dev/production/hosting/ for setup instructions.");
  }

  if (result.warnings.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("⚠️ Optional variables not set:");
    for (const item of result.warnings) {
      lines.push(`  • ${item}`);
    }
  }

  return lines.join("\n");
}

export function assertEnvVars(): void {
  const result = validateEnv();

  if (!result.valid) {
    const message = getEnvValidationMessage(result);
    console.error("\n" + message + "\n");
    throw new Error(
      `Missing required environment variables: ${result.missing.map((m) => m.split(":")[0]).join(", ")}`
    );
  }

  if (result.warnings.length > 0 && process.env.NODE_ENV === "development") {
    console.warn("\n" + getEnvValidationMessage({ ...result, missing: [] }) + "\n");
  }
}

export function getConvexUrl(): string {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_CONVEX_URL is not set. " +
        "Please add it to your .env.local file or Vercel environment variables."
    );
  }
  return url;
}

export function getAdminPassword(): string | undefined {
  return process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
}


