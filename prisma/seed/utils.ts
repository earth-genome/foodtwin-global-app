import fs from "fs-extra";
import path from "path";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client/extension";
import { POSTGRES_CONNECTION_STRING } from "./config";

export function round(value: number, decimals = 2) {
  return Number(Math.round(Number(value + "e" + decimals)) + "e-" + decimals);
}

export function msToSeconds(ms: number) {
  return round(ms / 1000);
}

export function msToMinutes(ms: number) {
  return round(ms / 60000);
}

let lastTimestamp = Date.now();

export function log(message: string) {
  const currentTimestamp = Date.now();
  const diff = ((currentTimestamp - lastTimestamp) / 1000).toFixed(2); // Time difference in seconds
  const formattedTimestamp = new Date(currentTimestamp).toISOString(); // Format current time
  console.log(`[${formattedTimestamp}] (+${diff}s) ${message}`); // eslint-disable-line no-console
  lastTimestamp = currentTimestamp;
}

export async function runOgr2Ogr(
  filePath: string,
  ...args: string[]
): Promise<void> {
  const { execa } = await import("execa");

  // Escape the file path by wrapping it in quotes
  const escapedPath = `"${filePath}"`;

  const command = `ogr2ogr -f "PostgreSQL" PG:${POSTGRES_CONNECTION_STRING} ${escapedPath} ${args.join(" ")}`;

  await execa(command, { shell: true });
}

/**
 * Recursively lists all files in a directory
 * @param {string} dir - The directory to list files from
 * @param {string[]} fileList - The list of files (used for recursion)
 * @returns {Promise<string[]>} - A promise that resolves with the list of files
 */
export async function listFilesRecursively(
  dir: string,
  fileList = [] as string[]
): Promise<string[]> {
  const files = await fs.readdir(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);

    if (stat.isDirectory()) {
      // Recursively list files in the subdirectory
      await listFilesRecursively(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }

  return fileList;
}

export async function optimizeDb(prisma: PrismaClient) {
  // Terminate other sessions to avoid conflicts
  await prisma.$executeRaw`
  SELECT pg_terminate_backend(pg_stat_activity.pid)
  FROM pg_stat_activity
  WHERE pg_stat_activity.datname = current_database()
    AND pid <> pg_backend_pid();
`;

  // Set PostgreSQL optimizations for this session
  await prisma.$executeRaw`SET work_mem = '128MB'`;
  await prisma.$executeRaw`SET maintenance_work_mem = '1GB'`;
  await prisma.$executeRaw`SET synchronous_commit = 'off'`;
  await prisma.$executeRaw`SET wal_compression = 'on'`;
  await prisma.$executeRaw`SET effective_cache_size = '2GB'`;
  await prisma.$executeRaw`SET max_parallel_workers_per_gather = 4`;
  await prisma.$executeRaw`SET max_parallel_workers = 8`;
  await prisma.$executeRaw`SET log_min_duration_statement = 1000`;
  await prisma.$executeRaw`SET random_page_cost = 1.1`;
}

export function generateNumericId(input: string): bigint {
  const hash = crypto.createHash("sha256").update(input).digest("hex");
  return BigInt("0x" + hash.slice(0, 15));
}
