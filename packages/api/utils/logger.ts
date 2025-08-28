/**
 * Centralized logging utility for the API backend
 * 
 * Provides structured logging with different levels and contexts.
 * Replaces console.log statements throughout the codebase for better 
 * debugging, monitoring, and production readiness.
 * 
 * @example
 * import { logger } from '../utils/logger';
 * 
 * logger.info('User authenticated', { userId, businessId });
 * logger.error('Payment failed', { error, paymentId });
 * logger.debug('Processing booking', { bookingData });
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogContext = Record<string, any>;

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext, module?: string): string {
    const timestamp = new Date().toISOString();
    const levelEmoji = this.getLevelEmoji(level);
    const modulePrefix = module ? `[${module}] ` : '';
    const contextString = context ? ` ${JSON.stringify(context)}` : '';

    return `${levelEmoji} ${timestamp} ${modulePrefix}${message}${contextString}`;
  }

  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case 'debug': return '🔍';
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) {
      return true; // Log everything in development
    }

    // In production, only log info, warn, and error
    return level !== 'debug';
  }

  private log(level: LogLevel, message: string, context?: LogContext, module?: string): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, context, module);

    switch (level) {
      case 'debug':
      case 'info':
        console.log(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
  }

  /**
   * Log debug information (development only)
   * @param message - The debug message
   * @param context - Additional context data
   * @param module - Module name for identification
   */
  debug(message: string, context?: LogContext, module?: string): void {
    this.log('debug', message, context, module);
  }

  /**
   * Log general information
   * @param message - The info message
   * @param context - Additional context data
   * @param module - Module name for identification
   */
  info(message: string, context?: LogContext, module?: string): void {
    this.log('info', message, context, module);
  }

  /**
   * Log warning messages
   * @param message - The warning message
   * @param context - Additional context data
   * @param module - Module name for identification
   */
  warn(message: string, context?: LogContext, module?: string): void {
    this.log('warn', message, context, module);
  }

  /**
   * Log error messages
   * @param message - The error message
   * @param context - Additional context data
   * @param module - Module name for identification
   */
  error(message: string, context?: LogContext, module?: string): void {
    this.log('error', message, context, module);
  }

  /**
   * Create a module-specific logger
   * @param module - Module name
   * @returns Logger instance with pre-set module context
   */
  createModuleLogger(module: string) {
    return {
      debug: (message: string, context?: LogContext) => this.debug(message, context, module),
      info: (message: string, context?: LogContext) => this.info(message, context, module),
      warn: (message: string, context?: LogContext) => this.warn(message, context, module),
      error: (message: string, context?: LogContext) => this.error(message, context, module),
    };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export factory function for module-specific loggers
export const createLogger = (module: string) => logger.createModuleLogger(module);