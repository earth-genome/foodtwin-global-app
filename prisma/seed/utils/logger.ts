import fs from "fs-extra";
import path from "path";
import { INGEST_LOGS_PATH } from "../config";

export interface LoggerOptions {
  logFileName?: string;
  ingestMode?: string;
  logToFile?: boolean;
}

export class Logger {
  private logFilePath: string | null = null;
  private lastTimestamp = Date.now();

  constructor(options: LoggerOptions = {}) {
    if (options.logToFile !== false) {
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      const ingestMode =
        options.ingestMode || process.env.INGESTION_MODE || "default";
      const logsDir = INGEST_LOGS_PATH;

      fs.ensureDirSync(logsDir);

      const fileName =
        options.logFileName || `ingest_log_${timestamp}_${ingestMode}.txt`;
      this.logFilePath = path.resolve(logsDir, fileName);
    }
  }

  log(message: string) {
    const currentTimestamp = Date.now();
    const diff = ((currentTimestamp - this.lastTimestamp) / 1000).toFixed(2);
    const formattedTimestamp = new Date(currentTimestamp).toISOString();
    const logMessage = `[${formattedTimestamp}] (+${diff}s) ${message}`;

    // eslint-disable-next-line no-console
    console.log(logMessage);

    if (this.logFilePath) {
      fs.appendFileSync(this.logFilePath, logMessage + "\n");
    }

    this.lastTimestamp = currentTimestamp;
  }

  logError(error: Error | string) {
    const currentTimestamp = new Date().toISOString();
    const logMessage =
      error instanceof Error
        ? `${currentTimestamp}: ${error.stack}\n`
        : `${currentTimestamp}: ${error}\n`;

    // eslint-disable-next-line no-console
    console.error(logMessage);

    if (this.logFilePath) {
      fs.appendFileSync(this.logFilePath, logMessage);
    }
  }
}

// Create a default logger instance for backward compatibility
export const createFlowLogger = (ingestMode?: string) => {
  return new Logger({
    logFileName: `flow_ingest_log_${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(
        0,
        19
      )}_${ingestMode || process.env.INGESTION_MODE || "default"}.txt`,
    ingestMode,
  });
};
