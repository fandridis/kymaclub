/**
 * Centralized logging utility for the API backend
 *
 * Provides structured logging with different levels and contexts.
 * Features:
 * - Functional approach with composable functions
 * - Structured JSON output in production
 * - Pretty console output in development
 * - Performance tracking
 * - Error serialization
 * - Log sampling for high-volume scenarios
 */

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogContext = Record<string, any>;

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    module?: string;
    context?: LogContext;
    duration?: number;
}

interface LoggerConfig {
    isDevelopment?: boolean;
    minLevel?: LogLevel;
    sampleRate?: number; // 0-1, for sampling in production
    prettify?: boolean;
}

// Level hierarchy for filtering
const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const getLevelEmoji = (level: LogLevel): string => {
    const emojis: Record<LogLevel, string> = {
        debug: "🔍",
        info: "ℹ️",
        warn: "⚠️",
        error: "❌",
    };
    return emojis[level];
};

const createTimestamp = (): string => new Date().toISOString();

const shouldLog = (level: LogLevel, config: LoggerConfig): boolean => {
    const minLevel = config.minLevel || (config.isDevelopment ? "debug" : "info");

    // Check level threshold
    if (LOG_LEVELS[level] < LOG_LEVELS[minLevel]) {
        return false;
    }

    // Apply sampling for non-error logs in production
    if (!config.isDevelopment && level !== "error" && config.sampleRate) {
        return Math.random() < config.sampleRate;
    }

    return true;
};

// Error serialization helper
const serializeError = (error: unknown): LogContext => {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...(error as any), // Include any custom properties
        };
    }
    return { error: String(error) };
};

// Format for development (pretty console output)
const formatDevelopment = (entry: LogEntry): string => {
    const emoji = getLevelEmoji(entry.level);
    const modulePrefix = entry.module ? `[${entry.module}] ` : "";
    const contextString = entry.context
        ? "\n" + JSON.stringify(entry.context, null, 2)
        : "";
    const durationString =
        entry.duration !== undefined ? ` (${entry.duration}ms)` : "";

    return `${emoji} ${entry.timestamp} ${modulePrefix}${entry.message}${durationString}${contextString}`;
};

// Format for production (structured JSON)
const formatProduction = (entry: LogEntry): string => {
    return JSON.stringify({
        ...entry,
        pid: 0, // RN-safe placeholder
        hostname: "mobile", // RN-safe placeholder
    });
};

// Main logger factory
const createLogger = (config: LoggerConfig = {}): Logger => {
    const defaultConfig: LoggerConfig = {
        isDevelopment: __DEV__, // ✅ RN safe
        minLevel: __DEV__ ? "debug" : "info",
        sampleRate: 1.0,
        prettify: __DEV__,
        ...config,
    };

    const log = (
        level: LogLevel,
        message: string,
        context?: LogContext,
        module?: string
    ): void => {
        if (!shouldLog(level, defaultConfig)) {
            return;
        }

        const entry: LogEntry = {
            timestamp: createTimestamp(),
            level,
            message,
            module,
            context,
        };

        const formatted = defaultConfig.prettify
            ? formatDevelopment(entry)
            : formatProduction(entry);

        const consoleMethods: Record<LogLevel, typeof console.log> = {
            debug: console.log,
            info: console.log,
            warn: console.warn,
            error: console.error,
        };

        consoleMethods[level](formatted);
    };

    // Timer utility for performance tracking
    const timer = (label: string, module?: string) => {
        const start = Date.now();
        return {
            end: (context?: LogContext) => {
                const duration = Date.now() - start;
                log("info", `${label} completed`, { ...context, duration }, module);
                return duration;
            },
        };
    };

    // Batch logging for multiple related entries
    const batch = (
        entries: Array<{ level: LogLevel; message: string; context?: LogContext }>,
        module?: string
    ): void => {
        entries.forEach(({ level, message, context }) => {
            log(level, message, context, module);
        });
    };

    return {
        debug: (message: string, context?: LogContext) =>
            log("debug", message, context),
        info: (message: string, context?: LogContext) =>
            log("info", message, context),
        warn: (message: string, context?: LogContext) =>
            log("warn", message, context),
        error: (message: string, error?: unknown, context?: LogContext) => {
            const errorContext = error
                ? { ...serializeError(error), ...context }
                : context;
            log("error", message, errorContext);
        },
        timer,
        batch,
        // Create a child logger with a specific module context
        child: (module: string): Logger => ({
            debug: (message: string, context?: LogContext) =>
                log("debug", message, context, module),
            info: (message: string, context?: LogContext) =>
                log("info", message, context, module),
            warn: (message: string, context?: LogContext) =>
                log("warn", message, context, module),
            error: (message: string, error?: unknown, context?: LogContext) => {
                const errorContext = error
                    ? { ...serializeError(error), ...context }
                    : context;
                log("error", message, errorContext, module);
            },
            timer: (label: string) => timer(label, module),
            batch: (entries) => batch(entries, module),
            child: (subModule: string) =>
                createLogger(config).child(`${module}:${subModule}`),
        }),
    };
};

// Logger type definition
export interface Logger {
    debug: (message: string, context?: LogContext) => void;
    info: (message: string, context?: LogContext) => void;
    warn: (message: string, context?: LogContext) => void;
    error: (
        message: string,
        error?: unknown,
        context?: LogContext
    ) => void;
    timer: (label: string) => { end: (context?: LogContext) => number };
    batch: (
        entries: Array<{ level: LogLevel; message: string; context?: LogContext }>
    ) => void;
    child: (module: string) => Logger;
}

// Export singleton instance with default config
export const logger = createLogger();

// Export factory for custom configurations
export { createLogger };

// Utility functions for common logging patterns
export const logAsync = async <T>(
    promise: Promise<T>,
    successMsg: string,
    errorMsg: string,
    context?: LogContext
): Promise<T> => {
    try {
        const result = await promise;
        logger.info(successMsg, context);
        return result;
    } catch (error) {
        logger.error(errorMsg, error, context);
        throw error;
    }
};
