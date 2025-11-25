export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public userMessage?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export type ErrorCode =
  | "GAME_NOT_FOUND"
  | "TEAM_NOT_FOUND"
  | "QUESTION_NOT_FOUND"
  | "ROUND_NOT_FOUND"
  | "INVALID_GAME_CODE"
  | "GAME_ALREADY_STARTED"
  | "GAME_NOT_EDITABLE"
  | "UNAUTHORIZED"
  | "NETWORK_ERROR"
  | "CONVEX_ERROR"
  | "UNKNOWN";

interface FriendlyError {
  title: string;
  message: string;
  canRetry: boolean;
}

const errorMessages: Record<ErrorCode, FriendlyError> = {
  GAME_NOT_FOUND: {
    title: "Game Not Found",
    message: "This game doesn't exist or may have been deleted.",
    canRetry: false,
  },
  TEAM_NOT_FOUND: {
    title: "Team Not Found",
    message: "Your team couldn't be found. Try rejoining the game.",
    canRetry: true,
  },
  QUESTION_NOT_FOUND: {
    title: "Question Not Found",
    message: "This question doesn't exist.",
    canRetry: false,
  },
  ROUND_NOT_FOUND: {
    title: "Round Not Found",
    message: "This round doesn't exist.",
    canRetry: false,
  },
  INVALID_GAME_CODE: {
    title: "Invalid Game Code",
    message: "The game code you entered is invalid. Please check and try again.",
    canRetry: false,
  },
  GAME_ALREADY_STARTED: {
    title: "Game Already Started",
    message: "This game has already started. You can no longer join or edit it.",
    canRetry: false,
  },
  GAME_NOT_EDITABLE: {
    title: "Cannot Edit Game",
    message: "This game has started and can no longer be edited.",
    canRetry: false,
  },
  UNAUTHORIZED: {
    title: "Access Denied",
    message: "You don't have permission to perform this action.",
    canRetry: false,
  },
  NETWORK_ERROR: {
    title: "Connection Problem",
    message: "Unable to connect to the server. Check your internet connection.",
    canRetry: true,
  },
  CONVEX_ERROR: {
    title: "Server Error",
    message: "Something went wrong on our end. Please try again.",
    canRetry: true,
  },
  UNKNOWN: {
    title: "Something Went Wrong",
    message: "An unexpected error occurred. Please try again.",
    canRetry: true,
  },
};

export function getUserFriendlyError(error: Error): FriendlyError {
  if (error instanceof AppError) {
    return errorMessages[error.code];
  }

  const message = error.message.toLowerCase();

  if (message.includes("not found") || message.includes("does not exist")) {
    if (message.includes("game")) return errorMessages.GAME_NOT_FOUND;
    if (message.includes("team")) return errorMessages.TEAM_NOT_FOUND;
    if (message.includes("question")) return errorMessages.QUESTION_NOT_FOUND;
    if (message.includes("round")) return errorMessages.ROUND_NOT_FOUND;
  }

  if (message.includes("already started") || message.includes("has started")) {
    return errorMessages.GAME_ALREADY_STARTED;
  }

  if (message.includes("cannot edit") || message.includes("not editable")) {
    return errorMessages.GAME_NOT_EDITABLE;
  }

  if (message.includes("unauthorized") || message.includes("permission")) {
    return errorMessages.UNAUTHORIZED;
  }

  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("connection")
  ) {
    return errorMessages.NETWORK_ERROR;
  }

  if (message.includes("convex")) {
    return errorMessages.CONVEX_ERROR;
  }

  return errorMessages.UNKNOWN;
}

export function getErrorMessage(code: ErrorCode): string {
  return errorMessages[code].message;
}

export function isRetryable(error: Error): boolean {
  return getUserFriendlyError(error).canRetry;
}

