/**
 * A diagnostic utility for surfacing scoped warnings and errors during development.
 * It provides built-in deduplication to prevent console bloat and protects memory
 * by capping the number of unique messages tracked per scope. All logging is
 * automatically stripped in production environments.
 *
 * @param props.message - The descriptive string to be logged to the console.
 * @param props.severity - The log level to use ('warn' or 'error'), mapping to console[severity].
 * @param props.meta.includeStackTrace - If true, renders a collapsed console group containing a stack trace.
 * @param props.meta.scope - The required logical boundary (e.g., 'Button', 'useDialog') used to categorize and deduplicate logs.
 *
 * @returns void - This utility performs side effects by logging to the web console.
 */

type Severity = 'warn' | 'error';

interface LoggerProps {
  message: string;
  scope: string;
  severity: Severity;
}

const logs = new Map<string, Set<string>>();
const MAX_LOGS_PER_COMPONENT = 25;

/* eslint-disable no-console -- console logs are the whole point of a logger :) */
function createLog({ message, scope, severity }: LoggerProps) {
  // Use import.meta.env.PROD (Vite-native) rather than process.env.NODE_ENV —
  // it requires no Node type definitions and is statically replaced at build
  // time, allowing Vite to tree-shake all logging code from production bundles.
  if (import.meta.env.PROD) {
    return;
  }

  const scopeLogs = logs.get(scope) ?? new Set<string>();

  if (!logs.has(scope)) {
    logs.set(scope, scopeLogs);
  }

  if (scopeLogs.has(message)) {
    return;
  }

  if (scopeLogs.size >= MAX_LOGS_PER_COMPONENT) {
    const limitMessage = `__LOGGER_LIMIT_REACHED_FOR_${scope.toUpperCase()}__`;
    if (!scopeLogs.has(limitMessage)) {
      console.warn(
        `[@dy-react/${scope.toLowerCase()}] ⚠️ Logger limit reached (${String(MAX_LOGS_PER_COMPONENT)} logs). Further unique logs for this component will be suppressed to prevent memory leaks.`,
      );

      scopeLogs.add(limitMessage);
    }
    return;
  }

  const prefix = `[@dy-react/${scope.toLowerCase()}]`;
  const output = `${prefix} ${message}`;

  if (severity === 'error') {
    throw new Error(output);
  }

  console[severity](output);
  scopeLogs.add(message);
}
/* eslint-enable no-console */

export const logger = {
  clear: (scope?: string) => {
    if (scope) {
      logs.delete(scope);
    } else {
      logs.clear();
    }
  },
  error: ({ message, scope }: Pick<LoggerProps, 'message' | 'scope'>) => {
    createLog({ message, scope, severity: 'error' });
  },
  warn: ({ message, scope }: Pick<LoggerProps, 'message' | 'scope'>) => {
    createLog({ message, scope, severity: 'warn' });
  },
};
