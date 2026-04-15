type LogPayload = Record<string, unknown> | undefined;

function write(level: "info" | "warn" | "error", message: string, payload?: LogPayload) {
  const entry = {
    level,
    message,
    payload,
    timestamp: new Date().toISOString(),
  };

  console[level](JSON.stringify(entry));
}

export const logger = {
  info(message: string, payload?: LogPayload) {
    write("info", message, payload);
  },
  warn(message: string, payload?: LogPayload) {
    write("warn", message, payload);
  },
  error(message: string, payload?: LogPayload) {
    write("error", message, payload);
  },
};
