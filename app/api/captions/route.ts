import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function isMissingColumnError(msg: string, colName: string) {
    return msg.toLowerCase().includes(`column captions.${colName}`.toLowerCase());
}

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
        return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const body = await req.json();
    const imageId = body.imageId as string;
    const raw = (body.text as string | undefined)?.trim();

    if (!imageId || !raw) {
        return NextResponse.json({ error: "Missing imageId or text" }, { status: 400 });
    }

    // Try common column names in order
    const attempts: Array<{ col: string; payload: any }> = [
        { col: "text", payload: { image_id: imageId, user_id: auth.user.id, text: raw } },
        { col: "caption", payload: { image_id: imageId, user_id: auth.user.id, caption: raw } },
        { col: "content", payload: { image_id: imageId, user_id: auth.user.id, content: raw } },
        { col: "body", payload: { image_id: imageId, user_id: auth.user.id, body: raw } },
    ];

    let lastErr: string | null = null;

    for (const a of attempts) {
        const { error } = await supabase.from("captions").insert(a.payload);
        if (!error) return NextResponse.json({ ok: true });

        lastErr = error.message;

        // If it's NOT a missing-column error, stop and return it
        const missing = isMissingColumnError(error.message, a.col);
        if (!missing) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        // else: keep trying next column name
    }

    return NextResponse.json(
        { error: lastErr ?? "Failed to insert caption" },
        { status: 500 }
    );
}
