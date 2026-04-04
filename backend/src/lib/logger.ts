export function logInfo(message: string, payload?: unknown) {
  console.log(`[FeedPulse] ${message}`, payload ?? "");
}

export function logError(message: string, payload?: unknown) {
  console.error(`[FeedPulse] ${message}`, payload ?? "");
}

