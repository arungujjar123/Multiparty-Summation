import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "@/lib/server/auth";
import { appendDocSectionPdf, getDocSectionById, removeDocSectionPdf } from "@/lib/server/docs";
import { deleteCloudinaryAsset, uploadPdfToCloudinary } from "@/lib/server/cloudinary";

export const runtime = "nodejs";

// Increase body size limit to 10MB for PDF uploads (overrides Next.js 4MB default)
export const maxDuration = 60;

const MAX_PDF_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = await getUserBySessionToken(token);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await getDocSectionById(id);
  if (!existing) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
  }

  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json({ error: "PDF exceeds 10MB limit" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let uploadResult: { url: string; publicId: string };

  try {
    uploadResult = await uploadPdfToCloudinary(buffer, file.name, `docs/${id}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const updated = await appendDocSectionPdf(id, {
    url: uploadResult.url,
    name: file.name,
    publicId: uploadResult.publicId,
    uploadedAt: new Date().toISOString(),
  });

  if (!updated) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  return NextResponse.json({ section: updated }, { status: 200 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = await getUserBySessionToken(token);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await getDocSectionById(id);
  if (!existing) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  let payload: { publicId?: string } = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  if (!payload.publicId) {
    return NextResponse.json({ error: "publicId is required" }, { status: 400 });
  }

  try {
    await deleteCloudinaryAsset(payload.publicId);
  } catch {
    // Ignore delete errors to avoid blocking removal
  }

  const updated = await removeDocSectionPdf(id, payload.publicId);
  if (!updated) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  return NextResponse.json({ section: updated }, { status: 200 });
}
