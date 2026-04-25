import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import path from "path";
import cloudinary from "@/lib/server/cloudinary";
import {
    getUserBySessionToken,
    SESSION_COOKIE_NAME,
} from "@/lib/server/auth";

export const runtime = "nodejs";

const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * Server-side upload fallback.
 * NOTE: Next.js App Router limits request bodies to ~1-4 MB by default.
 * For larger files, the client should use the direct-to-Cloudinary upload
 * via the /api/admin/docs/upload-signature endpoint instead.
 */
export async function POST(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const user = await getUserBySessionToken(token);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
        return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    const fileName = file.name || "document.pdf";
    const isPdfType = file.type === "application/pdf";
    const isPdfName = fileName.toLowerCase().endsWith(".pdf");

    if (!isPdfType && !isPdfName) {
        return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
        return NextResponse.json(
            { error: "PDF is too large. Maximum allowed size is 50 MB." },
            { status: 400 }
        );
    }

    // Validate Cloudinary credentials before attempting upload
    if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
    ) {
        console.error("[Cloudinary] Missing environment variables");
        return NextResponse.json(
            { error: "Cloud storage is not configured. Check server environment variables." },
            { status: 500 }
        );
    }

    // Upload PDF to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    resource_type: "raw",
                    folder: "pdf-uploads",
                    public_id: path.basename(fileName, path.extname(fileName)),
                    format: "pdf",
                    use_filename: true,
                    unique_filename: true,
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            ).end(buffer);
        });

        const { secure_url, public_id, bytes } = uploadResult as any;
        return NextResponse.json(
            {
                file: {
                    name: fileName,
                    publicId: public_id,
                    url: secure_url,
                    size: bytes,
                },
            },
            { status: 201 }
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[Cloudinary Upload Error]", message, err);
        return NextResponse.json({ error: "Cloud upload failed", details: message }, { status: 500 });
    }
}
