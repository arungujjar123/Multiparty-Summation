import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import cloudinary from "@/lib/server/cloudinary";
import {
    getUserBySessionToken,
    SESSION_COOKIE_NAME,
} from "@/lib/server/auth";

export const runtime = "nodejs";

/**
 * Generates a Cloudinary upload signature so the browser can upload
 * the PDF directly to Cloudinary, bypassing the Next.js body-size limit.
 */
export async function POST() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const user = await getUserBySessionToken(token);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        return NextResponse.json(
            { error: "Cloud storage is not configured. Check server environment variables." },
            { status: 500 }
        );
    }

    const timestamp = Math.round(Date.now() / 1000);
    const params = {
        timestamp,
        folder: "pdf-uploads",
        use_filename: true,
        unique_filename: true,
    };

    const signature = cloudinary.utils.api_sign_request(
        params,
        apiSecret
    );

    return NextResponse.json({
        signature,
        timestamp,
        cloudName,
        apiKey,
        folder: "pdf-uploads",
    });
}
