import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type GeneratedCaptionRow = {
    id: string;
    content: string;
    image_id: string;
};

export async function POST(req: Request) {
    const supabase = await createClient();

    const {
        data: { session },
        error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user || !session.access_token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";

    // -------------------------
    // MODE 1: manually add caption
    // -------------------------
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

        const { data, error } = await supabase
            .from("captions")
            .insert({
                image_id: imageId,
                content,
                profile_id: session.user.id,
                is_public: true,
                created_by_user_id: session.user.id,
                modified_by_user_id: session.user.id,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json({
            ok: true,
            caption: data,
        });
    }

    // -------------------------
    // MODE 2: upload image + generate captions
    // -------------------------
    if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        const accessToken = session.access_token;

        // STEP 1: request presigned URL
        const presignedRes = await fetch(
            "https://api.almostcrackd.ai/pipeline/generate-presigned-url",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contentType: file.type || "image/png",
                }),
            }
        );

        const presignedText = await presignedRes.text();

        if (!presignedRes.ok) {
            return NextResponse.json(
                {
                    error: "Failed to get presigned URL",
                    detail: presignedText,
                },
                { status: 500 }
            );
        }

        let presignedJson: any;
        try {
            presignedJson = JSON.parse(presignedText);
        } catch {
            return NextResponse.json(
                {
                    error: "Presign returned non-JSON response",
                    detail: presignedText,
                },
                { status: 500 }
            );
        }

        const presignedUrl =
            presignedJson.presignedUrl ||
            presignedJson.uploadUrl ||
            presignedJson.url;

        const cdnUrl =
            presignedJson.cdnUrl ||
            presignedJson.cdn_url ||
            presignedJson.fileUrl ||
            presignedJson.publicUrl;

        if (!presignedUrl || !cdnUrl) {
            return NextResponse.json(
                {
                    error: "Presign response missing upload URL or CDN URL",
                    detail: JSON.stringify(presignedJson, null, 2),
                },
                { status: 500 }
            );
        }

        // STEP 2: upload file directly to S3
        const uploadRes = await fetch(presignedUrl, {
            method: "PUT",
            body: file,
        });

        const uploadText = await uploadRes.text();

        if (!uploadRes.ok) {
            return NextResponse.json(
                {
                    error: "File upload failed",
                    detail: uploadText,
                },
                { status: 500 }
            );
        }

        // STEP 3: register uploaded image with Crack'd
        const registerRes = await fetch(
            "https://api.almostcrackd.ai/pipeline/upload-image-from-url",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    imageUrl: cdnUrl,
                }),
            }
        );

        const registerText = await registerRes.text();

        if (!registerRes.ok) {
            return NextResponse.json(
                {
                    error: "Failed to register uploaded image",
                    detail: registerText,
                },
                { status: 500 }
            );
        }

        let registerJson: any;
        try {
            registerJson = JSON.parse(registerText);
        } catch {
            return NextResponse.json(
                {
                    error: "Image registration returned non-JSON response",
                    detail: registerText,
                },
                { status: 500 }
            );
        }

        const imageId = registerJson?.id || registerJson?.imageId;

        if (!imageId) {
            return NextResponse.json(
                {
                    error: "Image registration response missing image id",
                    detail: JSON.stringify(registerJson, null, 2),
                },
                { status: 500 }
            );
        }

        // STEP 4: generate captions
        const captionsRes = await fetch(
            "https://api.almostcrackd.ai/pipeline/generate-captions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    imageId,
                }),
            }
        );

        const captionsText = await captionsRes.text();

        if (!captionsRes.ok) {
            return NextResponse.json(
                {
                    error: "Caption generation failed",
                    detail: captionsText,
                },
                { status: 500 }
            );
        }

        let captionsJson: any;
        try {
            captionsJson = JSON.parse(captionsText);
        } catch {
            return NextResponse.json(
                {
                    error: "Caption generation returned non-JSON response",
                    detail: captionsText,
                },
                { status: 500 }
            );
        }

        const captionRows: GeneratedCaptionRow[] = Array.isArray(captionsJson)
            ? captionsJson
            : [];

        const captions = captionRows
            .map((row) => row.content)
            .filter((x): x is string => typeof x === "string" && x.trim().length > 0);

        return NextResponse.json({
            ok: true,
            imageId,
            cdnUrl,
            captions,
        });
    }

    return NextResponse.json(
        { error: "Unsupported content type" },
        { status: 400 }
    );
}