import { getDb } from "@/lib/mongodb";

const DOCS_COLLECTION = "docs";

export interface DocSection {
  id: string;
  title: string;
  icon: string;
  content: string;
  order: number;
  lastModified: string;
  createdAt: string;
}

export const DEFAULT_DOC_SECTIONS: Array<Omit<DocSection, "content" | "lastModified" | "createdAt">> = [
  { id: "introduction", title: "Introduction", icon: "📖", order: 1 },
  { id: "shamir", title: "Shamir's Scheme", icon: "🔐", order: 2 },
  { id: "summation", title: "Summation Protocol", icon: "➕", order: 3 },
  { id: "multiplication", title: "Multiplication Protocol", icon: "✖️", order: 4 },
  { id: "quantum", title: "Quantum Protocols", icon: "⚛️", order: 5 },
  { id: "security", title: "Security Properties", icon: "🛡️", order: 6 },
  { id: "implementation", title: "Implementation", icon: "💻", order: 7 },
  { id: "references", title: "References", icon: "📚", order: 8 },
];

export async function ensureDefaultDocs() {
  const db = await getDb();
  const collection = db.collection<DocSection>(DOCS_COLLECTION);

  const existing = (await collection
    .find({ id: { $in: DEFAULT_DOC_SECTIONS.map((section) => section.id) } })
    .project<Pick<DocSection, "id">>({ id: 1 })
    .toArray()) as Array<Pick<DocSection, "id">>;

  const existingIds = new Set(existing.map((doc) => doc.id));
  const now = new Date().toISOString();

  const missing = DEFAULT_DOC_SECTIONS.filter((section) => !existingIds.has(section.id));
  if (missing.length === 0) return;

  await collection.insertMany(
    missing.map((section) => ({
      ...section,
      content: "",
      createdAt: now,
      lastModified: now,
    }))
  );
}

export async function getDocSections() {
  const db = await getDb();
  const collection = db.collection<DocSection>(DOCS_COLLECTION);

  const docs = (await collection.find({}).sort({ order: 1 }).toArray()) as DocSection[];
  return docs.map((doc) => ({
    id: doc.id,
    title: doc.title,
    icon: doc.icon,
    content: doc.content,
    order: doc.order,
    lastModified: doc.lastModified,
    createdAt: doc.createdAt,
  }));
}

export async function createDocSection(params: {
  title: string;
  icon: string;
}) {
  const db = await getDb();
  const collection = db.collection<DocSection>(DOCS_COLLECTION);

  const title = params.title.trim();
  const icon = params.icon.trim() || "📄";
  const id = title.toLowerCase().replace(/\s+/g, "-");

  const existing = await collection.findOne({ id });
  if (existing) {
    return { error: "Section with this title already exists" };
  }

  const last = await collection.find({}).sort({ order: -1 }).limit(1).toArray();
  const nextOrder = last.length > 0 ? (last[0].order || 0) + 1 : 1;

  const now = new Date().toISOString();

  const doc: DocSection = {
    id,
    title,
    icon,
    content: "",
    order: nextOrder,
    createdAt: now,
    lastModified: now,
  };

  await collection.insertOne(doc);
  return { section: doc };
}

export async function updateDocSection(id: string, updates: Partial<Pick<DocSection, "title" | "icon" | "content">>) {
  const db = await getDb();
  const collection = db.collection<DocSection>(DOCS_COLLECTION);

  const payload: Partial<DocSection> = {
    lastModified: new Date().toISOString(),
  };

  if (typeof updates.title === "string" && updates.title.trim()) {
    payload.title = updates.title.trim();
  }

  if (typeof updates.icon === "string" && updates.icon.trim()) {
    payload.icon = updates.icon.trim();
  }

  if (typeof updates.content === "string") {
    payload.content = updates.content;
  }

  const result = await collection.findOneAndUpdate(
    { id },
    { $set: payload },
    { returnDocument: "after" }
  );

  if (!result.value) return null;

  const { id: updatedId, title, icon, content, order, lastModified, createdAt } = result.value;
  return { id: updatedId, title, icon, content, order, lastModified, createdAt };
}

export async function deleteDocSection(id: string) {
  const db = await getDb();
  const collection = db.collection<DocSection>(DOCS_COLLECTION);
  const result = await collection.deleteOne({ id });
  return result.deletedCount > 0;
}
