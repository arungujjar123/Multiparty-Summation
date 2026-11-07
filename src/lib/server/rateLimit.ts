/**
 * @fileoverview Fixed-window rate limiting backed by MongoDB
 * Protects paid/limited LLM API quota from abuse
 */

import { getDb } from "@/lib/mongodb";

const COLLECTION = "rate_limits";
const WINDOW_SECONDS = 60 * 60;

interface RateLimitDoc {
  _id: string;
  count: number;
  expiresAt: Date;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
}

let indexReady: Promise<string> | null = null;

export async function checkRateLimit(
  scope: string,
  userId: string,
  limit: number
): Promise<RateLimitResult> {
  const db = await getDb();
  const col = db.collection<RateLimitDoc>(COLLECTION);
  // TTL index lets MongoDB delete expired windows automatically
  indexReady ??= col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await indexReady;

  const windowStart = Math.floor(Date.now() / 1000 / WINDOW_SECONDS) * WINDOW_SECONDS;
  const resetAt = new Date((windowStart + WINDOW_SECONDS) * 1000);
  const doc = await col.findOneAndUpdate(
    { _id: `${scope}:${userId}:${windowStart}` },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: resetAt } },
    { upsert: true, returnDocument: "after" }
  );

  const count = doc?.count ?? 1;
  return { allowed: count <= limit, remaining: Math.max(0, limit - count), limit, resetAt };
}

export function getAiRateLimit(): number {
  const parsed = Number(process.env.AI_RATE_LIMIT_PER_HOUR);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
}
