// src/utils/logger.ts
import winston from "winston";
import util from "util";
import fs from "fs";
import path from "path";

// Ensure logs directory exists (prevents crash)
const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

// Simple safe formatter for metadata
function safeMeta(meta: any): string {
  if (!meta || Object.keys(meta).length === 0) return "";
  return util.inspect(meta, { depth: null, colors: true });
}

const devFormat = winston.format.printf(({ timestamp, level, message, ...meta }) => {
  return `${timestamp} [${level}] ${message} ${safeMeta(meta)}`;
});

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  defaultMeta: { service: "research-agent-backend" },

  format:
    process.env.NODE_ENV === "production"
      ? prodFormat
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
          devFormat
        ),

  transports: [
    // Console (dev only)
    ...(process.env.NODE_ENV !== "production"
      ? [
          new winston.transports.Console({
            handleExceptions: true,
          }),
        ]
      : []),

    // Errors → error.log
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      handleExceptions: true,
    }),

    // Everything → combined.log
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
    }),
  ],

  exitOnError: false, // Do not crash on logging errors
});

// Optional: integrate with morgan (HTTP request logger)
(logger as any).stream = {
  write(message: string) {
    logger.http(message.trim());
  },
};

export { logger };
