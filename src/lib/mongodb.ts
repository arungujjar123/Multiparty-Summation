import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "shamir_secret";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getDb() {
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set. Please check your configuration.");
  }

  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }

  const client = await global._mongoClientPromise;
  return client.db(dbName);
}
