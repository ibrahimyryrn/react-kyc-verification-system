/**
 * Logger utility for consistent logging across the application
 * Automatically disables logs in production environment
 */

const isDevelopment =
  import.meta.env.DEV || process.env.NODE_ENV === "development";

type LogLevel = "log" | "warn" | "error" | "info" | "debug";

interface Logger {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

const createLogger = (level: LogLevel): typeof console.log => {
  if (!isDevelopment) {
    // In production, only errors are logged
    if (level === "error") {
      return (...args: unknown[]) => {
        console.error(...args);
        // TODO: Send to error tracking service (e.g., Sentry)
      };
    }
    // Return no-op function for other log levels in production
    return () => {};
  }

  // In development, use console methods
  return console[level].bind(console);
};

/**
 * Logger utility
 * - In development: logs everything to console
 * - In production: only errors are logged (and can be sent to tracking service)
 */
export const logger: Logger = {
  log: createLogger("log"),
  warn: createLogger("warn"),
  error: createLogger("error"),
  info: createLogger("info"),
  debug: createLogger("debug"),
};
