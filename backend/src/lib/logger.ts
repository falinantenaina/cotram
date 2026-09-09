import fs from "fs";
import path from "path";

const logDir = path.join(process.cwd(), "logs");
const logFile = path.join(logDir, "server.log");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function formatError(err: unknown): string {
  if (err instanceof Error) {
    return `${err.message}\n${err.stack}`;
  }
  return String(err);
}

export function logError(context: string, err: unknown) {
  const line = `[${new Date().toISOString()}] [${context}] ${formatError(err)}\n`;
  fs.appendFileSync(logFile, line);
  console.error(line);
}

export function logInfo(message: string) {
  const line = `[${new Date().toISOString()}] [INFO] ${message}\n`;
  fs.appendFileSync(logFile, line);
  console.log(line);
}
