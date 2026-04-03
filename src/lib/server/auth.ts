import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { User, UserRole } from "@/lib/auth";

const USERS_COLLECTION = "users";
const SESSIONS_COLLECTION = "sessions";

const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || "admin@shamir.edu";
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";
const DEFAULT_ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME || "Admin User";

export const SESSION_COOKIE_NAME = "shamir_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

interface UserDoc {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

interface SessionDoc {
  _id: ObjectId;
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toSafeUser(user: UserDoc): User {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function ensureDefaultAdmin() {
  const db = await getDb();
  const email = normalizeEmail(DEFAULT_ADMIN_EMAIL);

  const existing = await db.collection<UserDoc>(USERS_COLLECTION).findOne({ email });

  if (existing) {
    if (existing.role !== "admin") {
      await db.collection<UserDoc>(USERS_COLLECTION).updateOne(
        { _id: existing._id },
        { $set: { role: "admin" } }
      );
    }
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  const now = new Date().toISOString();

  await db.collection<UserDoc>(USERS_COLLECTION).insertOne({
    email,
    passwordHash,
    name: DEFAULT_ADMIN_NAME,
    role: "admin",
    createdAt: now,
  } as UserDoc);
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  const normalized = normalizeEmail(email);
  return db.collection<UserDoc>(USERS_COLLECTION).findOne({ email: normalized });
}

export async function createUser(params: {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}): Promise<User> {
  const db = await getDb();
  const now = new Date().toISOString();
  const normalized = normalizeEmail(params.email);
  const passwordHash = await bcrypt.hash(params.password, 10);

  const result = await db.collection<UserDoc>(USERS_COLLECTION).insertOne({
    email: normalized,
    passwordHash,
    name: params.name.trim(),
    role: params.role || "student",
    createdAt: now,
  } as UserDoc);

  return {
    id: result.insertedId.toString(),
    email: normalized,
    name: params.name.trim(),
    role: params.role || "student",
    createdAt: now,
  };
}

export async function verifyUserCredentials(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return null;

  return toSafeUser(user);
}

export async function createSession(userId: string) {
  const db = await getDb();
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);

  await db.collection<SessionDoc>(SESSIONS_COLLECTION).insertOne({
    token,
    userId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  } as SessionDoc);

  return { token, expiresAt: expiresAt.toISOString() };
}

export async function getUserBySessionToken(token?: string): Promise<User | null> {
  if (!token) return null;

  const db = await getDb();
  const session = await db.collection<SessionDoc>(SESSIONS_COLLECTION).findOne({ token });

  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) {
    await db.collection<SessionDoc>(SESSIONS_COLLECTION).deleteOne({ _id: session._id });
    return null;
  }

  if (!ObjectId.isValid(session.userId)) {
    return null;
  }

  const user = await db
    .collection<UserDoc>(USERS_COLLECTION)
    .findOne({ _id: new ObjectId(session.userId) });

  return user ? toSafeUser(user) : null;
}

export async function deleteSessionToken(token?: string) {
  if (!token) return;
  const db = await getDb();
  await db.collection<SessionDoc>(SESSIONS_COLLECTION).deleteOne({ token });
}

export async function listUsers(): Promise<User[]> {
  const db = await getDb();
  const users = await db.collection<UserDoc>(USERS_COLLECTION).find({}).toArray();
  return users.map(toSafeUser);
}

export async function updateUserRole(userId: string, role: UserRole) {
  if (!ObjectId.isValid(userId)) return false;

  const db = await getDb();
  const result = await db
    .collection<UserDoc>(USERS_COLLECTION)
    .updateOne({ _id: new ObjectId(userId) }, { $set: { role } });

  return result.matchedCount > 0;
}

export async function deleteUserById(userId: string) {
  if (!ObjectId.isValid(userId)) return false;

  const db = await getDb();
  const objectId = new ObjectId(userId);

  const result = await db.collection<UserDoc>(USERS_COLLECTION).deleteOne({ _id: objectId });
  if (result.deletedCount === 0) return false;

  await db.collection<SessionDoc>(SESSIONS_COLLECTION).deleteMany({ userId });
  return true;
}
