import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import cloudinary from "@/lib/server/cloudinary";
import {
    getUserBySessionToken,
    SESSION_COOKIE_NAME,
} from "@/lib/server/auth";

export const runtime = "nodejs";

/**
 * Deletes a PDF file from Cloudinary.
 * Expects { url: string } in request body.
 */
export async function POST(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const user = await getUserBySessionToken(token);

    if (!user || user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { url } = await req.json();
        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        // Extract public_id from Cloudinary URL
        // Example: https://res.cloudinary.com/cloudname/raw/upload/v123/pdf-uploads/file.pdf
        // Public ID for raw files often includes the extension.
        const parts = url.split("/");
        const uploadIdx = parts.indexOf("upload");
        if (uploadIdx === -1) {
            return NextResponse.json({ error: "Invalid Cloudinary URL" }, { status: 400 });
        }

        // The public_id starts after the version (v1234567)
        // Everything after version is the path/public_id
        const publicIdWithVersion = parts.slice(uploadIdx + 2).join("/");
        const publicId = publicIdWithVersion; // Cloudinary 'raw' files keep extension

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: "raw",
            invalidate: true
        });

        if (result.result !== "ok" && result.result !== "not found") {
            return NextResponse.json({ error: "Cloudinary deletion failed", detail: result }, { status: 500 });
        }

        return NextResponse.json({ success: true, result: result.result });
    } catch (error) {
        console.error("Delete PDF Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
