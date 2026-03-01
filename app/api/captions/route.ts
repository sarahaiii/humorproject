import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const API_BASE = "https://api.almostcrackd.ai";

type PresignResp =
    | { presignedUrl: string; cdnUrl: string }
    | { uploadUrl: string; cdnUrl: string }
    | { url: string; fields: Record<string, string>; cdnUrl: string };

function pickPresignShape(j: any): {
    cdnUrl: string;
    kind: "put" | "post";
    putUrl?: string;
    postUrl?: string;
    fields?: Record<string, string>;
} | null {
    if (!j) return null;

    // Most common (per your assignment screenshot)
    if (typeof j.presignedUrl === "string" && typeof j.cdnUrl === "string") {
        return { cdnUrl: j.cdnUrl, kind: "put", putUrl: j.presignedUrl };
    }

    // Some people name it uploadUrl
    if (typeof j.uploadUrl === "string" && typeof j.cdnUrl === "string") {
        return { cdnUrl: j.cdnUrl, kind: "put", putUrl: j.uploadUrl };
    }

    // Some presign systems use POST form fields to S3
    if (
        typeof j.url === "string" &&
        j.fields &&
        typeof j.fields === "object" &&
        typeof j.cdnUrl === "string"
    ) {
        return { cdnUrl: j.cdnUrl, kind: "post", postUrl: j.url, fields: j.fields };
    }

    return null;
}

async function getSessionToken() {
    const supabase = await createClient();
    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();

    if (error || !session?.access_token) return null;
    return { supabase, session };
}

// Handles BOTH:
// 1) multipart upload -> does pipeline steps 1-4 and returns captions
// 2) json { imageId, content/text } -> saves caption into Supabase
export async function POST(req: Request) {
    const sessionBundle = await getSessionToken();
    if (!sessionBundle) {
        return NextResponse.json(
            { error: "Not logged in / missing session" },
            { status: 401 }
        );
    }
    const { supabase, session } = sessionBundle;

    const contentType = req.headers.get("content-type") || "";

    // -----------------------------
    // JSON: save caption to DB
    // -----------------------------
    if (contentType.includes("application/json")) {
        const body = await req.json().catch(() => ({}));
        const imageId = body?.imageId;
        const content = (body?.content ?? body?.text ?? "").toString().trim();

        if (!imageId || !content) {
            return NextResponse.json(
                { error: "Missing imageId or content" },
                { status: 400 }
            );
        }

        // Your table column is `content` (NOT `text`)
        const insertPayload: any = {
            image_id: imageId,
            content,
            profile_id: session.user.id,
            is_public: true,
        };

        const { data, error } = await supabase
            .from("captions")
            .insert(insertPayload)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ ok: true, caption: data });
    }

    // -----------------------------
    // Multipart: upload + generate
    // -----------------------------
    if (!contentType.includes("multipart/form-data")) {
        return NextResponse.json(
            { error: "Unsupported Content-Type" },
            { status: 415 }
        );
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
        return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    // Step 1: presign
    const presignRes = await fetch(`${API_BASE}/pipeline/generate-presigned-url`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ contentType: file.type || "image/jpeg" }),
    });

    const presignJson = await presignRes.json().catch(() => ({}));
    if (!presignRes.ok) {
        return NextResponse.json(
            { error: presignJson?.error ?? "Presign failed", detail: presignJson },
            { status: presignRes.status }
        );
    }

    const presign = pickPresignShape(presignJson);
    if (!presign) {
        return NextResponse.json(
            {
                error:
                    "Unknown presigned shape (missing presignedUrl OR uploadUrl OR {url,fields})",
                detail: presignJson,
            },
            { status: 500 }
        );
    }

    // Step 2: upload bytes to S3
    if (presign.kind === "put") {
        const putUrl = presign.putUrl!;
        const putRes = await fetch(putUrl, {
            method: "PUT",
            headers: {
                "Content-Type": file.type || "image/jpeg",
            },
            body: file,
        });

        if (!putRes.ok) {
            const t = await putRes.text().catch(() => "");
            return NextResponse.json(
                { error: "Upload failed", detail: t },
                { status: 500 }
            );
        }
    } else {
        // POST form upload
        const fd = new FormData();
        for (const [k, v] of Object.entries(presign.fields || {})) fd.append(k, v);
        fd.append("file", file);

        const postRes = await fetch(presign.postUrl!, {
            method: "POST",
            body: fd,
        });

        if (!postRes.ok) {
            const t = await postRes.text().catch(() => "");
            return NextResponse.json(
                { error: "Upload failed", detail: t },
                { status: 500 }
            );
        }
    }

    // Step 3: register image url
    const registerRes = await fetch(`${API_BASE}/pipeline/upload-image-from-url`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl: presign.cdnUrl, isCommonUse: false }),
    });

    const registerJson = await registerRes.json().catch(() => ({}));
    if (!registerRes.ok || !registerJson?.imageId) {
        return NextResponse.json(
            { error: "Register image failed", detail: registerJson },
            { status: registerRes.ok ? 500 : registerRes.status }
        );
    }

    const imageId = registerJson.imageId as string;

    // Step 4: generate captions
    const capRes = await fetch(`${API_BASE}/pipeline/generate-captions`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageId }),
    });

    const capJson = await capRes.json().catch(() => ({}));
    if (!capRes.ok) {
        return NextResponse.json(
            { error: "Generate captions failed", detail: capJson },
            { status: capRes.status }
        );
    }

    // capJson might be an array, or {captions:[...]}
    const captions = Array.isArray(capJson) ? capJson : capJson?.captions ?? [];

    return NextResponse.json({
        imageId,
        cdnUrl: presign.cdnUrl,
        captions,
    });
}