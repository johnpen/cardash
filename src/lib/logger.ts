type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const envLevel = (process.env.LOG_LEVEL as Level) || (process.env.NODE_ENV === "production" ? "info" : "debug");
const threshold = LEVELS[envLevel] ?? LEVELS.info;

function ts() {
  return new Date().toISOString();
}

function shouldLog(level: Level) {
  return (LEVELS[level] ?? LEVELS.info) >= threshold;
}

function fmt(ctx: string, msg: string, extra?: Record<string, unknown>) {
  const base = { t: ts(), level: ctx, msg, ...extra };
  return JSON.stringify(base);
}

export const logger = {
  debug(msg: string, extra?: Record<string, unknown>) {
    if (!shouldLog("debug")) return;
    console.debug(fmt("debug", msg, extra));
  },
  info(msg: string, extra?: Record<string, unknown>) {
    if (!shouldLog("info")) return;
    console.log(fmt("info", msg, extra));
  },
  warn(msg: string, extra?: Record<string, unknown>) {
    if (!shouldLog("warn")) return;
    console.warn(fmt("warn", msg, extra));
  },
  error(msg: string, extra?: Record<string, unknown>) {
    if (!shouldLog("error")) return;
    console.error(fmt("error", msg, extra));
  },
};
